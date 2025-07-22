const sql = require("mssql"); // นำเข้าโมดูล mssql สำหรับการเชื่อมต่อฐานข้อมูล SQL Server

// กำหนดการตั้งค่าการเชื่อมต่อกับฐานข้อมูล
const dbConfig = {
    user: "Cost_Team", // ชื่อผู้ใช้สำหรับการเชื่อมต่อฐานข้อมูล
    password: "Cost@User1", // รหัสผ่านสำหรับการเชื่อมต่อฐานข้อมูล
    server: "pbp155", // ที่อยู่เซิร์ฟเวอร์ฐานข้อมูล
    database: "db_Tooling", // ชื่อฐานข้อมูลที่ต้องการเชื่อมต่อ
    options: {
        trustServerCertificate: true, // เชื่อถือใบรับรองเซิร์ฟเวอร์
        trustedConnection: true, // ใช้การเชื่อมต่อที่เชื่อถือได้
        encrypt: false, // ปิดการเข้ารหัสการเชื่อมต่อ
    },
};

// Testing on local
// const dbConfig = {
//     user: "Kritta", // ชื่อผู้ใช้สำหรับการเชื่อมต่อฐานข้อมูล
//     password: "Test@User1", // รหัสผ่านสำหรับการเชื่อมต่อฐานข้อมูล
//     server: "KITTO\SQLEXPRESS", // ที่อยู่เซิร์ฟเวอร์ฐานข้อมูล
//     database: "InternshipTesting", // ชื่อฐานข้อมูลที่ต้องการเชื่อมต่อ
//     options: {
//         trustServerCertificate: true, // เชื่อถือใบรับรองเซิร์ฟเวอร์
//         trustedConnection: true, // ใช้การเชื่อมต่อที่เชื่อถือได้
//         encrypt: false, // ปิดการเข้ารหัสการเชื่อมต่อ
//     },
// };

// สร้างการเชื่อมต่อฐานข้อมูลแบบ Pool
const poolPromise = new sql.ConnectionPool(dbConfig) // สร้าง ConnectionPool ด้วยการตั้งค่า dbConfig
  .connect() // เชื่อมต่อไปยังฐานข้อมูล
  .then(pool => {
    console.log('Connected to MSSQL'); // แสดงข้อความเมื่อเชื่อมต่อสำเร็จ
    return pool; // คืนค่า pool ที่เชื่อมต่อ
  })
  .catch(err => {
    console.error('Database Connection Failed!', err.stack); // แสดงข้อความข้อผิดพลาดหากการเชื่อมต่อไม่สำเร็จ
    throw err; // ขว้างข้อผิดพลาดเพื่อจัดการต่อไป
  });
  console.log(dbConfig);
// ส่งออกโมดูล sql และ poolPromise
module.exports = {
  sql, // ส่งออกโมดูล sql
  poolPromise // ส่งออก poolPromise สำหรับการเชื่อมต่อฐานข้อมูล
};