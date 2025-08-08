const { poolPromise } = require("../config/database");
const sql = require('mssql');


exports.ShowUser = async (req, res) => {
  console.log(req.body)
  try {
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