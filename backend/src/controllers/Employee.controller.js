const { poolPromise } = require("../config/database");
const sql = require('mssql');


exports.ShowUser = async (req, res) => {
  
  try {
    console.log(req.body)
    const pool = await poolPromise;
    const result = await pool
    .request()
    .query(`
    SELECT 
    *
    FROM db_Tooling.dbo.View_CuttingTool_Employee`);
    res.json(result.recordset);
  } catch (err) {
    console.error(' Error GetEmployee:', err);
    res.status(500).json({ error: 'Cant get Employee data' });
  }
};

exports.AddUser = async (req, res) => {
  try {
    const {
      Employee_ID,
      Employee_Name,
      Username,
      Password,
      Role,
      Email
    } = req.body;

    const pool = await poolPromise;

    const result = await pool
      .request()
      .input('Employee_ID', Employee_ID)
      .input('Employee_Name', Employee_Name)
      .input('Role', Role)
      .input('Username', Username)
      .input('Password', Password)
      .input('Email',Email)
      
      .query('EXEC dbo.Stored_Insert_tb_CuttingTool_Employee @Employee_ID, @Employee_Name, @Role, @Username, @Password, @Email');

    res.status(200).json({ success: true, message: 'Add success' });
  } catch (err) {
    console.error(' Error AddUser:', err);
    res.status(500).json({ success: false, error: 'Cannot add employee' });
  }
};
// controller
exports.DeleteEmployee = async (req, res) => {
  try {
    const empId = req.params.id;
    const pool = await poolPromise;
    const result = await pool.request()
      .input('Employee_ID', sql.VarChar, empId)
      .query(`DELETE FROM tb_CuttingTool_Employee WHERE Employee_ID = @Employee_ID`);

    res.json({ success: true, message: 'ลบสำเร็จ' });
  } catch (err) {
    console.error('Error deleting employee:', err);
    res.status(500).json({ error: 'ลบไม่สำเร็จ' });
  }
};
// controller
exports.DeleteEmployee = async (req, res) => {
  try {
    const empId = req.params.id;
    const pool = await poolPromise;
    const result = await pool.request()
      .input('Employee_ID', sql.VarChar, empId)
      .query(`DELETE FROM tb_CuttingTool_Employee WHERE Employee_ID = @Employee_ID`);

    res.json({ success: true, message: 'ลบสำเร็จ' });
  } catch (err) {
    console.error('Error deleting employee:', err);
    res.status(500).json({ error: 'ลบไม่สำเร็จ' });
  }
};
// employees.controller.js
exports.updateEmployee = async (req, res) => {
  try {
    const id = req.params.id;
    const { Employee_Name, Username, Password, Role, Email } = req.body || {};

    if (!id) return res.status(400).json({ message: 'ไม่พบ Employee_ID' });
    if (!Employee_Name || !Username || !Role || !Email) {
      return res.status(400).json({ message: 'กรอกข้อมูลไม่ครบ' });
    }

    const pool = await poolPromise;

    await pool.request()
      .input('Employee_ID', sql.VarChar(50), id)
      .input('Employee_Name', sql.NVarChar(100), Employee_Name)
      .input('Username', sql.VarChar(50), Username)
      .input('Password', sql.VarChar(100), Password || '')
      .input('Role', sql.VarChar(50), Role)
      .input('Email', sql.VarChar(200), Email)
      .query(`
        UPDATE tb_CuttingTool_Employee
        SET Employee_Name = @Employee_Name,
            Username = @Username,
            [Password] = CASE WHEN LEN(@Password) > 0 THEN @Password ELSE [Password] END,
            [Role] = @Role,
            Email = @Email
        WHERE Employee_ID = @Employee_ID
      `);

    res.json({ message: 'updated' });
  } catch (err) {
    console.error('updateEmployee error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
  };