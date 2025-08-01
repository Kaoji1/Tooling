const { poolPromise } = require("../config/database");
const sql = require('mssql');

exports.Login = (req, res) => {
  const { Username, Password } = req.body;

  // ตรวจสอบว่ามีข้อมูลที่จำเป็นหรือไม่
  if (!Username || !Password) {
    return res.status(400).json({ message: 'PLease input Username and Password' });
  }

  // เชื่อมต่อกับฐานข้อมูล
  poolPromise.then(pool => {
    return pool.request()
      .input('Username', sql.NVarChar, req.body.Username)
      .input('Password', sql.NVarChar, req.body.Password)
      .query('EXEC [dbo].[stored_Indirect_Employee] @Username, @Password');
  })

  .then(result => {
    if (result.recordset.length > 0) {
      // หากพบผู้ใช้ ให้ส่งข้อมูลผู้ใช้กลับ
      res.status(200).json({ message: 'Sign in sucessfull', user: result.recordset[0] });
    } else {
      // หากไม่พบผู้ใช้ ให้ส่งข้อความผิดพลาด
      res.status(401).json({ message: 'Username or Password invalid please check again' });
    }
  })

  .catch(err => {
    console.error('Error during login:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ', error: err.message });
  });
}