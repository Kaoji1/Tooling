const { connectDb, closeDb, poolPromise } = require("../config/db.config"); // นำเข้าโมดูลสำหรับการเชื่อมต่อฐานข้อมูล
const jwt = require('jsonwebtoken'); // นำเข้าโมดูลสำหรับจัดการ JWT (JSON Web Token)
var Type = require("mssql").TYPES; // นำเข้า TYPE สำหรับใช้ในการกำหนดชนิดข้อมูล

// ฟังก์ชันสำหรับการเข้าสู่ระบบ
const login = async (req, res) => {
    try {
        const { Emp_Code, Emp_Pwd } = req.body; // รับ Emp_Code และ Emp_Pwd จาก body
        const pool = await poolPromise; // รอการเชื่อมต่อกับฐานข้อมูล

        // Query ข้อมูลพนักงานจาก database
        const result = await pool.request()
            .input('Emp_Code', Type.NVarChar, Emp_Code) // เพิ่มพารามิเตอร์ Emp_Code
            .query('EXEC [master].[stored_tb_Account_Query] @Emp_Code'); // เรียกใช้ stored procedure

        console.log('show', result.recordset); // ตรวจสอบข้อมูลที่ถูกดึงมา

        if (!result.recordset || result.recordset.length === 0) { // ตรวจสอบว่ามีผลลัพธ์หรือไม่
            // ถ้าไม่พบ Emp_Code ในระบบ
            return res.status(401).json({ auth: false, message: 'Not Found This Employee Code' }); // ส่งสถานะ 401 หากไม่พบพนักงาน
        }
        
        const user = result.recordset[0]; // เก็บข้อมูลผู้ใช้ในตัวแปร user

        // ตรวจสอบรหัสผ่าน
        if (user.Emp_Pwd !== Emp_Pwd) { // เปรียบเทียบรหัสผ่าน
            return res.status(401).json({ auth: false, message: 'Invalid Password' }); // ส่งสถานะ 401 หากรหัสผ่านไม่ถูกต้อง
        }

        // ถ้ารหัสผ่านถูกต้อง สร้าง JWT token
        const token = jwt.sign({ Emp_Code: user.Emp_Code }, 'your_jwt_secret', { expiresIn: '1h' }); // สร้าง JWT token

        res.status(200).json({ auth: true, message: 'Login successful', token, user }); // ส่งข้อมูล response กลับไปยัง Frontend
    } catch (err) {
        console.error(err); // แสดงข้อผิดพลาดใน console
        res.status(500).json({ auth: false, message: 'Error on the server.' }); // ส่งสถานะ 500 หากเกิดข้อผิดพลาด
    }
};

// ฟังก์ชันสำหรับการลงทะเบียน
const register = async (req, res) => {
    try {
        const Emp_Code = req.body.Emp_Code; // รับ Emp_Code จาก body
        const pool = await poolPromise; // รอการเชื่อมต่อกับฐานข้อมูล
        const result = await pool.request(); // เริ่มการร้องขอ

        result
            .input("Emp_Code", Type.NVarChar, Emp_Code) // เพิ่มพารามิเตอร์ Emp_Code
            .input("Emp_Pwd", Type.NVarChar, req.body.Emp_Pwd); // เพิ่มพารามิเตอร์ Emp_Pwd

        // เรียกใช้ stored procedure เพื่อทำการลงทะเบียน
        result.query(
            "EXEC [master].[stored_tb_Account_Insert]  @Emp_Code, @Emp_Pwd",
            function (err, result) { // ฟังก์ชัน callback เพื่อตรวจสอบผลลัพธ์
                if (err) { // หากเกิดข้อผิดพลาด
                    console.log(err); // แสดงข้อผิดพลาดใน console
                } else {
                    res.json({ // ส่งข้อมูล response กลับไปยัง Frontend
                        success: true,
                        message: "Register successfully", // ส่งข้อความยืนยันการลงทะเบียน
                    });
                }
            }
        );
    } catch (err) {
        console.error("Error executing query:", err.stack); // แสดงข้อผิดพลาดใน console
        res.status(500).send({ error: "Internal Server Error", details: err.message }); // ส่งสถานะ 500 หากเกิดข้อผิดพลาด
    }
};

// อาจจะมีฟังก์ชันอื่น ๆ สำหรับการออกจากระบบและการตั้งเวลา (ยังไม่เปิดใช้งาน)
// const logout = async (req, res) => {
//     try {
//         const { Emp_Code, Emp_Pwd } = req.body;
//         const pool = await poolPromise;

//         // Query ข้อมูลพนักงานจาก database
//         const result = await pool.request()
//             .input('Emp_Code', Type.NVarChar, Emp_Code)
//             .query('EXEC [master].[stored_tb_Account_Query] @Emp_Code');

//     } catch (err) {
//         console.error("Error executing query:", err.stack);
//         res
//             .status(500)
//             .send({ error: "Internal Server Error", details: err.message });
//     }
// };

// const settimeout = async (req, res) => {
//     try {
//         const { Emp_Code, Emp_Pwd } = req.body;
//         const pool = await poolPromise;

//         // Query ข้อมูลพนักงานจาก database
//         const result = await pool.request()
//             .input('Emp_Code', Type.NVarChar, Emp_Code)
//             .query('EXEC [master].[stored_tb_Account_Query] @Emp_Code');

//     } catch (err) {
//         console.error("Error executing query:", err.stack);
//         res
//             .status(500)
//             .send({ error: "Internal Server Error", details: err.message });
//     }
// };

module.exports = {
    login, // ส่งออกฟังก์ชัน login
    register, // ส่งออกฟังก์ชัน register
    // logout, // ยังไม่เปิดใช้งาน
    // settimeout, // ยังไม่เปิดใช้งาน
};
