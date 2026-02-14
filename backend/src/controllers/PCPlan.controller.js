const sql = require('mssql');
const { poolPromise } = require('../config/database'); // ตรวจสอบ path config database ว่าถูกต้อง

// 1. ฟังก์ชันดึง Division (สำหรับ Dropdown เลือกแผนก)
exports.getDivisions = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .execute('trans.Stored_Get_Dropdown_PC_Plan_Division');

        console.log(`[getDivisions] Sending ${result.recordset.length} divisions to frontend`);
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('Error getDivisions:', err);
        res.status(500).send({ message: err.message });
    }
};

// 2. ฟังก์ชันดึง Master Data รวม (Machines, Facilities, Processes, PartNos) ตาม Division ที่เลือก
exports.getMasterDataByDivision = async (req, res) => {
    try {
        const divCode = req.params.divCode; // Now this is Division_Id
        const mode = req.query.mode || 'ALL'; // FAST, SLOW, ALL (Default)

        if (!divCode) {
            return res.status(400).send({ message: "Division is required." });
        }

        const pool = await poolPromise;
        console.log(`Fetching Master Data for Division_Id: ${divCode}, Mode: ${mode}...`);

        // Use new SP: Stored_Get_Dropdown_PC_Plan_Data
        // Input: @Division_Id, @Mode
        const result = await pool.request()
            .input('Profit_Center', sql.NVarChar(50), divCode)
            .input('Mode', sql.NVarChar(10), mode)
            .execute('trans.Stored_Get_Dropdown_PC_Plan_Data');

        let response = {};

        if (mode === 'FAST') {
            // Returns only Machine [0] and Facility [1]
            response = {
                machines: result.recordsets[0] || [],
                facilities: result.recordsets[1] || [],
                processes: [],
                partNos: [],
                partBefs: []
            };
        } else if (mode === 'SLOW') {
            // Returns Process [0] and PartNo [1] (because FAST parts are skipped)
            // Wait, if SP logic uses IF blocks, recordsets indices might shift.
            // Let's check SP again.
            // IF FAST: Select 1, Select 2
            // IF SLOW: Select 3, Select 4
            // So if SLOW, recordsets[0] is Process, recordsets[1] is PartNo
            response = {
                machines: [],
                facilities: [],
                processes: result.recordsets[0] || [],
                partNos: result.recordsets[1] || [],
                partBefs: result.recordsets[1] || [] // Same as PartNo
            };
        } else {
            // ALL (Default) - Returns 4 sets order: MC, Fac, Process, PartNo
            response = {
                machines: result.recordsets[0] || [],
                facilities: result.recordsets[1] || [],
                processes: result.recordsets[2] || [],
                partNos: result.recordsets[3] || [],
                partBefs: result.recordsets[3] || []
            };
        }

        res.status(200).json(response);

    } catch (err) {
        console.error('Error getMasterDataByDivision:', err);
        res.status(500).send({ message: err.message });
    }
};

