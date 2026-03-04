const { poolPromise } = require("../config/database");
const Type = require("mssql").TYPES;
const sql = require("mssql");

/**
 * API: ทดสอบระบบ Analyze
 * หน้าที่: เป็น API สำหรับทดสอบเพื่อเช็คว่าระบบ Analyze ทำงานปกติหรือไม่ (Health Check)
 */
exports.Analyze = (req, res) => {
  res.json({
    message: "Analyze API is working!"
  });
};

/**
 * API: ดึงข้อมูลการวิเคราะห์ค่าใช้จ่ายทั้งหมด (All Cost Analyze Data)
 * หน้าที่: ดึงข้อมูลสรุปค่าใช้จ่ายการเบิกจ่าย Tooling ของทุกแผนกจาก View_Cost_Analyze_Complete 
 * เพื่อนำไปแสดงผลในหน้า Dashboard หรือ Export ข้อมูล
 */
exports.getdataall = async (req, res) => {
  console.log(req.body)
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query("SELECT * FROM [db_Tooling].[viewer].[View_Cost_Analyze_Complete]");

    res.json(result.recordset);
  }
  catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

/**
 * API: ดึงข้อมูลสำหรับหน้า Cost Analyze
 * หน้าที่: ดึงข้อมูลสรุปค่าใช้จ่ายจาก View_Cost_Analyze_Complete เพื่อนำไปแสดงผลเป็นกราฟ 
 * และตารางสรุปในหน้าจอ Cost Analyze โดยเฉพาะ
 */
exports.getcostanalyze = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query("SELECT * FROM [db_Tooling].[viewer].[View_Cost_Analyze_Complete]");

    res.json(result.recordset);
  }
  catch (error) {
    console.error("Error executing Cost Analyze query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};
