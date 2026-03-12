const sql = require('mssql');
const { poolPromise } = require('../config/database'); // ตรวจสอบ path config database ว่าถูกต้อง

// --- Helper: Two-Way Division Mapping ---
// DB needs strings ('71DZ', '7122'), UI needs IDs ('2', '3')
const mapDivisionToDB = (div) => {
    const d = (div || '').toString().toUpperCase();
    if (d === '2' || d === 'PMC') return '71DZ';
    if (d === '3' || d === 'GM') return '7122';
    return div;
};

const mapDivisionToUI = (div) => {
    const d = (div || '').toString().toUpperCase();
    if (d === '71DZ' || d === 'PMC') return '2';
    if (d === '7122' || d === 'GM') return '3';
    return div;
};

/**
 * API: ดึงข้อมูล Division สำหรับ PC Plan
 * หน้าที่: ดึงข้อมูล Master ของแผนก (เช่น PMC, GM) เพื่อนำไปป้อนลงใน Dropdown เลือกแผนกหน้า PC Plan
 */
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

/**
 * API: ดึงข้อมูล Master Data รวมทั้งหมดตาม Division (Get Master Data By Division)
 * หน้าที่: ดึงข้อมูล Machines, Facilities, Processes และ PartNo
 * แบบรวดเดียว โดยอิงตาม Division ที่เลือก และรองรับ Mode ลดโหลด (FAST, SLOW, ALL)
 */
