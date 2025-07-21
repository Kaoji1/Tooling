const { error } = require("console");
const { connectDb, closeDb, poolPromise } = require("../config/database");
var Type = require("mssql").TYPES;

// Get all PartNo
exports.Get_PARTNO = async function (req, res) {
  try {
    const pool = await poolPromise;
    const result = await pool
    .request()
    .query("EXEC [dbo].[stored_Item]")

    res.json(result.recordset);
  }
  catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

// Get SPEC values based on selected PartNo
exports.Post_SPEC = async function (req, res) {
  try {
    const { PartNo } = req.body;

    if (!PartNo) {
      return res.status(400).json({ error: "PartNo is required" });
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("PartNo", Type.NVarChar, PartNo.trim())
      .query("EXEC [dbo].[GetSpecByPartNo] @PartNo");

    if (result.recordset.length === 0) {
      res.status(404).json({ error: "No SPEC found for this Part Number" });
    } 
    else {
      res.json(result.recordset);
    }
  }
  catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Server Error", details: error.message });
  }
};


// Get Process by PartNo
exports.Post_PROCESS = async function (req, res) {
  try {
    const { PartNo } = req.body;

    if (!PartNo) {
      return res.status(400).json({ error:"PartNo is required"});
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("PartNo", sql.NVarChar, PartNo.trim())
      .query("EXEC [dbo].[GetProcessByPartNo] @PartNo")

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "No Process found for this PartNo"});
    }

    res.json(result.recordset);
  }
  catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Server Error", details: error.message});
  }
};