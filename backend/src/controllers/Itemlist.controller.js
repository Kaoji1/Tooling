const { error } = require("console");
const { connectDb, closeDb, poolPromise } = require("../config/database");
var Type = require("mssql").TYPES;

// Get all PartNo
exports.Get_PARTNO = async function (req, res) {
  try {
    const pool = await poolPromise;
    const result = await pool
    .request()
    .query("EXEC [dbo].[stored_ToolDataset]")

    res.json(result.recordset);
  }
  catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};
