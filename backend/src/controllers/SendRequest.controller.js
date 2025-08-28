const { poolPromise } = require("../config/database");
const Type = require("mssql").TYPES;
const sql = require("mssql");
const nodemailer = require('nodemailer'); // ใส่บนสุดของไฟล์

// insert data to table
exports.Send_Request = async (req, res) => {
  console.log("data re:", req.body);
  try {
    const pool = await poolPromise;
    //  กรณีรับมาเป็น array
    const items = req.body; // สมมุติว่าเป็น array ของ item ทั้งหมดใน Doc
    for (const item of items) {
      console.log("item:",item);
      // แมปชื่อให้ตรงกับ ตารางmssql
      const {
        Doc_no,
        Division,
        Fac,                
        ItemNo,                
        PartNo,
        DwgRev = '0',          
        Process,
        MCNo,
        MCType,                     
        QTY,
        Due_Date,               
        Status = 'Waiting',    
        FileData,
        FileName,
        PathDwg,
        PathLayout,
        ON_HAND,
        PhoneNo

      } = item;
      console.log(" Factory ที่รับมา:", Fac, "| typeof:", typeof Fac);

      await pool
        .request()
        .input('DocNo',sql.NVarChar(50),Doc_no)
        .input('Requester',sql.NVarChar(50),item.Employee_Name) // สมมุติใช้ default
        .input('Division', sql.NVarChar(50), Division)
        .input('Fac', sql.Int, Fac )
        .input('CASE', sql.NVarChar(50), item.CASE || item.Case_ || '') // จาก key Case_
        .input('PartNo', sql.NVarChar(50), PartNo)
        .input('ItemNo', sql.NVarChar(50), ItemNo)
        .input('SPEC', sql.NVarChar(50), item.SPEC)
        .input('DwgRev', sql.NVarChar(50), DwgRev)
        .input('Process', sql.NVarChar(50), Process)
        .input('MCType', sql.NVarChar(50), MCType)
        .input('MCNo',sql.Int,MCNo)
        .input('Req_QTY', sql.Int, QTY)
        .input('DueDate', sql.DateTime,new Date(Due_Date))
        .input('Status', sql.NVarChar(50), Status)
        .input('FileData',sql.VarBinary(sql.MAX),FileData? Buffer.from(FileData.split(',')[1],'base64'):null)
        .input('FileName',sql.NVarChar(255),FileName)
        .input('PathDwg',sql.NVarChar(255),PathDwg)
        .input('PathLayout',sql.NVarChar(255),PathLayout)
        .input('ON_HAND',sql.Int,ON_HAND)
        .input('PhoneNo', sql.NVarChar(50), PhoneNo ? String(PhoneNo) : '')
        .execute('[dbo].[stored_IssueCuttingTool_SendRequest]');
    }
    //  ดึงอีเมลทั้งหมดที่ Role = 'production'
    const emailResult = await pool.request()
      .query(`SELECT Email FROM tb_CuttingTool_Employee WHERE Role = 'purchase'`);

    const emailList = emailResult.recordset.map(row => row.Email).filter(email => !!email);

    if (emailList.length === 0) {
      console.warn("ไม่พบอีเมลของ Role = production ในฐานข้อมูล");
    }

    let itemDetailsHtml = items.map(item => `
      <tr>
        <td>${item.Division}</td>
        <td>${item.PartNo}</td>
        <td>${item.ItemNo}</td>
        <td>${item.CASE}</td>
        <td>${item.Fac}</td>
        <td>${item.QTY}</td>
        <td>${new Date(item.Due_Date).toLocaleDateString('th-TH')}</td>
        <td>${item.Employee_Name}</td>
      </tr>
    `).join('');

    // ========  ส่งอีเมลแจ้งเตือนหลังจากบันทึกเสร็จ ========
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'testsystem1508@gmail.com',
        pass: 'amdo inzi npqq asnd' // App Password
      }
    });

    const mailOptions = {
      from: '"Material Disbursement System" <testsystem1508@gmail.com>',
      to: emailList,  //  ส่งหาอีเมลจาก DB
      subject: 'มีรายการถูกขอเข้ามาใหม่',
      html: `
        <h1 style="color:black;">🚚แจ้งเตือน❗❗ มีรายการถูกขอเข้ามาใหม่🚚</h1>
        <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th>Division</th>
              <th>Part No</th>
              <th>Item No</th>
              <th>Case</th>
              <th>Factory</th>
              <th>QTY</th>
              <th>DueDate</th>
              <th>Requester</th>
            </tr>
          </thead>
          <tbody>
            ${itemDetailsHtml}
          </tbody>
        </table>
        <h3 style="color: black;">กรุณาเข้ามาตรวจสอบ👉 http://10.120.113.44:4200/ 👈</h3>
      `
    };

    if (emailList.length > 0) {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('ส่งอีเมลไม่สำเร็จ:', error);
        } else {
          console.log('ส่งอีเมลสำเร็จ:', info.response);
        }
      });
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

    // 1. สร้าง prefix เช่น SETTN908
    // 1.1กำหนดcaseที่เป็นตัวพิเศษเพื่อให้ง่ายต่อการนำไปใช้ต่อ
    let casePart = '';
    switch (case_.toUpperCase()) {
      case 'F/A': casePart = 'FA_'; break;
      case 'N/G': casePart = 'NG_'; break;
      case 'P/P': casePart = 'PP_'; break;
      case 'R/W': casePart = 'RW_'; break;
      default: casePart = case_.substring(0, 3).toUpperCase();
    }
    // 1.2กำหนดชื่อย่อของProcessที่ใช้
    let processPart = '';
    if (process.toLowerCase() === 'turning') {
      processPart = 'TN';
    } else if (process.toLowerCase() === 'milling') {
      processPart = 'ML';
    }else if (process.toLowerCase() === 'milling2') {
      processPart = 'ML';
    } else if (process.toLowerCase() === 'f&boring1') {
      processPart = 'RL';
    } else if (process.toLowerCase() === 'f&boring2') {
      processPart = 'RL';
    } else if (process.toLowerCase() === 'f&boring3') {
      processPart = 'RL';
    } else if (process.toLowerCase() === 'f&boring') {
      processPart = 'RL';
    } else if (process.toLowerCase() === 'rl') {
      processPart = 'RL';
    } 
     else {
      return res.status(400).json({ error:` Process '${process}' is not mapped.` });
    }
    // 1.3กำหนดfacที่เลือก
    const factoryPart = factory.toString().toUpperCase();
    // 1.4กำหนดเดือนที่กดส่งrequest
    const monthPart = new Date().toISOString().slice(5, 7); // MM

    const prefix = casePart + processPart + factoryPart + monthPart; // เช่น SETTN908
    console.log(" Prefix ที่ใช้ค้นหา:", prefix);

    const pool = await poolPromise;

    //  2. วน loop หาเลขที่ยังไม่ซ้ำ
    let nextNumber = 1;
    let docNo = '';
    let isUnique = false;

    while (!isUnique) {
      docNo =` ${prefix}${nextNumber.toString().padStart(4, '0')}`; // เช่น SETTN908001

      const check = await pool.request()
        .input('DocNo', sql.NVarChar(20), docNo)
        .query(`
          SELECT COUNT(*) AS count
          FROM tb_IssueCuttingTool_Request_Document
          WHERE DocNo = @DocNo
        `);

      const count = check.recordset[0].count;
      console.log(` ตรวจสอบ DocNo = ${docNo}, พบซ้ำ = ${count} ครั้ง`);

      if (count === 0) {
        isUnique = true;
      } else {
        nextNumber++;
      }
    }

    console.log(" DocNo ใหม่ที่จะใช้:", docNo);
    return res.json({ DocNo: docNo });

  } catch (err) {
    console.error(" Generate DocNo Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};