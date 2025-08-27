const { poolPromise } = require("../config/database");
const Type = require("mssql").TYPES;
const sql = require("mssql");
const nodemailer = require('nodemailer'); // ใส่บนสุดของไฟล์



exports.Detail_Purchase = async (req, res) => {
  console.log('data:',req.body)
  try {
    const pool = await poolPromise; 
    const result = await pool
  .request()
    .query("SELECT * FROM [dbo].[View_CuttingTool_RequestList] WHERE Status IN ('Waiting','In Progress')ORDER BY ItemNo ASC, ID_Request ASC ");

    res.json(result.recordset);
  } 
  catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
 
};
exports.Get_ItemNo = async (req, res) => {
  console.log(req.body)
  try {
    const pool = await poolPromise;
    const result = await pool
    .request()
    .query("EXEC Stored_View_CuttingTool_FindItem_Purchase");

    res.json(result.recordset);
  } 
  catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

exports.get_ItemNo = async (req, res) => {
  console.log(req.body)
  try {
    const pool = await poolPromise;
    const result = await pool
    .request()
    .query("EXEC Stored_View_CuttingTool_FindItem_Purchase");

    res.json(result.recordset);
  } 
  catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};


exports.Update_Status_Purchase = async (req, res) => {
  console.log(req.body);

  const { 
    ID_Request, Status 
  } = req.body;

  try {
    const pool = await poolPromise;

    // อัปเดตสถานะ
    await pool.request()
      .input("ID_Request", sql.Int, ID_Request)
      .input("Status", sql.NVarChar, Status)
      .query(`
        UPDATE [dbo].[tb_IssueCuttingTool_Request_Document]
        SET 
            Status = @Status,
            DateComplete = CASE 
                             WHEN @Status = N'Complete' THEN SYSDATETIME()
                             ELSE DateComplete
                           END
        WHERE ID_Request = @ID_Request
      `);

    // ส่งอีเมลอัตโนมัติถ้า Status = Complete
    if (Status === "Complete") {
      try {
        const emailResult = await pool.request()
          .query(`SELECT Email FROM tb_CuttingTool_Employee WHERE Role = 'production'`);
        const emailList = emailResult.recordset.map(r => r.Email).filter(Boolean);

        if (!emailList.length) {
          console.warn("⚠️ ไม่พบอีเมลของ Role = production");
          return res.json({ success: true, message: "อัปเดตสำเร็จ แต่ไม่พบอีเมลสำหรับส่ง" });
        }

        const itemResult = await pool.request()
          .input("ID_Request", sql.Int, ID_Request)
          .query(`SELECT Division, PartNo, ItemNo, [CASE], Fac, QTY, DueDate, Requester, Remark
                  FROM tb_IssueCuttingTool_Request_Document
                  WHERE ID_Request = @ID_Request`);

        const item = itemResult.recordset[0];
        if (!item) return res.status(404).json({ success: false, message: "ไม่พบรายการนี้" });

        const formattedDueDate = item.DueDate ? new Date(item.DueDate).toLocaleDateString() : '-';

        const itemDetailsHtml = `
          <tr>
            <td>${item.Division || '-'}</td>
            <td>${item.PartNo || '-'}</td>
            <td>${item.ItemNo || '-'}</td>
            <td>${item.CASE || '-'}</td>
            <td>${item.Fac || '-'}</td>
            <td>${item.QTY || '-'}</td>
            <td>${formattedDueDate}</td>
            <td>${item.Requester || '-'}</td>
            <td>${item.Remark || '-'}</td>
          </tr>
        `;

        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: 'testsystem1508@gmail.com', pass: 'amdo inzi npqq asnd' }
        });

        await transporter.sendMail({
          from: '"Material Disbursement System" <testsystem1508@gmail.com>',
          to: emailList,
          subject: 'รายการเสร็จสิ้น',
          html: `
            <h1 style="color:black;">✅ แจ้งเตือน!! รายการถูกจัดส่งสำเร็จ</h1>
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
                  <th>Remark</th>
                </tr>
              </thead>
              <tbody>
                ${itemDetailsHtml}
              </tbody>
            </table>
          `
        });

        console.log("📧 ส่งอีเมลสำเร็จ");
        return res.json({ success: true, message: "Updated และส่งอีเมลเรียบร้อย" });

      } catch (mailError) {
        console.error("❌ ส่งอีเมลล้มเหลว:", mailError);
        return res.status(500).json({ success: false, message: "อัปเดตสำเร็จแต่ส่งอีเมลล้มเหลว", error: mailError.message });
      }
    }

    // กรณี Status ไม่ใช่ Complete
    res.json({ success: true, message: "Updated สำเร็จ" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการอัปเดต", error: err.message });
  }
};
// exports.Update_Status_Purchase = async (req, res) => {
//   console.log(req.body); // ตรวจสอบค่าที่ส่งมา { ID_Request: , Status:  }

