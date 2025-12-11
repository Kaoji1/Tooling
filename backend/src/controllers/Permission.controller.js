const { poolPromise } = require("../config/database");
const Type = require("mssql").TYPES;
const sql = require("mssql");

exports.ShowPermission = async (req, res) => {
  console.log("GET /get_Permission called");
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`SELECT * FROM dbo.tb_Emp_PermissionPrint`);
    console.log("ShowPermission result:", result.recordset);
    res.json(result.recordset);
  } catch (err) {
    console.error("Error GetEmployee:", err);
    res.status(500).json({ error: "Cant get Employee data" });
  }
};

exports.AddUserPermission = async (req, res) => {
  console.log("POST /AddUserPermission body:", req.body);
  try {
    const { Employee_ID, Employee_Name } = req.body;

    if (!Employee_ID || !Employee_Name) {
      console.warn("Missing data:", req.body);
      return res.status(400).json({ success: false, error: "ข้อมูลไม่ครบ" });
    }

    const pool = await poolPromise;

    await pool.request()
      .input("_Employee_ID", sql.NVarChar(10), Employee_ID)
      .input("_Employee_Name", sql.NVarChar(50), Employee_Name)
      .execute("Stored_tb_Emp_PermissionPrint_insert");

    res.json({ success: true, message: "เพิ่มเรียบร้อย" });
  } catch (err) {
    console.error("Error AddUserPermission:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.DeleteEmployeePermission = async (req, res) => {
  try {
    const { Employee_ID } = req.params; // ใช้ params แทน body

    if (!Employee_ID) {
      return res.status(400).json({ error: "Employee_ID is required" });
    }

    const pool = await poolPromise;
    await pool.request()
      .input("Employee_ID", sql.NVarChar(10), Employee_ID)
      .query("DELETE FROM dbo.tb_Emp_PermissionPrint WHERE Employee_ID = @Employee_ID");

    res.json({ success: true, message: "ลบสำเร็จ" });
  } catch (err) {
    console.error("Error deleting employee:", err);
    res.status(500).json({ error: "ลบไม่สำเร็จ" });
  }
};

exports.updateEmployeePermission = async (req, res) => {
  const id = req.params.id; // นี่คือ ID_PermissionPrint
  console.log("POST /updateEmployeePermission called with id:", id, "body:", req.body);

  try {
    const { Employee_ID, Employee_Name } = req.body || {};

    if (!id) return res.status(400).json({ message: "ไม่พบ ID_PermissionPrint" });
    if (!Employee_ID || !Employee_Name) {
      console.warn("updateEmployeePermission missing data:", req.body);
      return res.status(400).json({ message: "กรอกข้อมูลไม่ครบ" });
    }

    const pool = await poolPromise;
    await pool.request()
      .input("_Employee_ID", sql.NVarChar(10), Employee_ID)
      .input("_Employee_Name", sql.NVarChar(50), Employee_Name)
      .query(`
        UPDATE dbo.tb_Emp_PermissionPrint
        SET
          Employee_ID = @_Employee_ID,
          Employee_Name = @_Employee_Name,
          DateTime_Record = GETDATE()
        WHERE Employee_ID = @Employee_ID
      `);

    console.log("updateEmployeePermission success for:", id);
    res.json({ success: true, message: "updated" });
  } catch (err) {
    console.error("updateEmployee error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};