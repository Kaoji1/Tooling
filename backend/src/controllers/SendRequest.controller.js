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
      // แมปชื่อให้ตรงกับ SP
      const {
        Doc_no,
        Division,
        Factory,                //  แก้เป็น Fac
        ITEM_NO,                //  แก้เป็น ItemNo
        PartNo,
        DwgRev = '0',           //  default ถ้าไม่มี
        Process,
        MC,                     //  แก้เป็น MCType
        QTY,
        DueDate_,               //  แก้เป็น DateRequest
        Status = 'Request'      //  default
      } = item;
      console.log(" Factory ที่รับมา:", Factory, "| typeof:", typeof Factory);

      await pool
        .request()
        .input('DocNo',sql.NVarChar(50),Doc_no)
        .input('Requester', sql.NVarChar(50), '') // สมมุติใช้ default
        .input('Division', sql.NVarChar(50), Division)
        .input('Fac', sql.Int, Factory?.Fac || Factory || 0)
        .input('CASE', sql.NVarChar(50), item.Case_ || '') // จาก key Case_
        .input('PartNo', sql.NVarChar(50), PartNo)
        .input('ItemNo', sql.NVarChar(50), ITEM_NO)
        .input('DwgRev', sql.NVarChar(50), DwgRev)
        .input('Process', sql.NVarChar(50), Process)
        .input('MCType', sql.NVarChar(50), MC)
        .input('QTY', sql.Int, QTY)
        .input('DueDate', sql.DateTime,new Date(DueDate_))
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

    // 1. CasePart: แปลงกรณีพิเศษ
    let casePart = '';
    if (case_.toUpperCase() === 'F/A') {
      casePart = 'FA_';
    }
    else if (case_.toUpperCase() === 'N/G') {
      casePart = 'NG_';
    } 
    else if (case_.toUpperCase() === 'P/P') {
      casePart = 'PP_';
    } 
    else if (case_.toUpperCase() === 'R/W') {
      casePart = 'RW_';
    } else {
      casePart = case_.substring(0, 3).toUpperCase();
    }

    // 2. Process map (สามารถเพิ่มได้)
    let processPart = '';
    if (process.toLowerCase() === 'turning') {
      processPart = 'TN';
    } else {
      return res.status(400).json({ error:` Process '${process}' is not mapped yet. `});
    }

    // 3. Factory: ใช้ตามที่ส่งมา
    const factoryPart = factory.toString().toUpperCase(); // ใช้ค่าตรง ๆ

    // 4. เดือน 2 หลัก
    const monthPart = new Date().toISOString().slice(5, 7);

    // 5. รวม prefix ทั้งหมด
    const prefix = casePart + processPart + factoryPart + monthPart;

    // 6. หา DocNo ล่าสุดที่ตรงกับ prefix นี้
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input('Prefix', sql.NVarChar(20), prefix)
      .query(`
        SELECT TOP 1 DocNo
        FROM tb_IssueCuttingTool_Request_Document
        WHERE DocNo LIKE @Prefix + '%'
        ORDER BY DocNo DESC
      `);

    let nextNumber = 1;
    if (result.recordset.length > 0) {
      const lastDoc = result.recordset[0].DocNo;
      const lastNumber = parseInt(lastDoc.slice(-3), 10);
      nextNumber = lastNumber + 1;
    }

    const newDocNo =` ${prefix}${nextNumber.toString().padStart(3, '0')}`;
    return res.json({ DocNo: newDocNo });

  } catch (err) {
    console.error('Generate DocNo error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
