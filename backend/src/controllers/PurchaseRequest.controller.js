const { poolPromise } = require("../config/database");
const Type = require("mssql").TYPES;
const sql = require("mssql");

exports.Purchase_Request = async (req, res) => {
  try {
    const pool = await poolPromise;

    // 1. ดึงข้อมูล Cutting Tool
    const cuttingQuery = `
      SELECT *, 'Cutting' as ToolingType 
      FROM [db_Tooling].[viewer].[View_IssueCuttingTool_Request_Document] 
    `;

    // 2. ดึงข้อมูล Setup Tool
    const setupQuery = `
      SELECT *, 'Setup' as ToolingType 
      FROM [db_Tooling].[viewer].[View_IssueSetupTool_Request_Document] 
    `;

    // ทำงานพร้อมกัน (Parallel Execution)
    const [cuttingResult, setupResult] = await Promise.all([
      pool.request().query(cuttingQuery),
      pool.request().query(setupQuery)
    ]);

    // 3. รวมข้อมูล
    const combined = [...cuttingResult.recordset, ...setupResult.recordset];

    // 4. เรียงลำดับตามวันที่ (ล่าสุดขึ้นก่อน)
    combined.sort((a, b) => {
      const dateA = a.DateTime_Record ? new Date(a.DateTime_Record) : new Date(0);
      const dateB = b.DateTime_Record ? new Date(b.DateTime_Record) : new Date(0);
      return dateB - dateA;
    });

    res.json(combined);
  }
  catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};