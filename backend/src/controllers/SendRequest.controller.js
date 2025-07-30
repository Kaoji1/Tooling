const { poolPromise } = require("../config/database");
const Type = require("mssql").TYPES;
const sql = require("mssql");


// insert data to table
exports.Send_Request = async (req, res) => {
    console.log("data re:",req.body);
    try {  
      const pool = await poolPromise;
      const items = req.body;
      await pool
        .request()  
        .input('Requester', sql.NVarChar(50), Requester)
        .input('Division', sql.NVarChar(50), Division)
        .input('FAC', sql.Int, FAC)
        .input('CASE', sql.NVarChar(50), CASE)
        .input('PartNo', sql.NVarChar(50), PartNo)
        .input('ItemNo', sql.NVarChar(50), ItemNo)
        .input('DwgRev', sql.NVarChar(50), DwgRev)
        .input('MCType', sql.NVarChar(50), MCType)
        .input('QTY', sql.Int, QTY)
        .input('DateRequest', sql.NVarChar(50), DateRequest)
        .input('Status', sql.NVarChar(50), Status)
        .execute('[dbo].[stored_IssueCuttingTool_SendRequest]');
    
    res.status(200).json({ message: "Request sent successfully" });
    } catch (error) {
      console.error("Error executing query:", error.stack);
      res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
  };