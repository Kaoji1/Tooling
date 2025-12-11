const { poolPromise } = require("../config/database");
const sql = require("mssql").TYPES;

//เรียกdivisionจากSQL 
exports.Get_Division = async (req, res) => {
  console.log(req.body)
  try {
    const pool = await poolPromise;
    const result = await pool
    .request()
    .query("EXEC [dbo].[Stored_View_CuttingTool_FindItem]");

    res.json(result.recordset);
  } 
  catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};
// ดึงข้อมูล Fac กรองจาก Division
exports.get_Facility = async (req, res) => {
  console.log(req);
  try {
    const { Division }= req.body;
    console.log( Division );
    

    if (!Division) {
      return res.status(400).json({ error: "Missing PartNo parameter" });
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("Division", req.body.Division)
      .query("EXEC [dbo].[Stored_View_CuttingTool_FindItem_Test] @Division");

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

// ดึงข้อมูล PartNo กรองจาก Division
exports.get_PartNo = async (req, res) => {
  console.log(req);
  try {
    const { Division }= req.body;
    console.log( Division );
    

    if (!Division) {
      return res.status(400).json({ error: "Missing PartNo parameter" });
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("Division", req.body.Division)
      .query("EXEC [dbo].[Stored_View_CuttingTool_FindItem] @Division");

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

// ดึวข้อมูลprocess จาก division partno spec
exports.Get_Process = async (req, res) => {
  console.log(req.body);

  try {
    const { Division, PartNo } = req.body;
    console.log(Division, PartNo);

    if (!Division || !PartNo ) {
      return res.status(400).json({ error: "Missing PartNo parameter" });
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("Division", Division)
      .input("PartNo", PartNo)
      
      .query("EXEC [dbo].[Stored_View_CuttingTool_FindItem] @Division, @PartNo");

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
    const { Division, PartNo, Spec, Process }= req.body;
    console.log( Division, PartNo, Spec, Process);

    if ( !Division || !PartNo || !Spec || !Process ) {
      return res.status(400).json({ error: "Missing PartNo parameter" });
    }
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("Division",  req.body.Division)
      .input("PartNo", req.body.PartNo)
      .input("PROCESS", req.body.Process)
      
      .query("EXEC [dbo].[Stored_View_CuttingTool_FindItem] @Division, @PartNo, @PROCESS ");

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
// ดึงItemno จาก division partno process mc
exports.post_ItemNo = async (req, res) => {
  console.log('item:',req.body);
  try {
    const { Division, FacilityName, PartNo, Process, MC }= req.body;
    console.log( Division, FacilityName, PartNo, Process, MC );

    if (!Division || !PartNo  || !Process || !MC ) {
      return res.status(400).json({ error: "Missing PartNo parameter" });
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("Division",sql.NVarChar, req.body.Division)
      .input("FacilityName",sql.NVarChar,FacilityName)
      .input("PartNo",sql.NVarChar, req.body.PartNo)
      
      .input("PROCESS",sql.NVarChar, req.body.Process)
      .input("MC",sql.NVarChar, req.body.MC)
      .query("EXEC [dbo].[Stored_View_CuttingTool_FindItem_Test] @Division, @FacilityName, @PartNo, @PROCESS, @MC ");

    if (result.recordset.length === 0) {
      // return res.status(404).json({ message: "Spec not found for this PartNo" });
     
    } else {
      res.json(result.recordset);
      
    }    
  } catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};