const { poolPromise } = require("../config/database");
const Type = require("mssql").TYPES;
const sql = require("mssql");

exports.Purchase_History = async (req, res) => {
  console.log(req.body)
  try {
    const pool = await poolPromise;
    const result = await pool
    .request()
    .query("SELECT * FROM [dbo].[View_CuttingTool_RequestList]");

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
      const request = pool.request();
      request.input('ID_Request', sql.Int, id);
      request.input('Status', sql.VarChar(50), status);

      await request.execute('Stored_tb_CuttingTool_Request_Document_Update');
    }

    res.json({ message: 'Status updated successfully for all IDs.' });
  } catch (err) {
    console.error("Error updating statuses:", err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};