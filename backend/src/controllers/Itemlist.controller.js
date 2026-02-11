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
    const { Division } = req.body;
    console.log(Division);


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
    const { Division } = req.body;
    console.log(Division);


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

    if (!Division || !PartNo) {
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
    const { Division, PartNo, Spec, Process } = req.body;
    console.log(Division, PartNo, Spec, Process);

    if (!Division || !PartNo || !Spec || !Process) {
      return res.status(400).json({ error: "Missing PartNo parameter" });
    }
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("Division", req.body.Division)
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
  console.log('item:', req.body);
  try {
    const { Division, FacilityName, PartNo, Process, MC } = req.body;
    console.log(Division, FacilityName, PartNo, Process, MC);

    if (!Division || !PartNo || !Process || !MC) {
      return res.status(400).json({ error: "Missing PartNo parameter" });
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("Division", sql.NVarChar, req.body.Division)
      .input("FacilityName", sql.NVarChar, FacilityName)
      .input("PartNo", sql.NVarChar, req.body.PartNo)

      .input("PROCESS", sql.NVarChar, req.body.Process)
      .input("MC", sql.NVarChar, req.body.MC)
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

// ==========================================
//              SETUP TOOL
// ==========================================

// 1. Get Setup Division (Updated to use new SP)
exports.get_Setup_Division = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .execute('[trans].[Stored_Get_Dropdown_PC_Plan_Division]');
    // Returns: Division_Id, Profit_Center, Division_Name
    res.json(result.recordset);
  } catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

// 2. Get Setup Facility by Division (Updated to use new SP)
exports.get_Setup_Facility = async (req, res) => {
  try {
    const { Division } = req.body;
    if (!Division) return res.status(400).json({ error: "Missing Division parameter" });

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("Division_Id", sql.Int, parseInt(Division))
      .execute('[trans].[Stored_Get_Dropdown_Facility_By_Division]');
    // Returns: FacilityName
    res.json(result.recordset);
  } catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

// 3. Get Setup PartNo by Division
exports.get_Setup_PartNo = async (req, res) => {
  try {
    const { Division } = req.body;
    if (!Division) return res.status(400).json({ error: "Missing Division parameter" });

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("InputDivision", sql.NVarChar, Division)
      .query("EXEC [trans].[Stored_Setup_Dropdown_PartNo_By_Division] @InputDivision");

    res.json(result.recordset);
  } catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

// 4. Get Setup Process by Division and PartNo
exports.get_Setup_Process = async (req, res) => {
  try {
    const { Division, PartNo } = req.body;
    if (!Division || !PartNo) return res.status(400).json({ error: "Missing parameters" });

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("InputDivision", sql.NVarChar, Division)
      .input("InputPartNo", sql.NVarChar, PartNo)
      .query("EXEC [trans].[Stored_Setup_Dropdown_Process_By_Division_PartNo] @InputDivision, @InputPartNo");

    res.json(result.recordset);
  } catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

// 5. Get Setup MC by Division, PartNo, Process
exports.get_Setup_MC = async (req, res) => {
  try {
    const { Division, PartNo, Process } = req.body;
    if (!Division || !PartNo || !Process) return res.status(400).json({ error: "Missing parameters" });

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("InputDivision", sql.NVarChar, Division)
      .input("InputPartNo", sql.NVarChar, PartNo)
      .input("InputProcess", sql.NVarChar, Process)
      .query("EXEC [trans].[Stored_Setup_Dropdown_MC_By_Division_PartNo_Process] @InputDivision, @InputPartNo, @InputProcess");

    res.json(result.recordset);
  } catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

// 6. Search Setup Items Result
exports.get_Setup_Items_Result = async (req, res) => {
  console.time('SetupDetails_QueryTime'); // Start timer
  try {
    const { Division, PartNo, Process, MC } = req.body;
    console.log('Search Setup Params:', { Division, PartNo, Process, MC });

    const pool = await poolPromise;
    const request = pool.request();

    // Use .execute with .input safely
    // If param is null/undefined/empty, we don't pass it (let SP use default NULL) 
    // OR we pass explicit NULL. The SP has defaults = NULL, so we can skip or pass NULL.
    // Explicit is better for clarity.

    if (Division) request.input("Input_Division", sql.NVarChar, Division);
    if (PartNo) request.input("Input_PartNo", sql.NVarChar, PartNo);
    if (Process) request.input("Input_Process", sql.NVarChar, Process);
    if (MC) request.input("Input_MC", sql.NVarChar, MC);

    // Use .execute instead of .query for better plan caching and performance
    const result = await request.execute("[trans].[Stored_Search_Setup_Item_Result]");

    console.timeEnd('SetupDetails_QueryTime'); // End timer and log
    console.log(`Found ${result.recordset.length} items.`);

    res.json(result.recordset);
  } catch (error) {
    console.timeEnd('SetupDetails_QueryTime');
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

// ==========================================
//         CASE SET (CuttingTool + SetupTool)
// ==========================================

// 7. Get CuttingTool for Case SET
exports.get_CaseSET_CuttingTool = async (req, res) => {
  console.time('CaseSET_CuttingTool_QueryTime');
  try {
    const { Division, PartNo, Process, FacilityName } = req.body;
    console.log('CaseSET CuttingTool Params:', { Division, PartNo, Process, FacilityName });

    const pool = await poolPromise;
    const request = pool.request();

    if (Division) request.input("Input_Division", sql.NVarChar, Division);
    if (PartNo) request.input("Input_PartNo", sql.NVarChar, PartNo);
    if (Process) request.input("Input_Process", sql.NVarChar, Process);
    // ลบ MC ออก - ไม่ใช้กรองแล้ว
    if (FacilityName) request.input("Input_FacilityName", sql.NVarChar, FacilityName);

    const result = await request.execute("[trans].[Stored_Get_CaseSET_CuttingTool]");

    console.timeEnd('CaseSET_CuttingTool_QueryTime');
    console.log(`Found ${result.recordset.length} CuttingTool items.`);

    res.json(result.recordset);
  } catch (error) {
    console.timeEnd('CaseSET_CuttingTool_QueryTime');
    console.error("Error executing CaseSET CuttingTool query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

// 8. Get SetupTool for Case SET
exports.get_CaseSET_SetupTool = async (req, res) => {
  console.time('CaseSET_SetupTool_QueryTime');
  try {
    const { Division, PartNo, Process } = req.body;  // ลบ MC ออก
    console.log('CaseSET SetupTool Params:', { Division, PartNo, Process });

    const pool = await poolPromise;
    const request = pool.request();

    if (Division) request.input("Input_Division", sql.NVarChar, Division);
    if (PartNo) request.input("Input_PartNo", sql.NVarChar, PartNo);
    if (Process) request.input("Input_Process", sql.NVarChar, Process);
    // ลบ MC input ออก

    const result = await request.execute("[trans].[Stored_Get_CaseSET_SetupTool]");

    console.timeEnd('CaseSET_SetupTool_QueryTime');
    console.log(`Found ${result.recordset.length} SetupTool items.`);

    res.json(result.recordset);
  } catch (error) {
    console.timeEnd('CaseSET_SetupTool_QueryTime');
    console.error("Error executing CaseSET SetupTool query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

// ==========================================
//    CASE SET DETAIL (Box/Shelf/Rack Breakdown)
// ==========================================

// 9. Get CuttingTool Detail for Case SET (Box/Shelf breakdown)
exports.get_CaseSET_CuttingTool_Detail = async (req, res) => {
  console.time('CaseSET_CuttingTool_Detail_QueryTime');
  try {
    const { Division, ItemNo, FacilityName, PartNo, Process } = req.body;  // เปลี่ยน Facility -> FacilityName, ลบ MC
    console.log('CaseSET CuttingTool Detail Params:', { Division, ItemNo, FacilityName, PartNo, Process });

    const pool = await poolPromise;
    const request = pool.request();

    if (Division) request.input("Input_Division", sql.NVarChar, Division);
    if (ItemNo) request.input("Input_ItemNo", sql.NVarChar, ItemNo);
    if (FacilityName) request.input("Input_FacilityName", sql.NVarChar, FacilityName);  // เปลี่ยนเป็น FacilityName
    if (PartNo) request.input("Input_PartNo", sql.NVarChar, PartNo);
    if (Process) request.input("Input_Process", sql.NVarChar, Process);
    // ลบ MC input ออก

    const result = await request.execute("[trans].[Stored_Get_CaseSET_CuttingTool_Detail]");

    console.timeEnd('CaseSET_CuttingTool_Detail_QueryTime');
    console.log(`Found ${result.recordset.length} Detail items.`);

    res.json(result.recordset);
  } catch (error) {
    console.timeEnd('CaseSET_CuttingTool_Detail_QueryTime');
    console.error("Error executing CaseSET CuttingTool Detail query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

// ==========================================
//    CASE SET DROPDOWNS (PartNo, Process, MC)
// ==========================================

// 9. Get PartNo Dropdown for Case SET
exports.get_CaseSET_Dropdown_PartNo = async (req, res) => {
  try {
    const { Division } = req.body;
    console.log('CaseSET Dropdown PartNo - Division:', Division);

    const pool = await poolPromise;
    const request = pool.request();

    if (Division) request.input("Input_Division", sql.NVarChar, Division);

    const result = await request.execute("[trans].[Stored_Get_CaseSET_Dropdown_PartNo]");
    console.log(`Found ${result.recordset.length} PartNo items.`);

    res.json(result.recordset);
  } catch (error) {
    console.error("Error CaseSET Dropdown PartNo:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

// 10. Get Process Dropdown for Case SET
exports.get_CaseSET_Dropdown_Process = async (req, res) => {
  try {
    const { Division, PartNo } = req.body;
    console.log('CaseSET Dropdown Process - Division:', Division, 'PartNo:', PartNo);

    const pool = await poolPromise;
    const request = pool.request();

    if (Division) request.input("Input_Division", sql.NVarChar, Division);
    if (PartNo) request.input("Input_PartNo", sql.NVarChar, PartNo);

    const result = await request.execute("[trans].[Stored_Get_CaseSET_Dropdown_Process]");
    console.log(`Found ${result.recordset.length} Process items.`);

    res.json(result.recordset);
  } catch (error) {
    console.error("Error CaseSET Dropdown Process:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

// 11. Get MC Dropdown for Case SET
exports.get_CaseSET_Dropdown_MC = async (req, res) => {
  try {
    const { Division, PartNo, Process } = req.body;
    console.log('CaseSET Dropdown MC - Division:', Division, 'PartNo:', PartNo, 'Process:', Process);

    const pool = await poolPromise;
    const request = pool.request();

    if (Division) request.input("Input_Division", sql.NVarChar, Division);
    if (PartNo) request.input("Input_PartNo", sql.NVarChar, PartNo);
    if (Process) request.input("Input_Process", sql.NVarChar, Process);

    const result = await request.execute("[trans].[Stored_Get_CaseSET_Dropdown_MC]");
    console.log(`Found ${result.recordset.length} MC items.`);

    res.json(result.recordset);
  } catch (error) {
    console.error("Error CaseSET Dropdown MC:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

// ==========================================
//    MC BY DIVISION (แสดงเฉยๆ ไม่ใช้กรอง)
// ==========================================

// 12. Get MC by Division only (for display, not filtering)
exports.get_MC_ByDivision = async (req, res) => {
  try {
    const { Division } = req.body;
    console.log('get_MC_ByDivision - Division:', Division);

    const pool = await poolPromise;
    const request = pool.request();

    if (Division) request.input("Input_Division", sql.NVarChar, Division);

    const result = await request.execute("[trans].[Stored_Get_MC_ByDivision]");
    console.log(`Found ${result.recordset.length} MC items for Division.`);

    res.json(result.recordset);
  } catch (error) {
    console.error("Error get_MC_ByDivision:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};