// 5. ฟังก์ชันเพิ่มรายการ PC Plan ใหม่ (Import Excel / Add New) -> Revert to Basic Insert
// 5. ฟังก์ชันเพิ่มรายการ PC Plan ใหม่ (Import Excel / Add New) -> Revision Aware
exports.insertPCPlan = async (req, res) => {
    try {
        const items = req.body;
        if (!Array.isArray(items)) {
            return res.status(400).send({ message: "Data must be an array." });
        }

        if (items.length === 0) {
            return res.status(200).send({ message: "No items to process.", successCount: 0 });
        }

        const pool = await poolPromise;

        // 1. ตรวจสอบ Division จากไอเท็มแรก (สมมติว่ามาเป็น Batch เดียวกัน)
        // ตอนนี้ Frontend ส่ง Division_Id มา (2=PMC, 3=GM)
        const division = items[0].division || 'Unknown';

        // รองรับทั้ง Division_Id และค่าเก่า (Profit_Center/Name)
        const isPMC = (
            division === '2' ||                    // Division_Id for PMC
            division.toUpperCase() === 'PMC' ||
            division === '71DZ'
        );

        // ตรวจสอบ PlanDate เพื่อใช้ในการ Snapshot (สมมติว่าเป็นเดือนเดียวกันหมด)
        // ตรวจสอบ PlanDate เพื่อใช้ในการ Snapshot (สมมติว่าเป็นเดือนเดียวกันหมด)
        const sampleDate = items[0].date;

        // Generate Readable Batch ID (Plan ID) for this Transaction
        // Format: PLAN-{Division}-{YYMMDD}-{HHmm}
        // Example: PLAN-71DZ-260214-0930
        const dateObj = new Date();
        const yymmdd = dateObj.toISOString().slice(2, 10).replace(/-/g, ''); // 260214
        const hhmm = dateObj.toTimeString().slice(0, 5).replace(/:/g, '');   // 0930
        const batchId = `PLAN-${division}-${yymmdd}-${hhmm}`;

        // ============================================
        // ALL DIVISIONS LOGIC: SNAPSHOT REVISON
        // ============================================
        console.log(`Processing Snapshot for Div: ${division}, Date: ${sampleDate}, BatchID: ${batchId}`);

        // Prepare JSON Data
        const jsonItems = items.map(item => {
            let status = 'Active';
            const comment = (item.comment || '').toLowerCase();

            // ตรวจสอบคำว่า Cancel ใน Comment
            if (comment.includes('cancel') || comment.includes('ยกเลิก')) {
                status = 'Cancelled';
            }

            return {
                PlanDate: new Date(item.date),
                Employee_ID: item.employeeId || '',
                Division: division,
                MC_Type: item.mcType || '',
                Facility: item.fac || '',
                Before_Part: item.partBefore || item.partBef || '',
                Process: item.process || '',
                MC_No: item.mcNo || '',
                PartNo: item.partNo || '',
                QTY: parseFloat(item.qty) || 0,
                Time: parseInt(item.time) || 0,
                Comment: item.comment || '',
                PlanStatus: status,
                // If item has no GroupId (New), assign the BatchId. If editing, keep existing.
                GroupId: item.groupId || batchId,
                Path_Dwg: item.pathDwg || null,
                Path_Layout: item.pathLayout || null,
                Path_IIQC: item.iiqc || null
            };
        });

        const jsonString = JSON.stringify(jsonItems);

        // Call Snapshot SP (Generic for all divisions now)
        await pool.request()
            .input('JsonData', sql.NVarChar(sql.MAX), jsonString)
            .input('Division', sql.NVarChar(50), division)
            .input('TargetDate', sql.Date, new Date(sampleDate))
            .execute('trans.Stored_PCPlan_Insert_PMC_Snapshot');

        // === Notification Trigger ===
        try {
            const io = req.app.get('socketio');
            // Use the BatchID in the message for specificity
            const notifyMsg = `New Plan: ${batchId} (Qty: ${items.length})`;

            // 1. Save to DB
            await pool.request()
                .input('Event_Type', sql.NVarChar, 'NEW_PLAN')
                .input('Message', sql.NVarChar, notifyMsg)
                .input('Doc_No', sql.NVarChar, batchId) // Use BatchID as Doc Ref
                .input('Action_By', sql.NVarChar, 'PC') // Todo: Get from req.user
                .execute('trans.Stored_Insert_Notification_Log');

            // 2. Emit Socket Event
            if (io) {
                io.emit('notification', {
                    type: 'NEW_PLAN',
                    message: notifyMsg,
                    docNo: batchId, // Send DocNo for frontend popup
                    timestamp: new Date()
                });
                console.log(`[Notification] Emitted: ${notifyMsg}`);
            }
        } catch (notifyErr) {
            console.error('Notification Error:', notifyErr);
            // Don't fail the main request just because notification failed
        }

        return res.status(200).send({
            message: `Snapshot processed for ${division}. Rev updated for ${items.length} items.`,
            successCount: items.length,
            errorCount: 0
        });

    } catch (err) {
        console.error('Error insertPCPlan:', err);
        res.status(500).send({ message: err.message });
    }
};

