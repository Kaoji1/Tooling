const { poolPromise } = require("../config/database");
const Type = require("mssql").TYPES;


// insert data to table
exports.Send_Request = async (req, res) => {
    console.log(req);

    const {Requester, Division, FAC, CASE, PartNo, ItemNo, DwgRev, MCType, QTY, DateRequest, Status} = req.body;

    try {  
      const pool = await poolPromise;
      await pool
        .request()
        .input('Requester', sql.Nvarchar(50), Requester)
        .input('Division', sql.Nvarchar(50), Division)
        .input('FAC', sql.int, FAC)
        .input('CASE', sql.Nvarchar(50), CASE)
        .input('PartNo', sql.Nvarchar(50), PartNo)
        .input('ItemNo', sql.Nvarchar(50), ItemNo)
        .input('DwgRev', sql.Nvarchar(50), DwgRev)
        .input('MCType', sql.Nvarchar(50), MCType)
        .input('QTY', sql.int, QYT)
        .input('DateRequest', sql.Nvarchar(50), DateRequest)
        .input('Status', sql.Nvarchar(50), Status)
        .execute('stored_IssueCuttingTool_SendRequst');
    
    res.status(200).json({ message: "Request sent successfully" });
    } catch (error) {
      console.error("Error executing query:", error.stack);
      res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
  };