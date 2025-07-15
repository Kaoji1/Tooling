const { connectDb, closeDb, poolPromise } = require("../config/db.config"); // นำเข้าฟังก์ชันสำหรับเชื่อมต่อกับฐานข้อมูล
var Type = require("mssql").TYPES;// นำเข้า TYPE สำหรับใช้ในการกำหนดชนิดข้อมูล

const Post_CaseOther = async function (req, res) {
  try {
    // console.log("Request Body:", req.body); // แสดงข้อมูลที่ได้รับจาก body

    const pool = await poolPromise; // รอการเชื่อมต่อกับฐานข้อมูล
    // console.log("Database pool created:", pool);

    const result = await pool
      .request() // สร้างคำขอใหม่
      .query("EXEC [trans].[viwer.Viwe_tb_CaseTool]"); // เรียกใช้ stored procedure

    // console.log("Query Result:", result); // แสดงผลลัพธ์ของคำขอ
    res.json(result.recordset); // ส่งผลลัพธ์กลับไปยังผู้เรียก
  } catch (error) {
    // console.error("Error executing query:", error.stack); // แสดงข้อผิดพลาด
    res.status(500).json({ error: "Internal Server Error", details: error.message }); // ส่งสถานะ 500 พร้อมข้อความข้อผิดพลาด
  }
};

