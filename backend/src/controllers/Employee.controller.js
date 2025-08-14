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