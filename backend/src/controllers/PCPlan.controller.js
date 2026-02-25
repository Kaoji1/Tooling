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
        const divisionCode = items[0].division || 'Unknown';
        console.log(`[insertPCPlan] Received Division: ${divisionCode}, Sample Date: ${sampleDate}`);

        // Generate Batch ID for tracing, but GroupId will be unique per item for TRUE revision tracking
        const dateObj = new Date();
        const yymmdd = dateObj.toISOString().slice(2, 10).replace(/-/g, '');
        const hhmm = dateObj.toTimeString().slice(0, 5).replace(/:/g, '');
        const batchId = `PLAN-${division}-${yymmdd}-${hhmm}`;

        // ============================================
        // ALL DIVISIONS LOGIC: SNAPSHOT REVISON
        // ============================================
        console.log(`Processing Snapshot for Div: ${division}, Date: ${sampleDate}, BatchID: ${batchId}`);

        // Prepare JSON Data
        const jsonItems = items.map((item, index) => {
            // Priority: 1. status from payload, 2. comment keyword, 3. default 'Active'
            let status = item.planStatus || 'Active';
            const comment = (item.comment || '').toLowerCase();

            if (!item.planStatus && (comment.includes('cancel') || comment.includes('ยกเลิก'))) {
                status = 'Cancelled';
            }

            // --- CRITICAL: UNIQUE GROUP ID PER ITEM ---
            // If it's a new item (no groupId), we generate a unique ID.
            // This prevents "batch overlap" where editing one item affects others.
            // We can prefix it with batchId for traceability if we want, but GUID (NEWID) is safer.
            const uniqueGroupId = item.groupId || `${batchId}-${index}-${Math.floor(Math.random() * 1000)}`;

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
                GroupId: uniqueGroupId,
                Revision: item.revision, // Pass target revision
                Path_Dwg: (item.pathDwg && item.pathDwg !== '-') ? item.pathDwg : null,
                Path_Layout: (item.pathLayout && item.pathLayout !== '-') ? item.pathLayout : null,
                Path_IIQC: (item.iiqc && item.iiqc !== '-') ? item.iiqc : null
            };
        });

        const jsonString = JSON.stringify(jsonItems);

        // Call Snapshot SP (Generic for all divisions now)
        await pool.request()
            .input('JsonData', sql.NVarChar(sql.MAX), jsonString)
            .input('Division', sql.NVarChar(50), division)
            .input('TargetDate', sql.Date, new Date(sampleDate))
            .execute('trans.Stored_PCPlan_Insert_All_Snapshot_Excel');

        // === Notification Trigger (V2 + Details_JSON) ===
        try {
            const { emitNotification } = require('./Notification.controller');
            const firstItem = items[0];
            const isCancellation = firstItem.planStatus === 'Cancelled';
            const isRevision = firstItem.revision > 0;
            const userName = firstItem.employeeId || 'PC User';

            if (isCancellation) {
                await emitNotification(req, pool, {
                    eventType: 'CANCEL_PLAN',
                    subject: `⚫ [Cancelled] Plan Deleted/Cancelled: ${firstItem.groupId}`,
                    messageEN: `The plan ${firstItem.groupId} has been cancelled or deleted from the system by ${userName}.`,
                    messageTH: `แผนงานเลขที่ ${firstItem.groupId} ได้ถูกยกเลิกหรือลบออกจากระบบโดย ${userName}`,
                    docNo: firstItem.groupId,
                    actionBy: userName,
                    targetRoles: 'ALL',
                    ctaRoute: '/pc/plan-list',
                    detailsJson: { type: 'cancel', items: jsonItems.slice(0, 10) }
                });

            } else if (isRevision) {
                // ── Dynamic Before/After Comparison ──
                // Fetch OLD record from DB by GroupId (previous revision)
                let changes = [];
                try {
                    const histResult = await pool.request()
                        .input('GroupId', sql.NVarChar, firstItem.groupId)
                        .execute('trans.Stored_PCPlan_GetHistory');

                    const history = histResult.recordset || [];
                    // Get the PREVIOUS revision (sort by revision desc, skip the latest which is the one we just inserted)
                    const prevRevision = firstItem.revision - 1;
                    const oldRecord = history.find(h => h.Revision === prevRevision) || history[0];

                    if (oldRecord) {
                        // Map of DB column names -> request body field names
                        const fieldMap = {
                            'PlanDate': { newKey: 'date', transform: v => v ? new Date(v).toISOString().slice(0, 10) : '' },
                            'MC_Type': { newKey: 'mcType', transform: v => v || '' },
                            'Facility': { newKey: 'fac', transform: v => v || '' },
                            'Before_Part': { newKey: 'partBefore', transform: v => v || '' },
                            'Process': { newKey: 'process', transform: v => v || '' },
                            'MC_No': { newKey: 'mcNo', transform: v => v || '' },
                            'PartNo': { newKey: 'partNo', transform: v => v || '' },
                            'QTY': { newKey: 'qty', transform: v => parseFloat(v) || 0 },
                            'Time': { newKey: 'time', transform: v => parseInt(v) || 0 },
                            'Comment': { newKey: 'comment', transform: v => v || '' }
                        };

                        // Dynamically compare every mapped field
                        for (const [dbField, { newKey, transform }] of Object.entries(fieldMap)) {
                            const oldVal = transform(oldRecord[dbField]);
                            const newVal = transform(firstItem[newKey]);
                            const oldStr = String(oldVal);
                            const newStr = String(newVal);

                            if (oldStr !== newStr) {
                                changes.push({ field: dbField, old: oldVal, new: newVal });
                            }
                        }
                    }
                } catch (diffErr) {
                    console.error('[Notification] Diff comparison failed:', diffErr);
                    // Fallback: send basic info without diff
                }

                await emitNotification(req, pool, {
                    eventType: 'PLAN_REVISION',
                    subject: `🔵 [FYI] Plan Revised: ${firstItem.groupId}`,
                    messageEN: `Plan ${firstItem.groupId} has been updated to Revision ${firstItem.revision}. Comment: ${firstItem.comment || '-'}`,
                    messageTH: `แผนงาน ${firstItem.groupId} ได้รับการแก้ไขเป็น Revision ${firstItem.revision} หมายเหตุ: ${firstItem.comment || '-'}`,
                    docNo: firstItem.groupId,
                    actionBy: userName,
                    targetRoles: 'ALL',
                    ctaRoute: '/pc/plan-list',
                    detailsJson: {
                        type: 'revision',
                        revision: firstItem.revision,
                        changes: changes,
                        newValues: jsonItems[0] || {}
                    }
                });

            } else {
                // ── NEW_PLAN: Capture full item details ──
                // Build a clean summary of all imported items (cap at 20 for payload size)
                const itemSummaries = jsonItems.slice(0, 20).map(ji => ({
                    PlanDate: ji.PlanDate ? new Date(ji.PlanDate).toISOString().slice(0, 10) : '',
                    MC_Type: ji.MC_Type,
                    Facility: ji.Facility,
                    Process: ji.Process,
                    MC_No: ji.MC_No,
                    Before_Part: ji.Before_Part,
                    PartNo: ji.PartNo,
                    QTY: ji.QTY,
                    Time: ji.Time,
                    Comment: ji.Comment
                }));

                await emitNotification(req, pool, {
                    eventType: 'NEW_PLAN',
                    subject: `🔵 [FYI] New Initial Plan Imported: ${batchId}`,
                    messageEN: `A new PC Plan ${batchId} has been imported into the system by the PC department. Total items: ${items.length}.`,
                    messageTH: `แผนงานใหม่ เลขที่ ${batchId} จำนวน ${items.length} รายการ ได้ถูกนำเข้าสู่ระบบโดยแผนก PC`,
                    docNo: batchId,
                    actionBy: 'PC',
                    targetRoles: 'ALL',
                    ctaRoute: '/pc/plan-list',
                    detailsJson: {
                        type: 'new_plan',
                        totalItems: items.length,
                        items: itemSummaries
                    }
                });
            }
        } catch (notifyErr) {
            console.error('Notification Error:', notifyErr);
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
// 3.5 Update an existing PC Plan IN-PLACE (No new revision)
exports.updatePCPlan = async (req, res) => {
    try {
        const { id, date, division, mcType, fac, partBefore, process, mcNo, partNo, qty, time, comment, pathDwg, pathLayout, iiqc } = req.body;

        if (!id) {
            return res.status(400).send({ message: "Plan ID is required." });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('Plan_ID', sql.Int, id)
            .input('PlanDate', sql.Date, date ? new Date(date) : new Date())
            .input('Division', sql.NVarChar(50), division || '')
            .input('MC_Type', sql.NVarChar(50), mcType || '')
            .input('Facility', sql.NVarChar(50), fac || '')
            .input('Before_Part', sql.NVarChar(100), partBefore || '')
            .input('Process', sql.NVarChar(50), process || '')
            .input('MC_No', sql.NVarChar(50), mcNo || '')
            .input('PartNo', sql.NVarChar(100), partNo || '')
            .input('QTY', sql.Int, parseInt(qty) || 0)
            .input('Time', sql.Int, parseInt(time) || 0)
            .input('Comment', sql.NVarChar(sql.MAX), comment || '')
            .input('Path_Dwg', sql.NVarChar(500), (pathDwg && pathDwg !== '-') ? pathDwg : null)
            .input('Path_Layout', sql.NVarChar(500), (pathLayout && pathLayout !== '-') ? pathLayout : null)
            .input('Path_IIQC', sql.NVarChar(500), (iiqc && iiqc !== '-') ? iiqc : null)
            .execute('trans.Stored_PCPlan_Update');

        const affectedRows = result.recordset[0]?.AffectedRows || 0;
        console.log(`[updatePCPlan] Plan_ID: ${id}, Affected: ${affectedRows}`);

        if (affectedRows === 0) {
            return res.status(404).send({ message: "No plan found with the given ID." });
        }

        res.status(200).json({ message: "Plan updated successfully", id, affectedRows });
    } catch (err) {
        console.error('Error updatePCPlan:', err);
        res.status(500).send({ message: err.message });
    }
};

// 3.6 Cancel an existing PC Plan IN-PLACE (Just change status)
exports.cancelPCPlan = async (req, res) => {
    try {
        const id = req.params.id;

        if (!id) {
            return res.status(400).send({ message: "Plan ID is required." });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('Plan_ID', sql.Int, id)
            .execute('trans.Stored_PCPlan_Cancel');

        const affectedRows = result.recordset[0]?.AffectedRows || 0;
        console.log(`[cancelPCPlan] Plan_ID: ${id}, Affected: ${affectedRows}`);

        if (affectedRows === 0) {
            return res.status(404).send({ message: "No plan found with the given ID." });
        }

        // === Notification Trigger (V2) ===
        try {
            const { emitNotification } = require('./Notification.controller');
            await emitNotification(req, pool, {
                eventType: 'CANCEL_PLAN',
                subject: `⚫ [Cancelled] Plan Deleted/Cancelled: ${id}`,
                messageEN: `The plan ${id} has been cancelled from the system by PC User.`,
                messageTH: `แผนงานเลขที่ ${id} ได้ถูกยกเลิกจากระบบโดย PC User`,
                docNo: String(id),
                actionBy: 'PC',
                targetRoles: 'ALL',
                ctaRoute: '/pc/plan-list'
            });
        } catch (e) { console.error('Notify Error:', e); }

        res.status(200).json({ message: "Plan cancelled successfully", id, affectedRows });
    } catch (err) {
        console.error('Error cancelPCPlan:', err);
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

        // === Notification Trigger (V2) ===
        try {
            const { emitNotification } = require('./Notification.controller');
            await emitNotification(req, pool, {
                eventType: 'CANCEL_PLAN',
                subject: `⚫ [Cancelled] Plan Deleted/Cancelled: ${groupId}`,
                messageEN: `The plan ${groupId} has been cancelled or deleted from the system by an authorized user.`,
                messageTH: `แผนงานเลขที่ ${groupId} ได้ถูกยกเลิกหรือลบออกจากระบบโดยผู้มีสิทธิ์`,
                docNo: groupId,
                actionBy: 'PC',
                targetRoles: 'ALL',
                ctaRoute: '/pc/plan-list'
            });
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
        const result = await pool.request()
            .input('GroupId', sql.NVarChar, groupId)
            .input('Path_Dwg', sql.NVarChar, pathDwg || null)
            .input('Path_Layout', sql.NVarChar, pathLayout || null)
            .input('Path_IIQC', sql.NVarChar, iiqc || null)
            .execute('trans.Stored_PCPlan_Update_Paths');

        const affectedRows = result.rowsAffected[0] || 0;
        console.log(`[updatePaths] GroupId: ${groupId}, Affected Rows: ${affectedRows}`);

        // === Notification Trigger (V2 - Only if rows actually updated) ===
        if (affectedRows > 0) {
            try {
                const { emitNotification } = require('./Notification.controller');
                let attachedFiles = [];
                let deptName = 'Engineering';

                if (pathDwg && pathDwg !== '-') attachedFiles.push('Drawing');
                if (pathLayout && pathLayout !== '-') attachedFiles.push('Layout');
                if (iiqc && iiqc !== '-') {
                    attachedFiles.push('IIQC Table');
                    deptName = 'QC';
                }

                if (attachedFiles.length > 0) {
                    await emitNotification(req, pool, {
                        eventType: 'UPDATE_PLAN',
                        subject: `🔵 [FYI] Document Attached for Plan: ${groupId}`,
                        messageEN: `New documents (${attachedFiles.join(' & ')}) have been attached to plan ${groupId} by ${deptName}.`,
                        messageTH: `มีการแนบไฟล์เอกสารใหม่ (${attachedFiles.join(' & ')}) สำหรับแผนงาน ${groupId} โดย ${deptName}`,
                        docNo: groupId,
                        actionBy: deptName,
                        targetRoles: 'ALL',
                        ctaRoute: '/pc/plan-list'
                    });
                }
            } catch (e) { console.error('Notify Error:', e); }
        }

        res.status(200).json({
            message: affectedRows > 0 ? "Paths updated successfully" : "No records satisfied update criteria",
            affectedRows: affectedRows
        });
    } catch (err) {
        console.error('Error updatePaths:', err);
        res.status(500).send({ message: err.message });
    }
};
