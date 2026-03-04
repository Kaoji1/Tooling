const { poolPromise } = require("../config/database");

/**
 * API: ค้นหารายการเครื่องมือทั้งหมด (Get All Item No)
 * หน้าที่: เรียก Stored Procedure `Stored_View_CuttingTool_FindItem_Purchase` โดยไม่ระบุพารามิเตอร์ 
 * เพื่อดึงรายชื่อ ItemNo ทั้งหมดที่มีในระบบ (อาจจะถูกใช้งานสำหรับการทำ Dropdown หรือระบบ Autocomplete เพื่อค้นหาเครื่องมือแบบไม่เจาะจง)
 */
exports.get_ItemNo = async (req, res) => {
  console.log(req.body)
  try {
    const pool = await poolPromise;
    const result = await pool
    .request()
    .query("EXEC [dbo].[Stored_View_CuttingTool_FindItem_Purchase]");

    res.json(result.recordset);
  } 
  catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

/**
 * API: ค้นหารายละเอียดเครื่องมือระบุตามเบอร์ (Get Item Details by ItemNo)
 * หน้าที่: ดึงข้อมูลรายละเอียดของเครื่องมือแบบเฉพาะเจาะจง โดยเรียก Stored Procedure `Stored_View_CuttingTool_FindItem_Purchase` 
 * พร้อมส่งพารามิเตอร์ @ItemNo เข้าไป ซึ่งจะได้ผลรันเป็นข้อมูลและ Spec ของ ItemNo นั้นๆ 
 * (ระบบหน้าเว็บน่าจะเอาไปใช้ตอนพิมพ์ ItemNo แล้วให้มัน Auto Fill ดึงชื่อ ดึง Spec ขึ้นมาใส่ให้ในแบบฟอร์มอัตโนมัติ)
 */
exports.post_SPEC = async (req, res) => {
  console.log(req);
  try {
    const { ItemNo }= req.body;
    console.log( ItemNo );
    

    if (!ItemNo) {
      return res.status(400).json({ error: "Missing PartNo parameter" });
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("ItemNo", req.body.ItemNo)
      .query("EXEC [dbo].[Stored_View_CuttingTool_FindItem_Purchase] @ItemNo");

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Spec not found for this ItemNo" });
    } else {
      res.json(result.recordset);
    }    
  } catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};
