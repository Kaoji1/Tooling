const { poolPromise } = require("../config/database");
const Type = require("mssql").TYPES;

// ดึงข้อมูล PartNo ทั้งหมด
exports.Get_PartNo = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
    .request()
    .query("EXEC [dbo].[stored_ToolDataset]");

    res.json(result.recordset);
  } 
  catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

// ดึง Spec ตาม PartNo
exports.Get_SPEC = async (req, res) => {
  try {
    const PartNo = req.params.PartNo;

    if (!PartNo) {
      return res.status(400).json({ error: "Missing PartNo parameter" });
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("PartNo", Type.VarChar, PartNo)
      .query("EXEC [dbo].[stored_ToolDataset] @PartNo");

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Spec not found for this PartNo" });
    } else {
      res.json(result.recordset);
    }    
  } catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }  
};

exports.Get_Process = async (req, res) => {
  console.log(req.body);
  try {
    const {PartNo, Spec }= req.body;
    console.log(PartNo, Spec);

    if (!PartNo || !Spec) {
      return res.status(400).json({ error: "Missing PartNo parameter" });
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("PartNo", req.body.PartNo)
      .input("Spec", req.body.Spec)
      .query("EXEC [dbo].[stored_ToolDataset] @PartNo,@Spec");

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Spec not found for this PartNo" });
    } else {
      res.json(result.recordset);
    }    
  } catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

//Get MC by PartNo, SPEC and Process
  exports.Get_MC = async (req, res) => {
  console.log(req.body);
  try {
    const {PartNo, Spec, Process}= req.body;
    console.log(PartNo, Spec, Process);

    if (!PartNo || !Spec || !Process) {
      return res.status(400).json({ error: "Missing PartNo parameter" });
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("PartNo", req.body.PartNo)
      .input("Spec", req.body.Spec)
      .input("PROCESS", req.body.Process)
      .query("EXEC [dbo].[stored_ToolDataset] @PartNo, @Spec, @PROCESS");

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Spec not found for this PartNo" });
    } else {
      res.json(result.recordset);
    }    
  } catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }  

};