exports.getMasterDataByDivision = async (req, res) => {
    try {
        const divCode = req.params.divCode; // Now this is Division_Id
        const mode = req.query.mode || 'ALL'; // FAST, SLOW, ALL (Default)

        if (!divCode) {
            return res.status(400).send({ message: "Division is required." });
        }

        const pool = await poolPromise;
        console.log(`Fetching Master Data for Division_Id: ${divCode}, Mode: ${mode}...`);

        // Use updated SP: Stored_Get_Dropdown_PC_Plan_Data
        // Input: @Division_Id (INT), @Mode
        const result = await pool.request()
            .input('Division_Id', sql.Int, parseInt(divCode, 10))  // Now INT, not NVarChar
            .input('Mode', sql.NVarChar(10), mode)
            .execute('trans.Stored_Get_Dropdown_PC_Plan_Data');

        // Fetch Facility data specifically using Stored_Get_Dropdown_Facility_By_Division
        let profitCenter = '';
        if (divCode === '2') profitCenter = '71DZ'; // PMC -> 71DZ
        else if (divCode === '3') profitCenter = '7122'; // GM -> 7122
        else profitCenter = divCode;

        const facResult = await pool.request()
            .input('Profit_Center', sql.NVarChar(50), profitCenter)
            .execute('trans.Stored_Get_Dropdown_Facility_By_Division');

        let response = {};

        if (mode === 'FAST') {
            // Returns only Machine [0] from main SP, and facilities from facResult
            response = {
                machines: result.recordsets[0] || [],
                facilities: facResult.recordset || [],
                processes: [],
                partNos: [],
                partBefs: []
            };
        } else if (mode === 'SLOW') {
            // Returns Process [0] and PartNo [1] from main SP
            response = {
                machines: [],
                facilities: [],
                processes: result.recordsets[0] || [],
                partNos: result.recordsets[1] || [],
                partBefs: result.recordsets[1] || [] // Same as PartNo
            };
        } else {
            // ALL (Default) - Returns 4 sets order: MC, Fac(from main SP, skip), Process, PartNo
            // Instead of result.recordsets[1], we use facResult.recordset for facilities
            response = {
                machines: result.recordsets[0] || [],
                facilities: facResult.recordset || [],
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

/**
 * API: นำเข้า/เพิ่มแผนงาน PC Plan ใหม่ (Insert/Import PC Plan) 
 * หน้าที่: รับข้อมูลแบบ Array จากหน้าเว็บ (ดึงมาจากไฟล์ Excel หรือกด Add New) เพื่อทยอย Insert ลงฐานข้อมูล
 * และรองรับการจัดการ Revision ระบบแจ้งเตือน (Notification) แบบเปรียบเทียบ Before/After อัตโนมัติเวลาที่มีการแก้ไขแผน
 */
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

            // Strip the "PLAN-" prefix before sending to SQL.
            // The DB column [Unique_Id] is uniqueidentifier, so it stores only the raw UUID.
            const rawUniqueId = (item.uniqueId || '')
                .toString()
                .replace(/^PLAN-/i, '')  // remove prefix
                .trim() || null;

            return {
                PlanDate: new Date(item.date),
                Employee_ID: item.employeeId || '',
                Division: mapDivisionToDB(division),
                MC_Type: item.mcType || '',
                Facility: item.fac || '',
                Before_Part: item.partBefore || item.partBef || '',
                Process: item.process || '',
                MC_No: item.mcNo || '',
                PartNo: item.partNo || '',
                Bar_Type: item.barType || null,
                QTY: parseFloat(item.qty) || 0,
                Time: parseInt(item.time) || 0,
                Comment: item.comment || '',
                PlanStatus: status,
                GroupId: uniqueGroupId,
                Revision: item.revision, // Pass target revision
                Path_Dwg: (item.pathDwg && item.pathDwg !== '-') ? item.pathDwg : null,
                Path_Layout: (item.pathLayout && item.pathLayout !== '-') ? item.pathLayout : null,
                Path_IIQC: (item.iiqc && item.iiqc !== '-') ? item.iiqc : null,
                Unique_Id: rawUniqueId   // Raw UUID string (null if not present)
            };
        });

        const jsonString = JSON.stringify(jsonItems);

        // Call Snapshot SP (Generic for all divisions now)
        await pool.request()
            .input('JsonData', sql.NVarChar(sql.MAX), jsonString)
            .input('Division', sql.NVarChar(50), division)
            .input('TargetDate', sql.Date, new Date(sampleDate))
            .execute('trans.Stored_PCPlan_Insert_All_Snapshot_Excel');

        // ─────────────────────────────────────────────────────────────────────
        // STATUS_TO_PH PROPAGATION
        // After snapshot succeeds, update Status_To_PH on both request
        // document tables if the plan is linked via Unique_Id.
        // ─────────────────────────────────────────────────────────────────────
        const firstItem = items[0];
        const rawUniqueId = (firstItem.uniqueId || '')
            .toString()
            .replace(/^PLAN-/i, '')
            .trim();

        if (rawUniqueId) {
            try {
                let statusToPH = null;

                if (firstItem.planStatus === 'Cancelled') {
                    // 1. Cancellation → always set to 'Cancelled'
                    statusToPH = 'Cancelled';
                } else if (firstItem.revision > 0 && firstItem.groupId) {
                    // 2. Edit revision → check if key fields changed
                    const KEY_FIELDS = ['MC_Type', 'Bar_Type', 'Process', 'Before_Part', 'PartNo'];
                    const fieldMap_KeyOnly = {
                        'MC_Type': { newKey: 'mcType', transform: v => (v || '') },
                        'Bar_Type': { newKey: 'barType', transform: v => (v || '') },
                        'Process': { newKey: 'process', transform: v => (v || '') },
                        'Before_Part': { newKey: 'partBefore', transform: v => (v || '') },
                        'PartNo': { newKey: 'partNo', transform: v => (v || '') },
                    };

                    const histResult = await pool.request()
                        .input('GroupId', sql.NVarChar, firstItem.groupId)
                        .execute('trans.Stored_PCPlan_GetHistory');

                    const history = histResult.recordset || [];
                    const prevRevision = firstItem.revision - 1;
                    const oldRecord = history.find(h => h.Revision === prevRevision) || history[1]; // skip newest

                    if (oldRecord) {
                        const keyFieldChanged = KEY_FIELDS.some(dbField => {
                            const { newKey, transform } = fieldMap_KeyOnly[dbField];
                            const oldVal = String(transform(oldRecord[dbField]));
                            const newVal = String(transform(firstItem[newKey]));
                            return oldVal !== newVal;
                        });

                        if (keyFieldChanged) statusToPH = 'PC Edit';
                    }
                }

                if (statusToPH) {
                    await pool.request()
                        .input('Unique_Id', sql.NVarChar(100), rawUniqueId)
                        .input('NewStatus', sql.NVarChar(50), statusToPH)
                        .execute('trans.Stored_UpdateStatusToPH');
                    console.log(`[Status_To_PH] Updated to '${statusToPH}' for Unique_Id: ${rawUniqueId}`);
                }
            } catch (phErr) {
                // Non-blocking: log the error but don't fail the whole request
                console.error('[Status_To_PH] Failed to update status:', phErr.message);
            }
        }

        // === Notification Trigger (V2 + Details_JSON) ===
        try {
            const { emitNotification } = require('./Notification.controller');
            const firstItem = items[0];
            const isCancellation = firstItem.planStatus === 'Cancelled';
            const isRevision = firstItem.revision > 0;
            const userName = firstItem.employeeId || 'PC User';

            if (isCancellation) {
                const divisionName = firstItem.division === '2' ? 'PMC' : firstItem.division === '3' ? 'GM' : (firstItem.division || 'PC');
                const userRole = (req.user && req.user.Role) ? req.user.Role : 'PC';
                const cancelPlanDate = firstItem.date ? new Date(firstItem.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';
                const cancelPartNo = firstItem.partNo || '-';

                await emitNotification(req, pool, {
                    eventType: 'CANCEL_PLAN',
                    subject: `⚫ [Cancelled] Plan Deleted/Cancelled: ${firstItem.groupId}`,
                    messageEN: `The plan dated ${cancelPlanDate} for Part No. ${cancelPartNo} has been cancelled by the ${userRole} department (Action by: ${userName}).`,
                    messageTH: `แผนงานของวันที่ ${cancelPlanDate} ของ Part No. ${cancelPartNo} ถูกยกเลิกแผนงานโดยแผนก ${userRole} จากคุณ ${userName}`,
                    docNo: firstItem.groupId,
                    actionBy: userName,
                    targetRoles: 'ALL',
                    ctaRoute: '/pc/plan-list',
                    division: divisionName,
                    detailsJson: { type: 'cancel', items: jsonItems.slice(0, 10).map(ji => ({ ...ji, Division: divisionName })) }
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
                            'Bar_Type': { newKey: 'barType', transform: v => v || '' },
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

                // --- Dynamic Subject Title ---
                let subjectPrefix = 'Plan Revised';
                if (changes.length > 0) {
                    const labelMap = {
                        'PlanDate': 'Edit Date',
                        'MC_Type': 'Machine Type',
                        'Bar_Type': 'Bar Type',
                        'Facility': 'Facility',
                        'Before_Part': 'Part Before',
                        'Process': 'Process',
                        'MC_No': 'MC No',
                        'PartNo': 'Part No',
                        'QTY': 'QTY',
                        'Time': 'Time',
                        'Comment': 'Comment'
                    };
                    const labels = changes.map(c => labelMap[c.field] || c.field);

                    if (labels.length === 1) {
                        subjectPrefix = `Edit ${labels[0]}`;
                    } else if (labels.length === 2) {
                        subjectPrefix = `Edit ${labels[0]}, ${labels[1]}`;
                    } else {
                        subjectPrefix = `Edit ${labels[0]} and ${labels.length - 1} others`;
                    }
                }

                const planDateFormatted = firstItem.date ? new Date(firstItem.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';

                await emitNotification(req, pool, {
                    eventType: 'PLAN_REVISION',
                    subject: `🔵 [FYI] ${subjectPrefix}${firstItem.partNo ? ' - Part No. ' + firstItem.partNo : ''}`,
                    messageEN: `The plan for date ${planDateFormatted}, Part No. ${firstItem.partNo || '-'} has been revised by ${(req.user && req.user.Role) ? req.user.Role : 'PC'} (Action by: ${userName}).`,
                    messageTH: `แผนงานของวันที่ ${planDateFormatted} Part No. ${firstItem.partNo || '-'} ได้รับการแก้ไขโดยแผนก ${(req.user && req.user.Role) ? req.user.Role : 'PC'} จากคุณ ${userName}`,
                    docNo: firstItem.groupId,
                    actionBy: userName,
                    targetRoles: 'ALL',
                    ctaRoute: '/pc/plan-list',
                    division: firstItem.division === '2' ? 'PMC' : firstItem.division === '3' ? 'GM' : firstItem.division,
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
                const userName = items[0]?.employeeId || 'PC';
                const deptName = 'PC';

                const itemSummaries = jsonItems.slice(0, 20).map(ji => ({
                    // Define exact key order requested by user:
                    // PlanDate, PartNo, PartBefore(Before_Part), Process, MC_Type, Bar_Type, Fac(Facility), MC_No, QTY, Time, Comment
                    PlanDate: ji.PlanDate ? new Date(ji.PlanDate).toISOString().slice(0, 10) : '',
                    PartNo: ji.PartNo,
                    Before_Part: ji.Before_Part,
                    Process: ji.Process,
                    MC_Type: ji.MC_Type,
                    Bar_Type: ji.Bar_Type,
                    Facility: ji.Facility,
                    MC_No: ji.MC_No,
                    QTY: ji.QTY,
                    Time: ji.Time,
                    Comment: ji.Comment,
                    // Hidden fields for the top-level "Div > Fac" header
                    Division: ji.Division === '2' ? 'PMC' : ji.Division === '3' ? 'GM' : ji.Division
                }));

                const userRole = (req.user && req.user.Role) ? req.user.Role : 'PC';

                await emitNotification(req, pool, {
                    eventType: 'NEW_PLAN',
                    subject: `🔵 [FYI] New Initial Plan Imported: ${batchId}`,
                    messageEN: `A new plan with ${items.length} items has been imported into the system for ${divisionCode} by ${userRole} (Action by: ${userName}).`,
                    messageTH: `มีแผนงานใหม่จำนวน ${items.length} รายการ ได้ถูกนำเข้าสู่ระบบโดยแผนก ${userRole} จากคุณ ${userName}`,
                    docNo: batchId,
                    actionBy: userName,
                    targetRoles: 'ALL',
                    ctaRoute: '/pc/plan-list',
                    division: (firstItem.division || items[0]?.division) === '2' ? 'PMC' : (firstItem.division || items[0]?.division) === '3' ? 'GM' : (firstItem.division || items[0]?.division),
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

/**
 * API: อัปเดตข้อมูล PC Plan รายตัว (Update PC Plan In-Place)
 * หน้าที่: แก้ไขข้อมูลแผนงานเดิมโดยไม่สร้าง Revision ใหม่ (ใช้อัปเดตข้อมูลทั่วไปเช่น QTY, Time, Comment ฯลฯ)
 */
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
            .input('Division', sql.NVarChar(50), mapDivisionToDB(division || ''))
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

/**
 * API: ยกเลิก/ปรับสถานะแผนงาน PC Plan (Cancel PC Plan)
 * หน้าที่: อัปเดตสถานะของ Plan_ID นั้นให้เป็นยกเลิก (ใช้แทนการลบถาวร) พร้อมกับส่งแจ้งเตือน Notification
 */
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
                actionBy: req.headers['x-username'] || 'PC', // NEW: Read username from header
                targetRoles: 'ALL',
                ctaRoute: '/pc/plan-list',
                division: null
            });
        } catch (e) { console.error('Notify Error:', e); }

        res.status(200).json({ message: "Plan cancelled successfully", id, affectedRows });
    } catch (err) {
        console.error('Error cancelPCPlan:', err);
        res.status(500).send({ message: err.message });
    }
};

/**
 * API: ดึงรายการ PC Plan ทั้งหมด (Get PC Plan List)
 * หน้าที่: เรียกดูรายการแผนงาน PC Plan ทั้งหมดในระบบจากฐานข้อมูล รองรับพารามิเตอร์ showHistory เพื่อแยกดูตัวปัจจบัน หรือดูประวัติเก่า
 */
exports.getPlanList = async (req, res) => {
    try {
        const showHistory = req.query.showHistory === 'true'; // Check query param

        const pool = await poolPromise;
        const result = await pool.request()
            .input('ShowHistory', sql.Bit, showHistory ? 1 : 0)
            .execute('trans.Stored_PCPlan_Query');

        console.log(`[getPlanList] Rows fetched (History=${showHistory}):`, result.recordset.length); // DEBUG LOG

        // Reverse map the division codes for frontend UI compatibility
        const mappedResult = result.recordset.map(row => {
            return {
                ...row,
                Division: mapDivisionToUI(row.Division)
            };
        });

        res.status(200).json(mappedResult);
    } catch (err) {
        console.error('Error getPlanList:', err);
        res.status(500).send({ message: err.message });
    }
};

/**
 * API: ลบข้อมูล PC Plan แบบลบบางตัวหรือ Soft Delete (Delete PC Plan)
 * หน้าที่: ลบข้อมูลรายการที่มี Plan_ID ตรงกัน เปลี่ยนสถานะในระบบให้ไม่แสดงผล (Soft Delete)
 */
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

/**
 * API: ลบแผนงาน PC Plan ยกกลุ่ม (Delete PC Plan Group - All Revisions)
 * หน้าที่: ลบแผนงานใน GroupId เดียวกันแบบ Soft Delete (ลบประวัติ Revision ทั้งหมดของไอเทมนั้น) และส่ง Event แจ้งเตือนกระดานข่าว
 */
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
                actionBy: req.headers['x-username'] || 'PC', // NEW: Read username from header
                targetRoles: 'ALL',
                ctaRoute: '/pc/plan-list',
                division: groupId.includes('PLAN-2') ? 'PMC' : groupId.includes('PLAN-3') ? 'GM' : null
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

/**
 * API: ดึงประวัติการแก้ไข PC Plan ตาม GroupId (Get Plan History)
 * หน้าที่: ดึงข้อมูลรายการแผนงานเก่า (Revision เก่าๆ) ของไอเทมที่อยู่ใน GroupId นั้นมาแสดงให้ผู้ใช้ดูประวัติย้อนหลังได้
 */
exports.getPlanHistory = async (req, res) => {
    try {
        const { groupId } = req.params;
        if (!groupId) return res.status(400).send({ message: "GroupId is required" });

        const pool = await poolPromise;
        const result = await pool.request()
            .input('GroupId', sql.NVarChar, groupId)
            .execute('trans.Stored_PCPlan_GetHistory');

        // Reverse map the division codes for frontend UI compatibility
        const mappedResult = result.recordset.map(row => {
            return {
                ...row,
                Division: mapDivisionToUI(row.Division)
            };
        });

        res.status(200).json(mappedResult);
    } catch (err) {
        console.error('Error getPlanHistory:', err);
        res.status(500).send({ message: err.message });
    }
};

/**
 * API: อัปเดตเฉพาะเส้นทางไฟล์แนบ (Update Paths Only)
 * หน้าที่: อัปเดตลิงก์พาทของไฟล์เอกสารต่างๆ (Drawing, Layout, IIQC Table) แบบ In-place โดยไม่เปลี่ยน Revision 
 * พร้อมส่งแจ้งเตือน Notification หาคนอื่นเมื่อ Engineering หรือ QC เพิ่มเอกสาร
 */
exports.updatePaths = async (req, res) => {
    try {
        const { groupId, pathDwg, pathLayout, iiqc } = req.body;

        if (!groupId) return res.status(400).send({ message: "GroupId is required" });

        const pool = await poolPromise;

        // Fetch OLD record before update to build the "Edit" (Revision) Before/After table
        const oldResult = await pool.request()
            .input('GroupId', sql.NVarChar, groupId)
            .execute('trans.Stored_PCPlan_GetHistory');
        const oldRecord = oldResult.recordset && oldResult.recordset.length > 0 ? oldResult.recordset[0] : null;

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
                const planDateRaw = oldRecord ? oldRecord.PlanDate : null;
                const planDate = planDateRaw ? new Date(planDateRaw).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';
                const partNo = oldRecord ? oldRecord.PartNo : '-';

                const { emitNotification } = require('./Notification.controller');

                // Track new attachments (old was empty) vs edits (old had a value)
                let newAttachments = [];
                let editedAttachments = [];
                let changes = [];
                let actionBy = req.headers['x-username'] || 'EN'; // Default
                let deptName = 'EN';

                // Helper to check if a DB path is considered "empty"
                const isEmptyPath = (p) => !p || p.trim() === '' || p.trim() === '-';

                if (oldRecord) {
                    // Check Drawing
                    if (pathDwg !== undefined && pathDwg !== (oldRecord.Path_Dwg || '') && pathDwg !== '-') {
                        if (isEmptyPath(oldRecord.Path_Dwg)) {
                            newAttachments.push('Drawing');
                        } else {
                            editedAttachments.push('Drawing');
                            changes.push({ field: 'Drawing', old: oldRecord.Path_Dwg, new: pathDwg });
                        }
                    }

                    // Check Layout
                    if (pathLayout !== undefined && pathLayout !== (oldRecord.Path_Layout || '') && pathLayout !== '-') {
                        if (isEmptyPath(oldRecord.Path_Layout)) {
                            newAttachments.push('Layout');
                        } else {
                            editedAttachments.push('Layout');
                            changes.push({ field: 'Layout', old: oldRecord.Path_Layout, new: pathLayout });
                        }
                    }

                    // Check IIQC
                    if (iiqc !== undefined && iiqc !== (oldRecord.Path_IIQC || '') && iiqc !== '-') {
                        deptName = 'QC';
                        actionBy = req.headers['x-username'] || 'QC';
                        if (isEmptyPath(oldRecord.Path_IIQC)) {
                            newAttachments.push('IIQC');
                        } else {
                            editedAttachments.push('IIQC');
                            changes.push({ field: 'IIQC', old: oldRecord.Path_IIQC, new: iiqc });
                        }
                    }
                }

                // 1. Emit Notification for NEW Attachments
                if (newAttachments.length > 0) {
                    const docTypes = newAttachments.join(' & ');
                    let subjectMessage = newAttachments.length > 1 ? 'Drawing & Layout Attached' : `${newAttachments[0]} Attached`;
                    let attachedFilesList = [];
                    if (newAttachments.includes('Drawing')) attachedFilesList.push({ name: 'Drawing', url: pathDwg });
                    if (newAttachments.includes('Layout')) attachedFilesList.push({ name: 'Layout', url: pathLayout });
                    if (newAttachments.includes('IIQC')) attachedFilesList.push({ name: 'IIQC Table', url: iiqc });

                    let messageEN_new = deptName === 'QC'
                        ? `New document (IIQC) has been attached for the plan dated ${planDate}, Part No. ${partNo}, by the QC department (Action by: ${actionBy}).`
                        : `New document(s) (${docTypes}) have been attached for the plan dated ${planDate}, Part No. ${partNo}, by the EN department (Action by: ${actionBy}).`;

                    let messageTH_new = deptName === 'QC'
                        ? `มีการแนบไฟล์เอกสารใหม่ (IIQC) สำหรับแผนงานของวันที่ ${planDate} ของ Part No. ${partNo} โดยแผนก QC จากคุณ ${actionBy}`
                        : `มีการแนบไฟล์เอกสารใหม่ (${docTypes}) สำหรับแผนงานของวันที่ ${planDate} ของ Part No. ${partNo} โดยแผนก EN จากคุณ ${actionBy}`;

                    await emitNotification(req, pool, {
                        eventType: 'UPDATE_PLAN', // Standard text format 
                        subject: `🔵 [FYI] ${subjectMessage}`,
                        messageEN: messageEN_new,
                        messageTH: messageTH_new,
                        docNo: groupId,
                        actionBy: actionBy,
                        targetRoles: 'ALL',
                        ctaRoute: '/pc/plan-list',
                        division: groupId.includes('PLAN-2') ? 'PMC' : groupId.includes('PLAN-3') ? 'GM' : null,
                        detailsJson: {
                            type: 'update_plan',
                            AttachedFiles: attachedFilesList
                        }
                    });
                }

                // 2. Emit Notification for EDITED Attachments
                if (editedAttachments.length > 0 && changes.length > 0) {
                    const docTypes = editedAttachments.join(' and/or ');
                    let subjectMessage = editedAttachments.length > 1 ? 'Drawing & Layout Edited' : `${editedAttachments[0]} Edited`;

                    let attachedFilesList = [];
                    if (editedAttachments.includes('Drawing')) attachedFilesList.push({ name: 'Drawing', url: pathDwg });
                    if (editedAttachments.includes('Layout')) attachedFilesList.push({ name: 'Layout', url: pathLayout });
                    if (editedAttachments.includes('IIQC')) attachedFilesList.push({ name: 'IIQC Table', url: iiqc });

                    let messageEN_edit = deptName === 'QC'
                        ? `The IIQC document for the plan dated ${planDate}, Part No. ${partNo}, has been edited by the QC department (Action by: ${actionBy}).`
                        : `The ${docTypes} document(s) for the plan dated ${planDate}, Part No. ${partNo}, have been edited by the EN department (Action by: ${actionBy}).`;

                    let messageTH_edit = deptName === 'QC'
                        ? `มีการแก้ไขเอกสาร IIQC ของวันที่ ${planDate} ของ Part No. ${partNo} โดยแผนก QC จากคุณ ${actionBy}`
                        : `มีการแก้ไขเอกสาร ${docTypes.replace('and/or', 'และ/หรือ')} ของวันที่ ${planDate} ของ Part No. ${partNo} โดยแผนก EN จากคุณ ${actionBy}`;

                    await emitNotification(req, pool, {
                        eventType: 'PLAN_REVISION', // Revision format (Renders changes table)
                        subject: `🔵 [FYI] ${subjectMessage}`,
                        messageEN: messageEN_edit,
                        messageTH: messageTH_edit,
                        docNo: groupId,
                        actionBy: actionBy,
                        targetRoles: 'ALL',
                        ctaRoute: '/pc/plan-list',
                        division: groupId.includes('PLAN-2') ? 'PMC' : groupId.includes('PLAN-3') ? 'GM' : null,
                        detailsJson: {
                            type: 'revision', // Required for UI change table rendering
                            revision: oldRecord ? oldRecord.Revision : 0,
                            changes: changes,
                            AttachedFiles: attachedFilesList, // Provides clickable buttons under table
                            ...oldRecord
                        }
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
