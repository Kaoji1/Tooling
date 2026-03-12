const sql = require('mssql');
const { poolPromise } = require('./src/config/database');

async function testDiff() {
    try {
        const pool = await poolPromise;
        const groupId = 'PLAN-2-260311-0818-2-12'; // From DB

        // Mock exact payload frontend sends when editing
        const firstItem = {
            date: '2026-03-26',
            employeeId: 'PC User',
            divisionCode: '7122',
            division: '2',
            mcType: 'CNC',
            barType: null,
            fac: 'F.6',
            partBefore: '',
            mcNo: 'MC123',
            partNo: 'T7175BM1A',
            process: 'F&BORING',
            qty: 100, // Maybe changed? Let's say we change qty to 200
            time: 480,
            comment: 'Test comment',
            pathDwg: '',
            pathLayout: '',
            iiqc: '',
            groupId: groupId,
            revision: 1, // sending 1
            planStatus: 'Active',
            uniqueId: null
        };

        const histResult = await pool.request()
            .input('GroupId', sql.NVarChar, firstItem.groupId)
            .execute('trans.Stored_PCPlan_GetHistory');

        const history = histResult.recordset || [];
        console.log("History records:", history.map(h => ({ Plan_ID: h.Plan_ID, Revision: h.Revision, QTY: h.QTY, Time: h.Time })));

        const prevRevision = firstItem.revision - 1; // 0
        const oldRecord = history.find(h => h.Revision === prevRevision) || history[0];

        console.log("Found oldRecord Revision:", oldRecord ? oldRecord.Revision : 'none');

        let changes = [];
        if (oldRecord) {
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

            for (const [dbField, { newKey, transform }] of Object.entries(fieldMap)) {
                const oldVal = transform(oldRecord[dbField]);
                const newVal = transform(firstItem[newKey]);
                const oldStr = String(oldVal);
                const newStr = String(newVal);

                if (oldStr !== newStr) {
                    changes.push({ field: dbField, old: oldStr, new: newStr, rawOld: oldRecord[dbField], rawNew: firstItem[newKey] });
                }
            }
        }

        console.log("Changes calculated:", changes);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

testDiff();
