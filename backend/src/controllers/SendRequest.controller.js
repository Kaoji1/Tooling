const { poolPromise } = require("../config/database");
const Type = require("mssql").TYPES;
const sql = require("mssql");


// insert data to table
exports.Send_Request = async (req, res) => {
  console.log("data re:", req.body);

  try {
    const pool = await poolPromise;

    //  กรณีรับมาเป็น array
    const items = req.body; // สมมุติว่าเป็น array ของ item ทั้งหมดใน Doc

    for (const item of items) {
      console.log("item:",item);
      // แมปชื่อให้ตรงกับ SP
      const {
        Doc_no,
        Division,
        Fac,                //  แก้เป็น Fac
        ItemNo,                //  แก้เป็น ItemNo
        PartNo,
        DwgRev = '0',           //  default ถ้าไม่มี
        Process,
        MCType,                     //  แก้เป็น MCType
        QTY,
        Due_Date,               //  แก้เป็น DateRequest
        Status = 'In Progress'      //  default
      } = item;
      console.log(" Factory ที่รับมา:", Fac, "| typeof:", typeof Fac);

      await pool
        .request()
        .input('DocNo',sql.NVarChar(50),Doc_no)
        .input('Requester', sql.NVarChar(50), '') // สมมุติใช้ default
        .input('Division', sql.NVarChar(50), Division)
        .input('Fac', sql.Int, Fac )
        .input('CASE', sql.NVarChar(50), item.CASE || item.Case_ || '') // จาก key Case_
        .input('PartNo', sql.NVarChar(50), PartNo)
        .input('ItemNo', sql.NVarChar(50), ItemNo)
        .input('SPEC', sql.NVarChar(50), item.SPEC)
        .input('DwgRev', sql.NVarChar(50), DwgRev)
        .input('Process', sql.NVarChar(50), Process)
        .input('MCType', sql.NVarChar(50), MCType)
        .input('QTY', sql.Int, QTY)
        .input('DueDate', sql.DateTime,new Date(Due_Date))
        .input('Status', sql.NVarChar(50), Status)
        .execute('[dbo].[stored_IssueCuttingTool_SendRequest]');
    }

    res.status(200).json({ message: " บันทึกข้อมูลเรียบร้อยแล้วทุกแถว" });

  } catch (error) {
    console.error(" Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};



exports.GenerateNewDocNo = async (req, res) => {
  try {
    const { case_, process, factory } = req.body;

    if (!case_ || !process || !factory) {
      return res.status(400).json({ error: 'Missing case_, process, or factory' });
    }

    //  1. สร้าง prefix เช่น BURTN20708
    let casePart = '';
    switch (case_.toUpperCase()) {
      case 'F/A': casePart = 'FA_'; break;
      case 'N/G': casePart = 'NG_'; break;
      case 'P/P': casePart = 'PP_'; break;
      case 'R/W': casePart = 'RW_'; break;
      default:    casePart = case_.substring(0, 3).toUpperCase();
    }

    let processPart = '';
    if (process.toLowerCase() === 'turning') {
      processPart = 'TN';
    } else {
      return res.status(400).json({ error: `Process '${process}' is not mapped. `});
    }

    const factoryPart = factory.toString().toUpperCase();
    const monthPart = new Date().toISOString().slice(5, 7); // MM

    const prefix = casePart + processPart + factoryPart + monthPart; // เช่น BURTN20708
    console.log(" Prefix ที่ใช้ค้นหา:", prefix);

    const pool = await poolPromise;

    //  2. ดึงเลข 3 ตัวท้ายล่าสุดจาก DocNo โดยใช้ CONCAT ป้องกัน prefix ผิดพลาด
    const result = await pool
      .request()
      .input('Prefix', sql.NVarChar, prefix)
      .query(`
        SELECT TOP 1 CAST(RIGHT(DocNo, 3) AS INT) AS RunningNumber
        FROM tb_IssueCuttingTool_Request_Document
        WHERE DocNo LIKE CONCAT(@Prefix, '%')
        ORDER BY CAST(RIGHT(DocNo, 3) AS INT) DESC
      `);

    console.log(" ผลลัพธ์จากฐานข้อมูล:", result.recordset);

    let nextNumber = 1;
    if (result.recordset.length > 0) {
      const lastRunning = parseInt(result.recordset[0].RunningNumber, 10);
      console.log(" เลขล่าสุดที่เจอ:", lastRunning);

      if (!isNaN(lastRunning)) {
        nextNumber = lastRunning + 1;
      }
    } else {
      console.log(" ไม่พบเลข DocNo เดิมในฐานข้อมูล");
    }

    const docNo =` ${prefix}${nextNumber.toString().padStart(3, '0')}`;
    console.log(" DocNo ใหม่ที่จะใช้:", docNo);

    return res.json({ DocNo: docNo });

  } catch (err) {
    console.error(" Generate DocNo Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};