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
            .input('Division_Id', sql.NVarChar, divisionId) // SP expects NVARCHAR
            .execute('trans.Stored_Get_tb_Division_Facility_GM_PMC'); // Updated SP
        // SP returns 2 sets: [0]=ProfitCenter, [1]=Facilities. We need [1].
        res.status(200).json(result.recordsets[1] || []);
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
            .input('Input_Division', sql.Int, divisionId) // SP expects INT
            .execute('trans.Stored_Get_tb_Process_Test'); // Updated SP
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
};

// 4. Get PartNo Auto-complete
exports.getPartNo = async (req, res) => {
    try {
        const { divisionId } = req.query; // e.g. ?divisionId=1&partNo=abc
        const { partNo } = req.params;    // /return/partno/:partNo

        const pool = await poolPromise;
        const result = await pool.request()
            .input('Input_Division', sql.Int, divisionId)
            .input('Input_PartNo', sql.NVarChar, partNo)
            .execute('trans.Stored_Get_tb_PartNo_Test'); // Updated SP

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
};

// 5. Get Item Details (Auto-fill)
exports.getItemDetails = async (req, res) => {
    try {
        const { itemNo } = req.params;
        const { divisionId } = req.query;

        const pool = await poolPromise;
        const result = await pool.request()
            .input('Input_ItemNo', sql.NVarChar, itemNo)
            .input('Input_Division', sql.Int, divisionId)
            .execute('trans.Stored_Get_ItemDetail_AutoFill'); // Updated SP

        if (result.recordset.length > 0) {
            res.status(200).json(result.recordset[0]);
        } else {
            // Return empty or specific status to let frontend handle it gracefully
            res.status(404).json({ message: "Item not found" });
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