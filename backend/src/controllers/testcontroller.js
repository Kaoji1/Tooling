
const poolPromise = require("../config/db"); // นำเข้า poolPromise สำหรับการเชื่อมต่อกับฐานข้อมูล

var Type = require("mssql").TYPES;// นำเข้า TYPE สำหรับใช้ในการกำหนดชนิดข้อมูล

const Post_OPIST_PartNo = async function (req, res) {
  try {
    // console.log("Request Body:", req.body); // แสดงข้อมูลที่ได้รับจาก body

    const pool = await poolPromise; // รอการเชื่อมต่อกับฐานข้อมูล
    // console.log("Database pool created:", pool);

    const result = await pool
      .request() // สร้างคำขอใหม่
      .query("EXEC [trans].[stored_Master_Tooling_Query_A]"); // เรียกใช้ stored procedure

    // console.log("Query Result:", result); // แสดงผลลัพธ์ของคำขอ
    res.json(result.recordset); // ส่งผลลัพธ์กลับไปยังผู้เรียก
  } catch (error) {
    // console.error("Error executing query:", error.stack); // แสดงข้อผิดพลาด
    res.status(500).json({ error: "Internal Server Error", details: error.message }); // ส่งสถานะ 500 พร้อมข้อความข้อผิดพลาด
  }
};

module.exports = {
  Post_part_name, // ส่งออกฟังก์ชันสำหรับใช้ในที่อื่น
};