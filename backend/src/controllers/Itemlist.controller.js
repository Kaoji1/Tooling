const { poolPromise } = require("../config/database");
const sql = require("mssql").TYPES;

/**
 * ==========================================
 * CUTTING TOOL DROPDOWNS (Cascading)
 * ==========================================
 */

/**
 * API: ดึงข้อมูล Divisions ทั้งหมด
 * หน้าที่: ดึงข้อมูล Division เริ่มต้นจากฐานข้อมูล เพื่อนำไปแสดงใน Dropdown ขั้นแรก
 */
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

/**
 * API: ดึง Fac ตาม Division
 * หน้าที่: กรอง Fac ออกมาตาม Division ที่ส่งมาจากหน้าเว็บ
 */
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

/**
 * API: ดึงข้อมูล PartNo ตาม Division 
 * หน้าที่: กรองร PartNo ออกมาตาม Division ที่ส่งมาจากหน้าเว็บ
 */
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

/**
 * API: ดึง Process
 * หน้าที่: ค้นหา Process ที่เกี่ยวข้อง โดยกรองจาก Division และ PartNo
 */
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

/**
 * API: ดึงข้อมูล Machine 
 * หน้าที่: ค้นหา MCType โดยกรองจากเงื่อนไข 3 อย่างคือ Division, PartNo, และ Process
 */
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

/**
 * API: ดึงข้อมูล ItemNo 
 * หน้าที่: ขั้นตอนสุดท้ายของการกรอง นำ Division, FacilityName, PartNo, Process และ MC มาเพื่อหา ItemNo ที่ถูกต้อง
 */
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

/**
 * API: ดึง Division
 * หน้าที่: ดึง Division ทั้งหมด เพื่อทำ Dropdown ขั้นแรกในฟอร์มของ Setup Tool
 */
exports.get_Setup_Division = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .execute('[trans].[Stored_Get_Dropdown_Division]');
    // Returns: Division_Id, Profit_Center, Division_Name
    res.json(result.recordset);
  } catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

/**
 * API: ดึง Fac 
 * หน้าที่: กรอง Fac อิงตาม Division ของ Setup Tool
 */
