const sql = require('mssql');

const config = {
  user: 'Cost_Team',
  password: 'Cost@User1',
  server: 'pbp155',
  database: 'db_ToolingSmartRack',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

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

fetchData();