// try {
//     const { 
//       ID_Request,
//       DocNo, 
//       Status, 
//       Requester, 
//       Fac,
//       CASE, 
//       PartNo, 
//       ItemNo, 
//       Process, 
//       MCType,  
//       Req_QTY, 
//       Remark, 
//       ON_HAND, 
//       DueDate, 
//       PathDwg, 
//       PathLayout,
//       SPEC,
//       QTY,
//       Division
//     } = req.body;

//     const pool = await poolPromise; 
//     const result = await pool
//       .request()
//       .input("ID_Request", sql.Int, ID_Request)
//       .input("Status", sql.NVarChar, Status)
//       // .input("PathLayout", sql.NVarChar, PathLayout)
      
//       .query(`
//         UPDATE [dbo].[tb_IssueCuttingTool_Request_Document]
//         SET 
//             Status = @Status,
           
//             DateComplete = CASE 
//                              WHEN @Status = N'Complete' THEN SYSDATETIME()
//                              ELSE DateComplete
//                            END
//         WHERE ID_Request = @ID_Request
//       `);
//       // =============================
//     // ✅ ส่งอีเมลอัตโนมัติถ้า Status = Complete
//     // =============================
//     // ส่งอีเมลอัตโนมัติถ้า Status = Complete
//     if (Status === "Complete") {
//       try {
//         const emailResult = await pool.request()
//           .query(`SELECT Email FROM tb_CuttingTool_Employee WHERE Role = 'production'`);

//         const emailList = emailResult.recordset.map(row => row.Email).filter(Boolean);

//         if (emailList.length > 0) {
//           const formattedDueDate = DueDate ? new Date(DueDate).toLocaleDateString() : '-';

//           const itemDetailsHtml = `
//             <tr>
//               <td>${Division || '-'}</td>
//               <td>${PartNo || '-'}</td>
//               <td>${ItemNo || '-'}</td>
//               <td>${CASE || '-'}</td>
//               <td>${Fac || '-'}</td>
//               <td>${QTY || '-'}</td>
//               <td>${formattedDueDate}</td>
//               <td>${Requester || '-'}</td>
//             </tr>
//           `;

//           const transporter = nodemailer.createTransport({
//             service: 'gmail',
//             auth: {
//               user: 'testsystem1508@gmail.com',
//               pass: 'amdo inzi npqq asnd' // App Password
//             }
//           });

//           const mailOptions = {
//             from: '"Material Disbursement System" <testsystem1508@gmail.com>',
//             to: emailList,
//             subject: 'รายการเสร็จสิ้น',
//             html: `
//               <h1 style="color:black;">✅ แจ้งเตือน!! รายการถูกส่งสำเร็จ</h1>
//               <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
//                 <thead>
//                   <tr style="background-color: #f2f2f2;">
//                     <th>Division</th>
//                     <th>Part No</th>
//                     <th>Item No</th>
//                     <th>Case</th>
//                     <th>Factory</th>
//                     <th>QTY</th>
//                     <th>DueDate</th>
//                     <th>Requester</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   ${itemDetailsHtml}
//                 </tbody>
//               </table>
//             `
//           };

//           await transporter.sendMail(mailOptions);
//           console.log("📧 ส่งอีเมลสำเร็จ");
//         } else {
//           console.warn("⚠️ ไม่พบอีเมลของ Role = production");
//         }
//       } catch (mailError) {
//         console.error("❌ ส่งอีเมลล้มเหลว:", mailError);
//       }
//     }

//     // ตอบกลับ client ว่าสำเร็จ
//     res.json({ success: true, message: "Updated successfully" });

//   } catch (error) {
//     console.error("Error executing query:", error.stack);
//     res.status(500).json({ error: "Internal Server Error", details: error.message });
//   }
// };

//     res.json({ success: true, message: "Updated successfully" });
//   } catch (error) {
//     console.error("Error executing query:", error.stack);
//     res.status(500).json({ error: "Internal Server Error", details: error.message });
//   }
// };

