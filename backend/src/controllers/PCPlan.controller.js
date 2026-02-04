const sql = require('mssql');
const { poolPromise } = require('../config/database'); // ตรวจสอบ path config database ว่าถูกต้อง

// 1. ฟังก์ชันดึง Division (สำหรับ Dropdown เลือกแผนก)
exports.getDivisions = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .execute('trans.Stored_Get_Dropdown_PC_Plan_Division');

        // Return: Division_Id, Profit_Center, Division_Name
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

        if (!divCode) {
            return res.status(400).send({ message: "Division is required." });
        }

        const pool = await poolPromise;
        console.log(`Fetching Master Data for Division_Id: ${divCode}...`);

        // Use new SP: Stored_Get_Dropdown_PC_Plan_Data
        // Input: @Division_Id
        // Output: 4 Tables (0=MC, 1=Facility, 2=Process, 3=PartNo)
        const result = await pool.request()
            .input('Division_Id', sql.NVarChar(50), divCode)
            .execute('trans.Stored_Get_Dropdown_PC_Plan_Data');

        // New Mapping:
        // recordsets[0] = MC
        // recordsets[1] = Facility
        // recordsets[2] = Process
        // recordsets[3] = PartNo
        const machines = result.recordsets[0] || [];
        const facilities = result.recordsets[1] || [];
        const processes = result.recordsets[2] || [];
        const partNos = result.recordsets[3] || [];

        res.status(200).json({
            machines,
            facilities,
            processes,
            partNos,
            partBefs: partNos // Use same list for Part Before
        });

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
        const sampleDate = items[0].date;

        if (isPMC) {
            // ============================================
            // PMC LOGIC: SNAPSHOT REVISON
            // ============================================
            console.log(`Processing PMC Snapshot for Div: ${division}, Date: ${sampleDate}`);

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
                    GroupId: item.groupId || null, // Send GroupId if available
                    Path_Dwg: item.pathDwg || null,
                    Path_Layout: item.pathLayout || null,
                    Path_IIQC: item.iiqc || null
                };
            });

            const jsonString = JSON.stringify(jsonItems);

            // Call Snapshot SP
            await pool.request()
                .input('JsonData', sql.NVarChar(sql.MAX), jsonString)
                .input('Division', sql.NVarChar(50), division)
                .input('TargetDate', sql.Date, new Date(sampleDate))
                .execute('trans.Stored_PCPlan_Insert_PMC_Snapshot');

            return res.status(200).send({
                message: `PMC Snapshot processed. Rev updated for ${items.length} items.`,
                successCount: items.length,
                errorCount: 0
            });

        } else {
            // ============================================
            // GM/Others LOGIC: OVERWRITE (Classic)
            // ============================================
            console.log(`Processing Classic Overwrite for Div: ${division}`);

            let successCount = 0;
            let errorCount = 0;

            for (const item of items) {
                try {
                    const request = pool.request();
                    request.input('PlanDate', sql.Date, new Date(item.date));
                    request.input('Employee_ID', sql.NVarChar(50), item.employeeId || '');
                    request.input('Division', sql.NVarChar(50), item.division || '');
                    request.input('MC_Type', sql.NVarChar(50), item.mcType || '');
                    request.input('Facility', sql.NVarChar(50), item.fac || '');
                    request.input('Before_Part', sql.NVarChar(50), item.partBefore || item.partBef || '');
                    request.input('Process', sql.NVarChar(50), item.process || '');
                    request.input('MC_No', sql.NVarChar(50), item.mcNo || '');
                    request.input('PartNo', sql.NVarChar(50), item.partNo || '');
                    request.input('QTY', sql.Float, parseFloat(item.qty) || 0);
                    request.input('Time', sql.Int, parseInt(item.time) || 0);
                    request.input('Comment', sql.NVarChar(255), item.comment || '');

                    // ใช้ SP Insert_GM ที่สร้างใหม่ (หรือใช้ตัวเดิมก็ได้ แต่แนะให้ใช้ตัวใหม่ที่มี Update logic)
                    await request.execute('trans.Stored_PCPlan_Insert_GM');

                    successCount++;
                } catch (err) {
                    console.error('Error inserting item:', item, err);
                    errorCount++;
                }
            }

            return res.status(200).send({
                message: `Process complete (Overwrite). Success: ${successCount}, Failed: ${errorCount}`,
                successCount,
                errorCount
            });
        }

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