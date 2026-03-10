const { poolPromise } = require("../config/database");

/**
 * @api {GET} /Purchase_History
 * @description ดึงข้อมูล Purchase History ทั้งหมดจาก View
 * @uses SP: trans.Stored_Purchase_History
 */
exports.Purchase_History = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .execute('trans.Stored_Purchase_History');

    res.json(result.recordset);
  }
  catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

/**
 * @api {PUT} /Purchase_History/update
 * @description Update MFGOrderNo and DocNo for a history record
 */
exports.Update_History_Fields = async (req, res) => {
  try {
    const { Public_Id, MFGOrderNo, DocNo } = req.body;
    if (!Public_Id) return res.status(400).json({ success: false, message: "Public_Id is required" });

    const pool = await poolPromise;
    const isCutting = Public_Id.startsWith('C');
    const isSetup = Public_Id.startsWith('S');
    if (!isCutting && !isSetup) return res.status(400).json({ success: false, message: "Invalid Public_Id format" });

    const targetTable = isCutting
      ? '[dbo].[tb_IssueCuttingTool_Request_Document]'
      : '[dbo].[tb_IssueSetupTool_Request_Document]';

    const result = await pool.request()
      .input("Public_Id", sql.NVarChar, Public_Id)
      .input("MFGOrderNo", sql.NVarChar, MFGOrderNo || null)
      .input("DocNo", sql.NVarChar, DocNo || null)
      .query(`
        UPDATE ${targetTable}
        SET MFGOrderNo = @MFGOrderNo,
            DocNo = @DocNo
        WHERE Public_Id = @Public_Id
      `);

    if (result.rowsAffected[0] > 0) {
      res.json({ success: true, message: "Updated successfully" });
    } else {
      res.status(404).json({ success: false, message: "Record not found" });
    }
  } catch (error) {
    console.error("Update_History_Fields Error:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};
