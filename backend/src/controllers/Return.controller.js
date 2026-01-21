const { poolPromise } = require("../config/database");
const Type = require("mssql").TYPES;
const sql = require("mssql");

exports.getItemDetails = async (req, res) => {
    try {
        const { itemNo } = req.params;
        const { divisionId } = req.query;

        const pool = await poolPromise;
        const result = await pool.request()
            .input('ItemNo', sql.NVarChar, itemNo)
            .input('Division_Id', sql.Int, divisionId) // ส่ง Division_Id ไปให้ SP ตัดสินใจ
            .execute('trans.Stored_Look_ItemNo_All_For_Return');

        if (result.recordset.length > 0) {
            res.status(200).json(result.recordset[0]);
        } else {
            res.status(404).json({ message: "Item not found in this division" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
};

exports.getDivisions = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .execute('trans.Stored_Look_Division_For_Return');
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
};

exports.getFacilities = async (req, res) => {
    try {
        const { divisionId } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Division_Id', sql.Int, divisionId)
            .execute('trans.Stored_Look_Facility_By_Division_For_Return');
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
};

exports.getProcesses = async (req, res) => {
    try {
        const { divisionId } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Division_Id', sql.Int, divisionId)
            .execute('trans.Stored_Look_Process_By_Division_For_Return');
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
};