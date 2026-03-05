const { poolPromise } = require("../config/database");

/**
 * @api {GET} /Purchase_History
 * @description ดึงข้อมูล Purchase History ทั้งหมดจาก View
 * @uses SP: trans.Stored_Purchase_History
 */
exports.Purchase_History = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .execute('trans.Stored_Purchase_History');

    res.json(result.recordset);
  }
  catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};
