const { poolPromise } = require("../config/database");
const Type = require("mssql").TYPES;
const sql = require("mssql");

exports.getItemDetails = async (req, res) => {
    try {
        const { itemNo } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ItemNo', sql.NVarChar, itemNo)
            .execute('trans.SP_GetItemRequest_Return');

        if (result.recordset.length > 0) {
            res.status(200).json(result.recordset[0]);
        } else {
            res.status(404).json({ message: "Item not found" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
};