exports.Update_Request = async (req, res) => {
  try {
    const { 
      ID_Request,
      DocNo, 
      Status, 
      Requester, 
      Fac,
      CASE, 
      PartNo, 
      ItemNo, 
      Process, 
      MCType,  
      Req_QTY, 
      Remark, 
      ON_HAND, 
      DueDate, 
      PathDwg, 
      PathLayout,
      SPEC,
      QTY,
      PhoneNo
    } = req.body;

    const pool = await poolPromise;
    const result = await pool.request()
      .input("ID_Request", sql.Int, ID_Request)
      .input("DocNo", sql.NVarChar, DocNo)
      .input("Requester", sql.NVarChar, Requester)
      .input("PartNo", sql.NVarChar, PartNo)
      .input("ItemNo", sql.NVarChar, ItemNo)
      .input("SPEC", sql.NVarChar, SPEC)
      .input("Process", sql.NVarChar, Process)
      .input("MCType", sql.NVarChar, MCType)
      .input("Fac", sql.Int, Fac)
      .input("PathDwg", sql.NVarChar, PathDwg)
      .input("ON_HAND", sql.Int, ON_HAND)
      .input("Req_QTY", sql.Int, Req_QTY)
      .input("QTY", sql.Int, QTY)
      .input("DueDate", sql.DateTime, DueDate ? new Date(DueDate) : null)
      .input("CASE", sql.NVarChar, CASE)
      .input("Status", sql.NVarChar, Status)
      .input("PathLayout", sql.NVarChar, PathLayout)
      .input("Remark", sql.NVarChar, Remark)
      .input("PhoneNo", sql.Int, PhoneNo)
      .query(`
        UPDATE [dbo].[tb_IssueCuttingTool_Request_Document]
        SET DocNo = @DocNo,
            Requester = @Requester,
            PartNo = @PartNo,
            ItemNo = @ItemNo,
            SPEC = @SPEC,
            Process = @Process,
            MCType = @MCType,
            Fac = @Fac,
            PathDwg = @PathDwg,
            ON_HAND = @ON_HAND,
            Req_QTY = @Req_QTY,
            QTY = @QTY,
            DueDate = @DueDate,
            [CASE] = @CASE,
            Status = @Status,
            PathLayout = @PathLayout,
            Remark = @Remark,
            PhoneNo = @PhoneNo
        WHERE ID_Request = @ID_Request
      `);
    if (result.rowsAffected[0] > 0) {
      res.json({ success: true, message: "Request detail updated successfully" });
    } else {
      res.status(404).json({ success: false, message: "Request not found or no changes made" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.Add_New_Request = async (req, res) => {
  try {
    console.log(req.body);

    let { 
      DocNo,
      Division, 
      Status, 
      Requester, 
      Fac,
      SPEC,
      QTY,
      CASE, 
      PartNo, 
      ItemNo, 
      Process, 
      MCType,  
      Req_QTY, 
      Remark, 
      ON_HAND, 
      DueDate, 
      PathDwg, 
      PathLayout,
      PhoneNo
    } = req.body;

    if (!ItemNo && !SPEC) {
      return res.status(400).json({ message: "ต้องระบุ ItemNo หรือ SPEC" });
    }

    const pool = await poolPromise;

    if (!ItemNo) {
      const itemResult = await pool.request()
        .input("SPEC", sql.NVarChar, SPEC)
        .query(`
          SELECT TOP 1 ItemNo
          FROM tb_IssueCuttingTool_Request_Document
          WHERE SPEC = @SPEC
        `);

      if (itemResult.recordset.length === 0) {
        return res.status(400).json({ message: "ไม่พบ ItemNo ในฐานข้อมูล" });
      }

      ItemNo = itemResult.recordset[0].ItemNo;
    }

 const result = await pool.request()
        
      .input("DocNo", sql.NVarChar, DocNo)
      .input("Division",sql.NVarChar,Division)
      .input("Requester", sql.NVarChar, Requester)
      .input("PartNo", sql.NVarChar, PartNo)
      .input("ItemNo", sql.NVarChar, ItemNo)
      .input("SPEC", sql.NVarChar, SPEC)
      .input("Process", sql.NVarChar, Process)
      .input("MCType", sql.NVarChar, MCType)
      .input("Fac", sql.Int, parseInt(Fac, 10))
      .input("PathDwg", sql.NVarChar, PathDwg)
      .input("ON_HAND", sql.Int, parseInt(ON_HAND, 10))
      .input("Req_QTY", sql.Int, parseInt(Req_QTY, 10))
      .input("QTY", sql.Int, parseInt(QTY, 10) || 0)
      .input("DueDate", sql.DateTime, DueDate ? new Date(DueDate) : null)
      .input("CASE", sql.NVarChar, CASE)
      .input("Status", sql.NVarChar, Status)
      .input("PathLayout", sql.NVarChar, PathLayout)
      .input("Remark", sql.NVarChar, Remark)
      .input("PhoneNo", sql.Int, PhoneNo)
      .query(`
        INSERT INTO [dbo].[tb_IssueCuttingTool_Request_Document] 
        (DocNo, Division, Requester, PartNo, ItemNo, SPEC, Process, MCType, Fac, PathDwg, ON_HAND, Req_QTY, QTY, DueDate, [CASE], Status, PathLayout, Remark, PhoneNo)
        OUTPUT INSERTED.ID_Request
        VALUES 
        (@DocNo,@Division, @Requester, @PartNo, @ItemNo, @SPEC, @Process, @MCType, @Fac, @PathDwg, @ON_HAND, @Req_QTY, @QTY, @DueDate, @CASE, @Status, @PathLayout, @Remark, @PhoneNo);
      `);

    const ID_Request = result.recordset[0]?.ID_Request || null;

    if (!ID_Request) {
      return res.status(500).json({ message: "ไม่สามารถสร้าง ID ใหม่ได้" });
    }

    res.status(201).json({ message: 'เพิ่มข้อมูลสำเร็จ', ID_Request });

  } catch (error) {
    console.error('Error in Add_New_Request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.DeleteItem = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('ID', sql.Int, id)
      .query('DELETE FROM [dbo].[tb_IssueCuttingTool_Request_Document]  WHERE ID_Request = @ID');

    res.status(200).json({ message: 'ลบสำเร็จ' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ message: 'ลบไม่สำเร็จ', error: error.message });
  }
};

// exports.Send_Complete_Email = async (req, res) => {
//   try {
//     const pool = await poolPromise;

//     // ดึงอีเมลทั้งหมดที่ Role = 'production'
//     const emailResult = await pool.request()
//       .query(`SELECT Email FROM tb_CuttingTool_Employee WHERE Role = 'production'`);

//     const emailList = emailResult.recordset.map(row => row.Email).filter(Boolean);

//     if (emailList.length === 0) {
//       console.warn("ไม่พบอีเมลของ Role = production ในฐานข้อมูล");
//       return res.status(404).json({ message: "ไม่พบอีเมลของ Role = production" });
//     }

//     const { items } = req.body; // รับ items จาก frontend

//     let itemDetailsHtml = items.map(item => `
//       <tr>
//         <td>${item.Division}</td>
//         <td>${item.PartNo}</td>
//         <td>${item.ItemNo}</td>
//         <td>${item.Case_}</td>
//         <td>${item.Factory}</td>
//         <td>${item.QTY}</td>
//         <td>${item.DueDate_}</td>
//         <td>${item.Employee_Name}</td>
//       </tr>
//     `).join('');

//     // ======== ส่งอีเมลแจ้งเตือน ========
//     const transporter = nodemailer.createTransport({
//       service: 'gmail',
//       auth: {
//         user: 'testsystem1508@gmail.com',
//         pass: 'amdo inzi npqq asnd' // App Password
//       }
//     });

//     const mailOptions = {
//       from: '"Material Disbursement System" <testsystem1508@gmail.com>',
//       to: emailList,
//       subject: 'รายการเสร็จสิ้น',
//       html: `
//         <h1 style="color:black;">✅ แจ้งเตือน!! รายการถูกส่งสำเร็จ</h1>
//         <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
//           <thead>
//             <tr style="background-color: #f2f2f2;">
//               <th>Division</th>
//               <th>Part No</th>
//               <th>Item No</th>
//               <th>Case</th>
//               <th>Factory</th>
//               <th>QTY</th>
//               <th>DueDate</th>
//               <th>Requester</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${itemDetailsHtml}
//           </tbody>
//         </table>
//       `
//     };

//     await transporter.sendMail(mailOptions);

//     console.log("ส่งอีเมลสำเร็จ");
//     res.json({ success: true, message: "ส่งอีเมลเรียบร้อย" });

//   } catch (error) {
//     console.error("ส่งอีเมลไม่สำเร็จ:", error);
//     res.status(500).json({ success: false, message: "ส่งอีเมลไม่สำเร็จ", error: error.message });
//   }
// };
