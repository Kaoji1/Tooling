const { poolPromise } = require("../config/database");
const Type = require("mssql").TYPES;
const sql = require("mssql");

// 1. Get Dropdown Division
exports.getDivisions = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .execute('trans.Stored_Get_Dropdown_Division'); // Updated SP
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
};

// 2. Get Facility by Division
exports.getFacilities = async (req, res) => {
    try {
        const { divisionId } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Profit_Center', sql.NVarChar, divisionId) // SP expects @Profit_Center (passed as param)
            .execute('trans.Stored_Get_Dropdown_Facility_By_Division');
        // SP returns only one recordset with FacilityShort and FacilityName
        res.status(200).json(result.recordset || []);
        // Note: Returns [Profit_Center_Name] and [FacilityName]
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
};

// 3. Get Process by Division
exports.getProcesses = async (req, res) => {
    try {
        const { divisionId } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Input_Division', sql.Int, divisionId)
            .execute('trans.Stored_Get_tb_Process');
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('Backend - getProcesses Error:', err);
        res.status(500).send(err.message);
    }
};

// 4. Get PartNo Auto-complete
exports.getPartNo = async (req, res) => {
    try {
        const { divisionId } = req.query;
        const { partNo } = req.params;

        const pool = await poolPromise;
        const result = await pool.request()
            .input('Input_Division', sql.Int, divisionId)
            .input('Input_PartNo', sql.NVarChar, partNo)
            .execute('trans.Stored_Get_tb_PartNo');

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('Backend - getPartNo Error:', err);
        res.status(500).send(err.message);
    }
};

// 5. Get Item Details (Auto-fill)
// 5. Get Item Details (Auto-fill or Autocomplete)
exports.getItemDetails = async (req, res) => {
    try {
        const { itemNo } = req.params;
        const { divisionId, isAutocomplete } = req.query; // Added isAutocomplete flag

        const pool = await poolPromise;
        const result = await pool.request()
            .input('Input_ItemNo', sql.NVarChar, itemNo)
            .input('Input_Division', sql.Int, divisionId)
            .input('Is_Autocomplete', sql.Bit, isAutocomplete === 'true' ? 1 : 0) // Pass flag to SP
            .execute('trans.Stored_Get_ItemDetail_AutoFill');

        // Logic:
        // If Autocomplete=true -> Return Array (List of suggestions)
        // If Autocomplete=false -> Return Object (Single item details)
        if (isAutocomplete === 'true') {
            res.status(200).json(result.recordset); // Return List
        } else {
            if (result.recordset.length > 0) {
                res.status(200).json(result.recordset[0]); // Return Single Object
            } else {
                res.status(404).json({ message: "Item not found" });
            }
        }

    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
};

// 6. Save Return Request
exports.saveReturnRequest = async (req, res) => {
    try {
        const { header, items } = req.body;
        // header: { divisionId, facility, process, phone, docNo, employeeId, returnBy }
        // items: Array of { partNo, itemNo, itemName, spec, qty, remark }

        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);

        await transaction.begin();

        try {
            for (const item of items) {
                // Skip empty rows
                if (!item.itemNo) continue;

                const request = new sql.Request(transaction);
                await request
                    .input('Doc_No', sql.NVarChar, header.docNo)
                    .input('Employee_ID', sql.NVarChar, header.employeeId)
                    .input('Return_By', sql.NVarChar, header.returnBy)
                    .input('Division', sql.NVarChar, header.divisionName) // Changed ID to Name? DB says nvarchar. Let's send Name.
                    .input('Process', sql.NVarChar, header.process)
                    .input('Facility', sql.NVarChar, header.facility)
                    .input('Phone_No', sql.NVarChar, header.phone)
                    .input('ItemNo', sql.NVarChar, item.itemNo)
                    .input('PartNo', sql.NVarChar, item.partNo)
                    .input('ItemName', sql.NVarChar, item.itemName)
                    .input('Spec', sql.NVarChar, item.spec)
                    .input('QTY', sql.Int, item.qty)
                    .input('Remark', sql.NVarChar, item.remark)
                    .execute('trans.Stored_Save_Return_Request');
            }

            await transaction.commit();
            res.status(200).json({ message: 'Saved successfully', docNo: header.docNo });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
};

// 7. Get Return List (History)
exports.getReturnList = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .execute('trans.Stored_Get_Return_List');

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
};

// 8. Get Next Doc No
exports.getNextDocNo = async (req, res) => {
    try {
        const { process, facility, division } = req.query; // Received division (71DZ, 7122, etc.)

        // Logic mapping
        // RET = RETURN
        // TN = PROCESS (TURNING = TN, RL หรือ F&BORING = RL)
        let processCode = 'XX';
        if (process) {
            const upProcess = process.toUpperCase();
            if (upProcess.includes('TURNING')) processCode = 'TN';
            else if (upProcess.includes('RL') || upProcess.includes('BORING')) processCode = 'RL';
            else processCode = upProcess.substring(0, 2);
        }

        // 6 = FAC ( extract from F.1, F.4, F.6 )
        let facCode = '0';
        if (facility) {
            const match = facility.match(/\d+/);
            if (match) facCode = match[0];
        }

        // MONTH 12
        const now = new Date();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');

        const prefix = `RET${processCode}${facCode}${month}`;

        const pool = await poolPromise;
        const result = await pool.request()
            .input('Division', sql.NVarChar, division)
            .input('MonthPattern', sql.NVarChar, '______' + month + '____') // RET(3) + Proc(2) + Fac(1) = 6 chars before Month
            .query(`
                SELECT TOP 1 Doc_No 
                FROM [master].[tb_Return_List] 
                WHERE Division = @Division 
                  AND Doc_No LIKE @MonthPattern
                ORDER BY RIGHT(Doc_No, 4) DESC
            `);

        let nextSeq = 1;
        if (result.recordset.length > 0) {
            const lastDocNo = result.recordset[0].Doc_No;
            const lastSeq = parseInt(lastDocNo.substring(lastDocNo.length - 4));
            if (!isNaN(lastSeq)) {
                nextSeq = lastSeq + 1;
            }
        }

        const docNo = `${prefix}${nextSeq.toString().padStart(4, '0')}`;
        res.status(200).json({ docNo });

    } catch (err) {
        console.error('getNextDocNo Error:', err);
        res.status(500).send(err.message);
    }
};