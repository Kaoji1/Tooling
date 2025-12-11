const { poolPromise } = require("../config/database");
const Type = require("mssql").TYPES;
const sql = require("mssql");

exports.Analyze = (req, res) => {
  res.json({
    message: "Analyze API is working!"
  });
};

//เรียกdivisionจากSQL 
exports.getdataall = async (req, res) => {
  console.log(req.body)
  try {
    const pool = await poolPromise;
    const result = await pool
    .request()
    .query("SELECT * FROM [dbo].[View_CuttingTool_Price_Exchange]");

    res.json(result.recordset);
  } 
  catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};
