const { poolPromise } = require("../config/database");
const Type = require("mssql").TYPES;
const sql = require("mssql");

exports.Purchase_History = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query(`
        SELECT * FROM [viewer].[View_RequestList_Complete_History]
      `);

    res.json(result.recordset);
  }
  catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }

};

exports.UpdateRequestStatusLoop = async (req, res) => {
  const { ids, status } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'Please provide IDs to update.' });
  }

  if (!status) {
    return res.status(400).json({ message: 'Please provide status.' });
  }

  try {
    const pool = await poolPromise;

    for (const id of ids) {
      const publicId = id.toString();
      const isSetup = publicId.startsWith('S');
      const table = isSetup
        ? '[dbo].[tb_IssueSetupTool_Request_Document]'
        : '[dbo].[tb_IssueCuttingTool_Request_Document]';

      await pool.request()
        .input('Public_Id', sql.NVarChar, publicId)
        .input('Status', sql.NVarChar, status)
        .query(`
          UPDATE ${table}
          SET Status = @Status,
              DateComplete = CASE WHEN @Status = 'Complete' THEN SYSDATETIME() ELSE DateComplete END
          WHERE Public_Id = @Public_Id
        `);
    }

    res.json({ message: 'Status updated successfully for all IDs.' });
  } catch (err) {
    console.error("Error updating statuses:", err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};