// 4. ฟังก์ชันดึงรายการ PC Plan ทั้งหมด (Get List)
exports.getPlanList = async (req, res) => {
    try {
        const showHistory = req.query.showHistory === 'true'; // Check query param

        const pool = await poolPromise;
        const result = await pool.request()
            .input('ShowHistory', sql.Bit, showHistory ? 1 : 0)
            .execute('trans.Stored_PCPlan_Query');

        console.log(`[getPlanList] Rows fetched (History=${showHistory}):`, result.recordset.length); // DEBUG LOG
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('Error getPlanList:', err);
        res.status(500).send({ message: err.message });
    }
};

// 5. ฟังก์ชันลบข้อมูล PC Plan (Delete) -> Soft Delete
exports.deletePCPlan = async (req, res) => {
    try {
        const id = req.params.id;

        if (!id) {
            return res.status(400).send({ message: "Plan ID is required." });
        }

        const pool = await poolPromise;
        await pool.request()
            .input('Plan_ID', sql.Int, id) // Correct Parameter Name
            .execute('trans.Stored_PCPlan_Delete'); // Correct SP for Hard Delete

        res.status(200).json({ message: "Deleted successfully", id: id });

    } catch (err) {
        console.error('Error deletePCPlan:', err);
        res.status(500).send({ message: err.message });
    }
};

// 6. ฟังก์ชันลบข้อมูล PC Plan (Delete Group - All Revisions) -> Soft Delete
exports.deletePCPlanGroup = async (req, res) => {
    try {
        const groupId = req.params.groupId;

        if (!groupId) {
            return res.status(400).send({ message: "GroupId is required." });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('GroupId', sql.NVarChar(50), groupId)
            .execute('trans.Stored_PCPlan_Delete_Group');

        console.log(`[deletePCPlanGroup] GroupId: ${groupId}, Deleted Rows: ${result.rowsAffected[0]}`);

        // === Notification Trigger ===
        try {
            const io = req.app.get('socketio');
            const notifyMsg = `Plan Deleted: Group ${groupId}`;

            await pool.request()
                .input('Event_Type', sql.NVarChar, 'CANCEL_PLAN')
                .input('Message', sql.NVarChar, notifyMsg)
                .input('Doc_No', sql.NVarChar, groupId)
                .input('Action_By', sql.NVarChar, 'PC')
                .execute('trans.Stored_Insert_Notification_Log');

            if (io) {
                io.emit('notification', {
                    type: 'CANCEL_PLAN',
                    message: notifyMsg,
                    timestamp: new Date()
                });
            }
        } catch (e) { console.error('Notify Error:', e); }

        res.status(200).json({
            message: "Group deleted successfully",
            groupId: groupId,
            deletedCount: result.rowsAffected[0]
        });

    } catch (err) {
        console.error('Error deletePCPlanGroup:', err);
        res.status(500).send({ message: err.message });
    }
};

// 6. ฟังก์ชันดึงประวัติการแก้ไข (History) ตาม GroupId
exports.getPlanHistory = async (req, res) => {
    try {
        const { groupId } = req.params;
        if (!groupId) return res.status(400).send({ message: "GroupId is required" });

        const pool = await poolPromise;
        const result = await pool.request()
            .input('GroupId', sql.NVarChar, groupId)
            .execute('trans.Stored_PCPlan_GetHistory');

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('Error getPlanHistory:', err);
        res.status(500).send({ message: err.message });
    }
};

// 7. Update Paths Only (No Revision)
exports.updatePaths = async (req, res) => {
    try {
        const { groupId, pathDwg, pathLayout, iiqc } = req.body;

        if (!groupId) return res.status(400).send({ message: "GroupId is required" });

        const pool = await poolPromise;
        await pool.request()
            .input('GroupId', sql.NVarChar, groupId)
            .input('Path_Dwg', sql.NVarChar, pathDwg || null)
            .input('Path_Layout', sql.NVarChar, pathLayout || null)
            .input('Path_IIQC', sql.NVarChar, iiqc || null)
            .execute('trans.Stored_PCPlan_Update_Paths');

        res.status(200).json({ message: "Paths updated successfully" });
    } catch (err) {
        console.error('Error updatePaths:', err);
        res.status(500).send({ message: err.message });
    }
};