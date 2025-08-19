

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

// ดึงข้อมูล PartNo กรองจาก Division
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