exports.get_Setup_Facility = async (req, res) => {
  try {
    const { Division } = req.body;
    if (!Division) return res.status(400).json({ error: "Missing Division parameter" });

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("Profit_Center", sql.NVarChar, Division)
      .execute('[trans].[Stored_Get_Dropdown_Facility_By_Division]');
    // Returns: FacilityName
    res.json(result.recordset);
  } catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

/**
 * API: ดึง PartNo สำหรับ Setup Tool 
 * หน้าที่: กรอง PartNo อิงตาม Division ของ Setup Tool
 */
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

/**
 * API: ดึง Process สำหรับ Setup Tool
 * หน้าที่: กรอง Process อิงตาม Division และ PartNo
 */
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

/**
 * API: ดึง MC  
 * หน้าที่: กรอง MC อิงตาม Division, PartNo และ Process
 */
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

/**
 * API: ค้นหารายการ Setup Tool สรุปผลลัพธ์ (Search Setup Items Result)
 * หน้าที่: ค้นหาข้อมูลไอเทม Setup Tool ตัวเต็ม หลังจากส่งค่า Dropdown ฟิลเตอร์ครบทั้งหมด (Division, PartNo, Process, MC)
 */
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

/**
 * API: ดึงข้อมูล Cutting Tool ของ Case SET (Get CuttingTool for Case SET)
 * หน้าที่: กรณีพนักงานเบิก Case SET ตรงนี้จะดึงลิสต์เฉพาะส่วนที่เป็น Cutting Tool ออกมาโชว์ 
 */
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

/**
 * API: ดึงข้อมูล Setup Tool ของ Case SET (Get SetupTool for Case SET)
 * หน้าที่: กรณีพนักงานเบิก Case SET ตรงนี้จะดึงลิสต์เฉพาะส่วนที่เป็น Setup Tool ออกมาโชว์
 */
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

/**
 * API: ดึงข้อมูลรายละเอียดกล่อง/ชั้นวางต่างๆ ของ Cutting Tool สำหรับ Case SET (Get CuttingTool Detail Breakdown)
 * หน้าที่: ตรวจสอบรายละเอียดแต่ละชิ้น ว่าไอเทมนี้เก็บไว้ที่ตู้ไหน ถาดไหน หรือช่องไหน (Box/Shelf breakdown) 
 */
exports.get_CaseSET_CuttingTool_Detail = async (req, res) => {
  console.time('CaseSET_CuttingTool_Detail_QueryTime');
  try {
    const { Division, ItemNo, FacilityName, PartNo, Process } = req.body;
    console.log('CaseSET CuttingTool Detail Params:', { Division, ItemNo, FacilityName, PartNo, Process });

    const pool = await poolPromise;
    const request = pool.request();

    if (Division) request.input("Input_Division", sql.NVarChar, Division);
    if (ItemNo) request.input("Input_ItemNo", sql.NVarChar, ItemNo);
    if (FacilityName) request.input("Input_FacilityName", sql.NVarChar, FacilityName);
    if (PartNo) request.input("Input_PartNo", sql.NVarChar, PartNo);
    if (Process) request.input("Input_Process", sql.NVarChar, Process);

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

/**
 * API: ดึงไอเทมทั้ง Cutting และ Setup ของ Case SET คืนมาพร้อมกัน (Get Case SET All Unified)
 * หน้าที่: ดึงและรวมรายการทั้ง Cutting Tool และ Setup Tool ในบิล Case SET กลับมาในรูปแบบข้อมูลรวมก้อนเดียว 
 */
exports.get_CaseSET_All = async (req, res) => {
  console.time('CaseSET_All_QueryTime');
  try {
    const { Division, PartNo, Process, FacilityName, MC, ItemNo } = req.body;
    console.log('CaseSET All Params:', { Division, PartNo, Process, FacilityName, MC, ItemNo });

    const pool = await poolPromise;
    const request = pool.request();

    if (Division) request.input("Input_Division", sql.NVarChar, Division);
    if (PartNo) request.input("Input_PartNo", sql.NVarChar, PartNo);
    if (Process) request.input("Input_Process", sql.NVarChar, Process);
    if (FacilityName) request.input("Input_FacilityName", sql.NVarChar, FacilityName);
    if (MC) request.input("Input_MC", sql.NVarChar, MC);
    if (ItemNo) request.input("Input_ItemNo", sql.NVarChar, ItemNo);

    const result = await request.execute("[trans].[Stored_Get_CaseSET_All]");

    console.timeEnd('CaseSET_All_QueryTime');
    console.log(`Found ${result.recordset.length} items (Cutting+Setup Mapped).`);

    res.json(result.recordset);
  } catch (error) {
    console.timeEnd('CaseSET_All_QueryTime');
    console.error("Error executing CaseSET All query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

/**
 * API: ดึงรายชื่อ Item No (Dropdown) ของ Case SET กรณีระบุ ToolingType แบบไม่เจาะจงเต็มรูปแบบ
 * หน้าที่: สร้าง Dropdown ของช่องเบอร์ Item สำหรับโหมด Case SET โดยใช้ ToolingType (Cutting tool หรือ Setup tool) ได้
 */
exports.get_CaseSET_Dropdown_ItemNo = async (req, res) => {
  try {
    const { Division, ToolingType, PartNo } = req.body;
    const pool = await poolPromise;
    const result = await pool.request()
      .input("Division", sql.NVarChar, Division)
      .input("ToolingType", sql.NVarChar, ToolingType || 'Cutting tool')
      .input("Input_PartNo", sql.NVarChar, PartNo) // Added PartNo filtering
      .execute("[trans].[Stored_Get_CaseSET_Dropdown_ItemNo]");
    res.json(result.recordset);
  } catch (error) {
    console.error("Error get_CaseSET_Dropdown_ItemNo:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};



// ==========================================
//    CASE SET DROPDOWNS (PartNo, Process, MC)
// ==========================================

/**
 * API: ดึงรายชื่อพาร์ท Dropdown สำหรับ Case SET (Get Dropdown PartNo)
 * หน้าที่: ดึงข้อมูล PartNo ที่มีอยู่ในบิล กรณีเบิกแบบ Case SET
 */
exports.get_CaseSET_Dropdown_PartNo = async (req, res) => {
  try {
    const { Division, ItemNo } = req.body;
    console.log('CaseSET Dropdown PartNo - Division:', Division, 'ItemNo:', ItemNo);

    const pool = await poolPromise;
    const result = await pool.request()
      .input("Input_Division", sql.NVarChar, Division)
      .input("Input_ItemNo", sql.NVarChar, ItemNo)
      .execute("[trans].[Stored_Get_CaseSET_Dropdown_PartNo]");
    console.log(`Found ${result.recordset.length} PartNo items.`);

    res.json(result.recordset);
  } catch (error) {
    console.error("Error CaseSET Dropdown PartNo:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

/**
 * API: ดึงรายชื่อกระบวนการผลิต Dropdown สำหรับ Case SET (Get Dropdown Process)
 * หน้าที่: ดึงข้อมูล Process ตาม PartNo ในกรณีที่มีการใช้บิลแบบ Case SET
 */
exports.get_CaseSET_Dropdown_Process = async (req, res) => {
  try {
    const { Division, PartNo, ItemNo } = req.body;
    console.log('CaseSET Dropdown Process - Division:', Division, 'PartNo:', PartNo, 'ItemNo:', ItemNo);

    const pool = await poolPromise;
    const result = await pool.request()
      .input("Input_Division", sql.NVarChar, Division)
      .input("Input_PartNo", sql.NVarChar, PartNo)
      .input("Input_ItemNo", sql.NVarChar, ItemNo)
      .execute("[trans].[Stored_Get_CaseSET_Dropdown_Process]");
    console.log(`Found ${result.recordset.length} Process items.`);

    res.json(result.recordset);
  } catch (error) {
    console.error("Error CaseSET Dropdown Process:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

/**
 * API: ดึงรายชื่อเครื่องจักร Dropdown สำหรับ Case SET (Get Dropdown MC)
 * หน้าที่: ดึงข้อมูลเครื่องจักร (MC) เข้ามาทำ Dropdown ในกรณีมีการใช้บิลเบิกแบบ Case SET
 */
exports.get_CaseSET_Dropdown_MC = async (req, res) => {
  try {
    const { Division, PartNo, Process, ItemNo } = req.body;
    console.log('CaseSET Dropdown MC - All Params:', { Division, PartNo, Process, ItemNo });

    const pool = await poolPromise;
    const request = pool.request();

    if (Division) request.input("Input_Division", sql.NVarChar, Division);
    if (PartNo) request.input("Input_PartNo", sql.NVarChar, PartNo);
    if (Process) request.input("Input_Process", sql.NVarChar, Process);
    if (ItemNo) request.input("Input_ItemNo", sql.NVarChar, ItemNo);

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

/**
 * API: ดึงข้อมูลเครื่องจักรตามแผนกเท่านั้น โดยไม่ใช้สำหรับการกรอง (Get MC by Division only)
 * หน้าที่: ใช้เพื่อโชว์เครื่องจักรลิสต์ทั้งหมดในแผนก (Division) เช่น เพื่อตั้งค่าหน้าจอ แสดงผลเฉยๆ โดยไม่ผูกมัดกับการกรอง PartNo/Process (Display Only)
 */
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

// ==========================================
//    TOOLING REQUEST BY UNIQUE ID (PlanList VIEW)
// ==========================================

/**
 * API: ดึงรายการ Request ตาม Unique_Id จาก PC Plan
 * หน้าที่: ใช้ตอนกด VIEW จากหน้า PlanList แท็บ PD
 *         เชื่อม Unique_Id กับ tb_IssueCuttingTool_Request_Document และ tb_IssueSetupTool_Request_Document
 */
exports.getToolingRequestByUniqueId = async (req, res) => {
  try {
    const { uniqueId } = req.body;
    if (!uniqueId) {
      return res.status(400).json({ error: "Missing uniqueId parameter" });
    }

    // Strip 'PLAN-' prefix if present (frontend adds PLAN- for display)
    const rawUuid = uniqueId.toString().replace(/^PLAN-/i, '').trim();

    const pool = await poolPromise;

    console.log(`[getToolingRequestByUniqueId] Received uniqueId: ${uniqueId}`);
    console.log(`[getToolingRequestByUniqueId] Stripped rawUuid: ${rawUuid}`);

    // Call Stored Procedure [trans].[Stored_Get_ToolingRequest_ByUniqueId]
    // Returns 2 recordsets: [0] = CuttingTool, [1] = SetupTool
    const result = await pool.request()
      .input('UniqueId', sql.NVarChar, rawUuid)
      .execute('[trans].[Stored_Get_ToolingRequest_ByUniqueId]');

    console.log(`[getToolingRequestByUniqueId] CuttingTool rows: ${result.recordsets[0] ? result.recordsets[0].length : 0}`);
    console.log(`[getToolingRequestByUniqueId] SetupTool rows: ${result.recordsets[1] ? result.recordsets[1].length : 0}`);

    const cuttingRecords = result.recordsets[0] || [];
    const setupRecords = result.recordsets[1] || [];

    // Build header info from first available record
    const firstRecord = cuttingRecords[0] || setupRecords[0] || null;

    res.json({
      header: firstRecord ? {
        partNo: firstRecord.PartNo,
        process: firstRecord.Process,
        mcType: firstRecord.MCType,
        mcNo: firstRecord.MCNo,
        fac: firstRecord.Fac,
        requester: firstRecord.Requester
      } : null,
      cuttingTool: cuttingRecords,
      setupTool: setupRecords
    });

  } catch (error) {
    console.error("Error getToolingRequestByUniqueId:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};