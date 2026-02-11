const { poolPromise } = require("../config/database");
const Type = require("mssql").TYPES;
const sql = require("mssql");

exports.Purchase_Request = async (req, res) => {
  // console.log(req.query); // ถ้าใช้ GET ข้อมูลจะอยู่ใน req.query
  try {
    const pool = await poolPromise;

    // ✅ แก้ไข: เพิ่ม WHERE Status = 'Waiting' เพื่อลดจำนวนข้อมูลที่ส่งไป Frontend
    const result = await pool
      .request()
      .query("SELECT * FROM [dbo].[View_CuttingTool_RequestList] WHERE Status = 'Complete'");

    res.json(result.recordset);
  }
  catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};