const sql = require("mssql");
const { poolPromise } = require("../config/database");

exports.SaveHistoryPrint = async (req, res) => {
  try {
    const {
      EmployeeID,
      Division,
      DocNo,
      PratNo,
      DueDate,
      TypePrint,
      Total
    } = req.body;

    const pool = await poolPromise;
    await pool.request()
      .input("EmployeeID", sql.NVarChar(50), EmployeeID)
      .input("Division", sql.NVarChar(50), Division)
      .input("DocNo", sql.NVarChar(50), DocNo)
      .input("PratNo", sql.NVarChar(50), PratNo)
      .input("DueDate", sql.NVarChar(50), DueDate)
      .input("TypePrint", sql.NVarChar(50), TypePrint)
      .input("Total", sql.Int, Total)
      .execute("stored_Master_HistoryPrint_Insert");

    res.status(200).json({ message: "บันทึกประวัติการพิมพ์สำเร็จ" });
  } catch (err) {
    console.error("Error SaveHistoryPrint:", err);
    res.status(500).json({ error: "บันทึกไม่สำเร็จ", details: err.message });
  }
};
exports.SaveHistoryPrint = async (req, res) => {
  try {
    const { EmployeeID, Division, DocNo, PratNo, DueDate, TypePrint, Total } = req.body;
    const pool = await poolPromise;

    await pool.request()
      .input('EmployeeID', sql.NVarChar, EmployeeID) // ใช้ค่าจาก req.body
      .input('Division', sql.NVarChar, Division)
      .input('DocNo', sql.NVarChar, DocNo)
      .input('PratNo', sql.NVarChar, PratNo)
      .input('DueDate', sql.Date, DueDate)
      .input('TypePrint', sql.NVarChar, TypePrint)
      .input('Total', sql.Int, Total)
      .execute('stored_Master_HistoryPrint_Insert');

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
//เรียกdivisionจากSQL 
exports.Get_Total = async (req, res) => {
  console.log(req.body)
  try {
    const pool = await poolPromise;
    const result = await pool
    .request()
    .query("SELECT * FROM [dbo].[View_Master_CuttingTool_HistoryPrint]");

    res.json(result.recordset);
  } 
  catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

// ดึงรายชื่อพนักงานที่มีสิทธิ์ print
exports.EmpPrint = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query("SELECT Employee_ID FROM [dbo].[tb_Emp_PermissionPrint]");

    res.json(result.recordset); // [{Employee_ID: '123'}, ...]
  } catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

// ตรวจสอบสิทธิ์ก่อนพิมพ์ PDF
exports.checkPrintPermission = async (req, res) => {
  try {
    const { Employee_ID } = req.query;
    if (!Employee_ID) return res.status(400).json({ error: 'Employee_ID required' });

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input('Employee_ID', sql.NVarChar, Employee_ID)
      .query(`SELECT COUNT(*) as count 
              FROM [dbo].[tb_Emp_PermissionPrint] 
              WHERE Employee_ID = @Employee_ID`);

    const allowed = result.recordset[0].count > 0;
    res.json({ allowed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

//ข้อมูลประวัติการprint

exports.HistoryPrint = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query("SELECT * FROM [dbo].[tb_Cuttingtool_HistoryPrint]");

    res.json(result.recordset); // [{Employee_ID: '123'}, ...]
  } catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};