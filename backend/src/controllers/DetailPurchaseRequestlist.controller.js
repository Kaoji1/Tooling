// const { poolPromise } = require("../config/database");
// const Type = require("mssql").TYPES;
// const sql = require("mssql");
// const nodemailer = require('nodemailer'); // ใส่บนสุดของไฟล์



// // exports.Detail_Purchase = async (req, res) => {
// //   console.log('data:',req.body)
// //   try {
// //     const pool = await poolPromise; 
// //     const result = await pool
// //   .request()
// //     // .query("SELECT * FROM [dbo].[Stored_View_CuttingTool_RequestList_Query] WHERE Status IN ('Waiting','In Progress')ORDER BY ItemNo ASC, ID_Request ASC ");
// //     .query("EXEC Stored_View_CuttingTool_RequestList_Query");


// //     res.json(result.recordset);
// //   } 
// //   catch (error) {
// //     console.error("Error executing query:", error.stack);
// //     res.status(500).json({ error: "Internal Server Error", details: error.message });
// //   }

// // };

// exports.Detail_Purchase = async (req, res) => {
//   console.log('data:', req.body);
//   try {
//     const pool = await poolPromise;
//     const result = await pool
//       .request()
//       .query("EXEC Stored_View_CuttingTool_RequestList_Query");

//     // ฟิลเตอร์ข้อมูลเฉพาะ Waiting
//     const filtered = result.recordset.filter(row => row.Status === "Waiting");

//     res.json(filtered);
//   } catch (error) {
//     console.error("Error executing query:", error.stack);
//     res.status(500).json({ error: "Internal Server Error", details: error.message });
//   }
// };
// // exports.Detail_Purchase = async (req, res) => {
// //   console.log('data:', req.body);
// //   try {
// //     const pool = await poolPromise;
// //     const request = pool.request();
// //     request.stream = true; // เปิด streaming

// //     request.query("EXEC Stored_View_CuttingTool_RequestList_Query");

// //     res.setHeader("Content-Type", "application/json");
// //     res.write("["); // เริ่ม JSON array
// //     let first = true;

// //     request.on("row", row => {
// //       const data = JSON.stringify(row);
// //       if (!first) res.write(",");
// //       res.write(data);
// //       first = false;
// //     });

// //     request.on("done", () => {
// //       res.write("]"); // ปิด JSON array
// //       res.end();
// //     });

// //     request.on("error", err => {
// //       console.error("Error executing query:", err.stack);
// //       res.status(500).send(err.message);
// //     });

// //   } catch (error) {
// //     console.error("Internal server error:", error.stack);
// //     res.status(500).json({ error: "Internal Server Error", details: error.message });
// //   }
// // };


// exports.Get_ItemNo = async (req, res) => {
//   console.log(req.body)
//   try {
//     const pool = await poolPromise;
//     const result = await pool
//     .request()
//     .query("EXEC Stored_View_CuttingTool_FindItem_Purchase");

//     res.json(result.recordset);
//   } 
//   catch (error) {
//     console.error("Error executing query:", error.stack);
//     res.status(500).json({ error: "Internal Server Error", details: error.message });
//   }
// };

// // exports.get_ItemNo = async (req, res) => {
// //   console.log(req.body)
// //   try {
// //     const pool = await poolPromise;
// //     const result = await pool
// //     .request()
// //     .query("EXEC Stored_View_CuttingTool_FindItem_Purchase");

// //     res.json(result.recordset);
// //   } 
// //   catch (error) {
// //     console.error("Error executing query:", error.stack);
// //     res.status(500).json({ error: "Internal Server Error", details: error.message });
// //   }
// // };



// exports.Update_Request = async (req, res) => {
//   try {
//     const pool = await poolPromise;
//     const inputParams = [
//       "ID_Request","DocNo","Status","Requester","Fac","CASE","PartNo","ItemNo",
//       "Process","MCType","Req_QTY","Remark","ON_HAND","DueDate","PathDwg","PathLayout","SPEC","QTY","PhoneNo"
//     ];
//     const rq = pool.request();
//     inputParams.forEach(p => {
//       if (req.body[p] !== undefined) {
//         const val = req.body[p];
//         const type = (["Fac","ON_HAND","Req_QTY","QTY","PhoneNo"].includes(p)) ? sql.Int
//                   : (p === "DueDate") ? sql.DateTime : sql.NVarChar;
//         rq.input(p, type, type === sql.DateTime && val ? new Date(val) : val);
//       }
//     });
//     const result = await rq.query("EXEC Stored_View_CuttingTool_RequestList_Update"); // SP อัปเดต Request

//     res.json({ success: true, message: "Request updated successfully" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: error.message });
//   }
// };

// exports.Update_Request = async (req, res) => {
//   try {
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
//       PhoneNo
//     } = req.body;

//     const pool = await poolPromise;
//     const result = await pool.request()
//       .input("ID_Request", sql.Int, ID_Request)
//       .input("DocNo", sql.NVarChar, DocNo)
//       .input("Requester", sql.NVarChar, Requester)
//       .input("PartNo", sql.NVarChar, PartNo)
//       .input("ItemNo", sql.NVarChar, ItemNo)
//       .input("SPEC", sql.NVarChar, SPEC)
//       .input("Process", sql.NVarChar, Process)
//       .input("MCType", sql.NVarChar, MCType)
//       .input("Fac", sql.Int, Fac)
//       .input("PathDwg", sql.NVarChar, PathDwg)
//       .input("ON_HAND", sql.Int, ON_HAND)
//       .input("Req_QTY", sql.Int, Req_QTY)
//       .input("QTY", sql.Int, QTY)
//       .input("DueDate", sql.DateTime, DueDate ? new Date(DueDate) : null)
//       .input("CASE", sql.NVarChar, CASE)
//       .input("Status", sql.NVarChar, Status)
//       .input("PathLayout", sql.NVarChar, PathLayout)
//       .input("Remark", sql.NVarChar, Remark)
//       .input("PhoneNo", sql.Int, PhoneNo)
//       .query(`
//         UPDATE [dbo].[tb_IssueCuttingTool_Request_Document]
//         SET DocNo = @DocNo,
//             Requester = @Requester,
//             PartNo = @PartNo,
//             ItemNo = @ItemNo,
//             SPEC = @SPEC,
//             Process = @Process,
//             MCType = @MCType,
//             Fac = @Fac,
//             PathDwg = @PathDwg,
//             ON_HAND = @ON_HAND,
//             Req_QTY = @Req_QTY,
//             QTY = @QTY,
//             DueDate = @DueDate,
//             [CASE] = @CASE,
//             Status = @Status,
//             PathLayout = @PathLayout,
//             Remark = @Remark,
//             PhoneNo = @PhoneNo
//         WHERE ID_Request = @ID_Request
//       `);

//     if (result.rowsAffected[0] > 0) {
//       res.json({ success: true, message: "Request detail updated successfully" });
//     } else {
//       res.status(404).json({ success: false, message: "Request not found or no changes made" });
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: error.message });
//   }
// };


// exports.Add_New_Request = async (req, res) => {
//   try {
//     console.log(req.body);

//     let { 
//       DocNo,
//       Division, 
//       Status, 
//       Requester, 
//       Fac,
//       SPEC,
//       QTY,
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
//       PhoneNo
//     } = req.body;

//     if (!ItemNo && !SPEC) {
//       return res.status(400).json({ message: "ItemNo or SPEC must be specified." });
//     }

//     const pool = await poolPromise;

//     if (!ItemNo) {
//       const itemResult = await pool.request()
//         .input("SPEC", sql.NVarChar, SPEC)
//         .query(`
//           SELECT TOP 1 ItemNo
//           FROM tb_IssueCuttingTool_Request_Document
//           WHERE SPEC = @SPEC
//         `);

//       if (itemResult.recordset.length === 0) {
//         return res.status(400).json({ message: "ItemNo not found in database." });
//       }

//       ItemNo = itemResult.recordset[0].ItemNo;
//     }

//  const result = await pool.request()

//       .input("DocNo", sql.NVarChar, DocNo)
//       .input("Division",sql.NVarChar,Division)
//       .input("Requester", sql.NVarChar, Requester)
//       .input("PartNo", sql.NVarChar, PartNo)
//       .input("ItemNo", sql.NVarChar, ItemNo)
//       .input("SPEC", sql.NVarChar, SPEC)
//       .input("Process", sql.NVarChar, Process)
//       .input("MCType", sql.NVarChar, MCType)
//       .input("Fac", sql.Int, parseInt(Fac, 10))
//       .input("PathDwg", sql.NVarChar, PathDwg)
//       .input("ON_HAND", sql.Int, parseInt(ON_HAND, 10))
//       .input("Req_QTY", sql.Int, parseInt(Req_QTY, 10))
//       .input("QTY", sql.Int, parseInt(QTY, 10) || 0)
//       .input("DueDate", sql.DateTime, DueDate ? new Date(DueDate) : null)
//       .input("CASE", sql.NVarChar, CASE)
//       .input("Status", sql.NVarChar, Status)
//       .input("PathLayout", sql.NVarChar, PathLayout)
//       .input("Remark", sql.NVarChar, Remark)
//       .input("PhoneNo", sql.Int, PhoneNo)
//       .query(`
//         INSERT INTO [dbo].[tb_IssueCuttingTool_Request_Document] 
//         (DocNo, Division, Requester, PartNo, ItemNo, SPEC, Process, MCType, Fac, PathDwg, ON_HAND, Req_QTY, QTY, DueDate, [CASE], Status, PathLayout, Remark, PhoneNo)
//         OUTPUT INSERTED.ID_Request
//         VALUES 
//         (@DocNo,@Division, @Requester, @PartNo, @ItemNo, @SPEC, @Process, @MCType, @Fac, @PathDwg, @ON_HAND, @Req_QTY, @QTY, @DueDate, @CASE, @Status, @PathLayout, @Remark, @PhoneNo);
//       `);

//     const ID_Request = result.recordset[0]?.ID_Request || null;

//     if (!ID_Request) {
//       return res.status(500).json({ message: "Unable to create a new ID" });
//     }

//     res.status(201).json({ message: 'Successfully added information', ID_Request });

//   } catch (error) {
//     console.error('Error in Add_New_Request:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// exports.DeleteItem = async (req, res) => {
//   const { id } = req.params;
//   try {
//     const pool = await poolPromise;
//     await pool.request()
//       .input('ID', sql.Int, id)
//       .query('DELETE FROM [dbo].[tb_IssueCuttingTool_Request_Document]  WHERE ID_Request = @ID');

//     res.status(200).json({ message: 'Successfully deleted' });
//   } catch (error) {
//     console.error('Error deleting item:', error);
//     res.status(500).json({ message: 'Failed to delete', error: error.message });
//   }
// };


const { poolPromise } = require("../config/database");
const Type = require("mssql").TYPES;
const sql = require("mssql");
const nodemailer = require('nodemailer'); // ใส่บนสุดของไฟล์

const frontendLink = process.env.FRONTEND_URL || 'http://localhost:4200';



exports.Detail_Purchase = async (req, res) => {
  console.log('data:', req.body)
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
  try {
    const { ID_Request, Status } = req.body || {};

    // Normalize → array
    let idList = [];
    if (Array.isArray(ID_Request)) idList = ID_Request.map(Number);
    else if (ID_Request !== undefined) idList = [Number(ID_Request)];

    idList = idList.filter(n => Number.isInteger(n));
    if (!idList.length) {
      return res.status(400).json({ success: false, message: "No valid ID_Request" });
    }
    if (!Status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }

    const pool = await poolPromise;

    // 🔄 เรียก Stored Procedure หรือ Query
    // Use parameters for the update to be safe
    const placeholders = idList.map((_, i) => `@id${i}`).join(", ");
    const rq = pool.request();
    idList.forEach((id, i) => rq.input(`id${i}`, sql.Int, id));
    rq.input("Status", sql.NVarChar, Status);

    await rq.query(`
      UPDATE d
      SET d.Status = @Status,
          d.DateComplete = CASE WHEN @Status = N'Complete' THEN SYSDATETIME() ELSE d.DateComplete END
      FROM dbo.tb_IssueCuttingTool_Request_Document d
      WHERE d.ID_Request IN (${placeholders});
    `);

    // ส่งอีเมลถ้า Status = Complete
    if (Status === "Complete") {
      try {
        console.log("Attempting to send email for IDs:", idList);

        // Use a NEW request for fetching data for email
        // Since idList contains only filtered integers, joining them is safe
        const safeIds = idList.join(",");

        const rows = await pool.request().query(`
          SELECT Division, PartNo, ItemNo, SPEC, [CASE], MCType, MCNo, Fac, QTY, DueDate, Requester, Remark
          FROM dbo.tb_IssueCuttingTool_Request_Document
          WHERE ID_Request IN (${safeIds});
        `);

        console.log(`Found ${rows.recordset.length} items for email body.`);

        const emailRes = await pool.request().query(
          `SELECT Email FROM tb_CuttingTool_Employee WHERE Role IN ('production','admin')`
        );
        const emailList = emailRes.recordset.map(r => r.Email).filter(Boolean);

        console.log("Recipient emails:", emailList);

        if (emailList.length && rows.recordset.length) {
          const fmt = d => (d ? new Date(d).toLocaleDateString() : "-");
          const rowsHtml = rows.recordset.map(it => `
            <tr>
              <td>${it.Division ?? '-'}</td>
              <td>${it.PartNo ?? '-'}</td>
              <td>${it.ItemNo ?? '-'}</td>
              <td>${it.SPEC ?? '-'}</td>
              <td>${it.CASE ?? '-'}</td>
              <td>${it.MCType ?? '-'}</td>
              <td>${it.MCNo ?? '-'}</td>
              <td>${it.Fac ?? '-'}</td>
              <td>${it.QTY ?? '-'}</td>
              <td>${fmt(it.DueDate)}</td>
              <td>${it.Requester ?? '-'}</td>
              <td>${it.Remark ?? '-'}</td>
            </tr>
          `).join("");

          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.EMAIL_USER || 'testsystem1508@gmail.com',
              pass: process.env.EMAIL_PASS || 'amdo inzi npqq asnd'
            }
          });

          console.log("Using email user:", process.env.EMAIL_USER || 'testsystem1508@gmail.com');

          await transporter.sendMail({
            from: `"Indirect expense" <${process.env.EMAIL_USER}>`,
            to: emailList,
            subject: `รายการเสร็จสิ้น ${rows.recordset.length} รายการ`,
            html: `
              <h1 style="color:black;">✅ Massage Notification!! Item has been successfully delivered.</h1>
              <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #f2f2f2;">
                    <th>Division</th>
                    <th>Part No</th>
                    <th>Item No</th>
                    <th>Spec</th>
                    <th>Case</th>
                    <th>MCType</th>
                    <th>MCNo</th>
                    <th>Factory</th>
                    <th>QTY</th>
                    <th>DueDate</th>
                    <th>Requester</th>
                    <th>Remark</th>
                  </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
              </table>
              <h3>Come in and check 👉 <a href="http://${frontendLink}/login">Indirect expense</a></h3>
            `
          });
          console.log("Email sent successfully.");
        } else {
          console.warn("Email not sent. Either no recipients or no items found.");
        }
      } catch (emailErr) {
        console.error("Error sending email:", emailErr);
        // We do NOT return error here, because the DB update was successful.
        // We could just log it.
      }
    }

    return res.json({ success: true, message: `Updated ${idList.length} item(s)` });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Update failed",
      error: err.message
    });
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
//               user: process.env.EMAIL_USER,
//               pass: process.env.EMAIL_PASS // App Password
//             }
//           });

//           const mailOptions = {
//             from: `"Material Disbursement System" <${process.env.EMAIL_USER}>`,
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
      return res.status(400).json({ message: "ItemNo or SPEC must be specified." });
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
        return res.status(400).json({ message: "ItemNo not found in database." });
      }

      ItemNo = itemResult.recordset[0].ItemNo;
    }

    const result = await pool.request()

      .input("DocNo", sql.NVarChar, DocNo)
      .input("Division", sql.NVarChar, Division)
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
      return res.status(500).json({ message: "Unable to create a new ID" });
    }

    res.status(201).json({ message: 'Successfully added information', ID_Request });

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

    res.status(200).json({ message: 'Successfully deleted' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ message: 'Failed to delete', error: error.message });
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


// exports.Add_New_Request = async (req, res) => {
//   try {
//     const pool = await poolPromise;
//     const rq = pool.request();
//     const inputParams = [
//       "DocNo","Division","Status","Requester","Fac","SPEC","QTY","CASE",
//       "PartNo","ItemNo","Process","MCType","Req_QTY","Remark","ON_HAND","DueDate",
//       "PathDwg","PathLayout","PhoneNo"
//     ];
//     inputParams.forEach(p => {
//       if (req.body[p] !== undefined) {
//         const val = req.body[p];
//         const type = (["Fac","ON_HAND","Req_QTY","QTY","PhoneNo"].includes(p)) ? sql.Int
//                   : (p === "DueDate") ? sql.DateTime : sql.NVarChar;
//         rq.input(p, type, type === sql.DateTime && val ? new Date(val) : val);
//       }
//     });

//     const result = await rq.query("EXEC Stored_View_CuttingTool_RequestList_Add"); // SP เพิ่ม Request
//     const ID_Request = result.recordset[0]?.ID_Request || null;

//     if (!ID_Request) return res.status(500).json({ message: "Unable to create a new ID" });

//     res.status(201).json({ message: 'Successfully added information', ID_Request });
//   } catch (error) {
//     console.error('Error in Add_New_Request:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// exports.DeleteItem = async (req, res) => {
//   try {
//     const pool = await poolPromise;
//     await pool.request()
//       .input('ID_Request', sql.Int, req.params.id)
//       .query('EXEC Stored_View_CuttingTool_RequestList_Delete'); // SP ลบ Request
//     res.status(200).json({ message: 'Successfully deleted' });
//   } catch (error) {
//     console.error('Error deleting item:', error);
//     res.status(500).json({ message: 'Failed to delete', error: error.message });
//   }
// };



// exports.Update_Request = async (req, res) => {
//   try {
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
//       PhoneNo
//     } = req.body;

//     const pool = await poolPromise;
//     const result = await pool.request()
//   .input("ID_Request", sql.Int, ID_Request)
//   .input("DocNo", sql.NVarChar, DocNo)
//   .input("Status", sql.NVarChar, Status)
//   .input("Requester", sql.NVarChar, Requester)
//   .input("PartNo", sql.NVarChar, PartNo)
//   .input("ItemNo", sql.NVarChar, ItemNo)
//   .input("SPEC", sql.NVarChar, SPEC)
//   .input("Process", sql.NVarChar, Process)
//   .input("MCType", sql.NVarChar, MCType)
//   .input("Fac", sql.Int, Fac)
//   .input("ON_HAND", sql.Int, ON_HAND)
//   .input("Req_QTY", sql.Int, Req_QTY)
//   .input("QTY", sql.Int, QTY)
//   .input("DueDate", sql.DateTime, DueDate ? new Date(DueDate) : null)
//   .input("CASE", sql.NVarChar, CASE)
//   .input("Remark", sql.NVarChar, Remark)
//   .input("PathDwg", sql.NVarChar, PathDwg)
//   .input("PathLayout", sql.NVarChar, PathLayout)
//   .input("PhoneNo", sql.Int, PhoneNo)
//       .query("EXEC Stored_View_CuttingTool_RequestList_Update");

//     if (result.recordset[0].RowsAffected > 0) {
//       res.json({ success: true, message: "Request detail updated successfully" });
//     } else {
//       res.status(404).json({ success: false, message: "Request not found or no changes made" });
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: error.message });
//   }
// };


// exports.Update_Request = async (req, res) => {
//   try {
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
//       PhoneNo
//     } = req.body;

//     const pool = await poolPromise;
//     const result = await pool.request()
//       .input("ID_Request", sql.Int, ID_Request)
//       .input("DocNo", sql.NVarChar, DocNo)
//       .input("Requester", sql.NVarChar, Requester)
//       .input("PartNo", sql.NVarChar, PartNo)
//       .input("ItemNo", sql.NVarChar, ItemNo)
//       .input("SPEC", sql.NVarChar, SPEC)
//       .input("Process", sql.NVarChar, Process)
//       .input("MCType", sql.NVarChar, MCType)
//       .input("Fac", sql.Int, Fac)
//       .input("PathDwg", sql.NVarChar, PathDwg)
//       .input("ON_HAND", sql.Int, ON_HAND)
//       .input("Req_QTY", sql.Int, Req_QTY)
//       .input("QTY", sql.Int, QTY)
//       .input("DueDate", sql.DateTime, DueDate ? new Date(DueDate) : null)
//       .input("CASE", sql.NVarChar, CASE)
//       .input("Status", sql.NVarChar, Status)
//       .input("PathLayout", sql.NVarChar, PathLayout)
//       .input("Remark", sql.NVarChar, Remark)
//       .input("PhoneNo", sql.Int, PhoneNo)
//       .query(`
//         UPDATE [dbo].[tb_IssueCuttingTool_Request_Document]
//         SET DocNo = @DocNo,
//             Requester = @Requester,
//             PartNo = @PartNo,
//             ItemNo = @ItemNo,
//             SPEC = @SPEC,
//             Process = @Process,
//             MCType = @MCType,
//             Fac = @Fac,
//             PathDwg = @PathDwg,
//             ON_HAND = @ON_HAND,
//             Req_QTY = @Req_QTY,
//             QTY = @QTY,
//             DueDate = @DueDate,
//             [CASE] = @CASE,
//             Status = @Status,
//             PathLayout = @PathLayout,
//             Remark = @Remark,
//             PhoneNo = @PhoneNo
//         WHERE ID_Request = @ID_Request
//       `);

//     if (result.rowsAffected[0] > 0) {
//       res.json({ success: true, message: "Request detail updated successfully" });
//     } else {
//       res.status(404).json({ success: false, message: "Request not found or no changes made" });
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: error.message });
//   }
// };

// exports.Add_New_Request = async (req, res) => {
//   try {
//     console.log(req.body);

//     let { 
//       DocNo,
//       Division, 
//       Status, 
//       Requester, 
//       Fac,
//       SPEC,
//       QTY,
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
//       PhoneNo
//     } = req.body;

//     if (!ItemNo && !SPEC) {
//       return res.status(400).json({ message: "ItemNo or SPEC must be specified." });
//     }

//     const pool = await poolPromise;

//     if (!ItemNo) {
//       const itemResult = await pool.request()
//         .input("SPEC", sql.NVarChar, SPEC)
//         .query(`
//           SELECT TOP 1 ItemNo
//           FROM tb_IssueCuttingTool_Request_Document
//           WHERE SPEC = @SPEC
//         `);

//       if (itemResult.recordset.length === 0) {
//         return res.status(400).json({ message: "ItemNo not found in database." });
//       }

//       ItemNo = itemResult.recordset[0].ItemNo;
//     }

//  const result = await pool.request()

//       .input("DocNo", sql.NVarChar, DocNo)
//       .input("Division",sql.NVarChar,Division)
//       .input("Requester", sql.NVarChar, Requester)
//       .input("PartNo", sql.NVarChar, PartNo)
//       .input("ItemNo", sql.NVarChar, ItemNo)
//       .input("SPEC", sql.NVarChar, SPEC)
//       .input("Process", sql.NVarChar, Process)
//       .input("MCType", sql.NVarChar, MCType)
//       .input("Fac", sql.Int, parseInt(Fac, 10))
//       .input("PathDwg", sql.NVarChar, PathDwg)
//       .input("ON_HAND", sql.Int, parseInt(ON_HAND, 10))
//       .input("Req_QTY", sql.Int, parseInt(Req_QTY, 10))
//       .input("QTY", sql.Int, parseInt(QTY, 10) || 0)
//       .input("DueDate", sql.DateTime, DueDate ? new Date(DueDate) : null)
//       .input("CASE", sql.NVarChar, CASE)
//       .input("Status", sql.NVarChar, Status)
//       .input("PathLayout", sql.NVarChar, PathLayout)
//       .input("Remark", sql.NVarChar, Remark)
//       .input("PhoneNo", sql.Int, PhoneNo)
//       .query(`
//         INSERT INTO [dbo].[tb_IssueCuttingTool_Request_Document] 
//         (DocNo, Division, Requester, PartNo, ItemNo, SPEC, Process, MCType, Fac, PathDwg, ON_HAND, Req_QTY, QTY, DueDate, [CASE], Status, PathLayout, Remark, PhoneNo)
//         OUTPUT INSERTED.ID_Request
//         VALUES 
//         (@DocNo,@Division, @Requester, @PartNo, @ItemNo, @SPEC, @Process, @MCType, @Fac, @PathDwg, @ON_HAND, @Req_QTY, @QTY, @DueDate, @CASE, @Status, @PathLayout, @Remark, @PhoneNo);
//       `);

//     const ID_Request = result.recordset[0]?.ID_Request || null;

//     if (!ID_Request) {
//       return res.status(500).json({ message: "Unable to create a new ID" });
//     }

//     res.status(201).json({ message: 'Successfully added information', ID_Request });

//   } catch (error) {
//     console.error('Error in Add_New_Request:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };


// exports.DeleteItem = async (req, res) => {
//   const { id } = req.params;
//   try {
//     const pool = await poolPromise;
//     await pool.request()
//       .input('ID', sql.Int, id)
//       .query('DELETE FROM [dbo].[tb_IssueCuttingTool_Request_Document]  WHERE ID_Request = @ID');

//     res.status(200).json({ message: 'Successfully deleted' });
//   } catch (error) {
//     console.error('Error deleting item:', error);
//     res.status(500).json({ message: 'Failed to delete', error: error.message });
//   }
// };

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

exports.Add_New_Request_Bulk = async (req, res) => {
  try {
    const items = req.body; // Expecting an array of objects
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Invalid input: Expected an array of request items." });
    }

    const pool = await poolPromise;
    let successCount = 0;
    let failCount = 0;

    // Group items by keys that determine DocNo: Division, CASE, Process, Fac
    const groups = {};
    for (const item of items) {
      const key = `${item.Division}_${item.CASE}_${item.Process}_${item.Fac}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }

    for (const key in groups) {
      const groupItems = groups[key];
      const firstItem = groupItems[0];

      // Generate DocNo for this group
      let docNo = firstItem.DocNo; // Use provided DocNo if available

      // Only generate if not provided or temporary format
      if (!docNo || docNo.startsWith('REQ-')) {
        try {
          const division = firstItem.Division ? firstItem.Division.toUpperCase() : '';
          const case_ = firstItem.CASE;
          const process = firstItem.Process;
          const factory = firstItem.Fac;

          if (case_ && process && factory) {
            // Logic ported and adjusted
            let casePart = '';
            switch (case_.toUpperCase()) {
              case 'F/A': casePart = 'FA'; break; // Removed underscore based on request "Process+Fac+Case" (implied concat) or keep?
              // User example: "TN3SET260122". "SET" is likely Case "SET"? 
              // Previous code: FA_, NG_, PP_, RW_.
              // User example "TN3SET". TN=Process, 3=Fac, SET=Case?
              // Let's assume Case "SET" -> "SET".
              // If Case is "F/A", "N/G" etc, user said "Case".
              // Let's keep abbreviations but maybe strip underscores if user example implies tight concat?
              // User Example: TN3SET...
              // Process=TN, Fac=3, Case=SET.
              // So I should probably NOT use underscores.
              // Previous: FA_, NG_...
              // I will adjust to remove underscores for new format.
              case 'F/A': casePart = 'FA'; break;
              case 'N/G': casePart = 'NG'; break;
              case 'P/P': casePart = 'PP'; break;
              case 'R/W': casePart = 'RW'; break;
              default: casePart = case_.toUpperCase();
            }

            let processPart = '';
            const proc = process.toLowerCase();
            if (['turning', 'milling', 'milling2'].includes(proc)) processPart = (proc === 'turning') ? 'TN' : 'ML';
            else if (['f&boring', 'rl'].some(p => proc.includes(p))) processPart = 'RL';
            else processPart = 'XX'; // Fallback

            const factoryPart = factory.toString().toUpperCase();

            // Date Part: yymmdd
            const now = new Date();
            const yy = now.getFullYear().toString().slice(-2);
            const mm = (now.getMonth() + 1).toString().padStart(2, '0');
            const dd = now.getDate().toString().padStart(2, '0');
            const datePart = `${yy}${mm}${dd}`;

            let prefix = '';

            if (division === '7122') {
              // Process + Fac + Case + M/R No.(yymmdd)
              prefix = `${processPart}${factoryPart}${casePart}${datePart}`;
            } else if (division === '71DZ') {
              // Case + Process + Fac + M/R No.(yymmdd)
              prefix = `${casePart}${processPart}${factoryPart}${datePart}`;
            } else {
              // Default Fallback (Use 7122 logic or previous?)
              // Using 7122 logic as default for safety
              prefix = `${processPart}${factoryPart}${casePart}${datePart}`;
            }

            let isUnique = false;
            let finalDocNo = prefix;
            let counter = 1;

            // Check if strict prefix exists (End with date)
            const check = await pool.request().input('DocNo', sql.NVarChar(50), finalDocNo)
              .query(`SELECT COUNT(*) AS count FROM tb_IssueCuttingTool_Request_Document WHERE DocNo = @DocNo`);
            if (check.recordset[0].count === 0) {
              isUnique = true;
            }

            // If not unique, append running number
            while (!isUnique) {
              finalDocNo = `${prefix}${counter.toString().padStart(2, '0')}`; // Try 01, 02...
              const checkRun = await pool.request().input('DocNo', sql.NVarChar(50), finalDocNo)
                .query(`SELECT COUNT(*) AS count FROM tb_IssueCuttingTool_Request_Document WHERE DocNo = @DocNo`);
              if (checkRun.recordset[0].count === 0) {
                isUnique = true;
              } else {
                counter++;
              }
            }

            docNo = finalDocNo;
            console.log(`Generated DocNo for group ${key}: ${docNo}`);
          }
        } catch (e) {
          console.warn("Failed to generate DocNo, using timestamp fallback", e);
          docNo = `REQ-${Date.now()}`;
        }
      }

      // Insert Items with the generated DocNo
      for (const item of groupItems) {
        try {
          let {
            Division, Status, Requester, Fac, SPEC, QTY, CASE,
            PartNo, ItemNo, Process, MCType, Req_QTY, Remark,
            ON_HAND, DueDate, PathDwg, PathLayout, PhoneNo,
            MCNo, MCNo_ // Frontend might send MCNo_
          } = item;

          const finalMCNo = MCNo || MCNo_; // Handle both keys

          // Auto-fetch ItemNo
          if (!ItemNo && SPEC) {
            const itemResult = await pool.request()
              .input("SPEC", sql.NVarChar, SPEC)
              .query(`SELECT TOP 1 ItemNo FROM tb_IssueCuttingTool_Request_Document WHERE SPEC = @SPEC`);
            if (itemResult.recordset.length > 0) ItemNo = itemResult.recordset[0].ItemNo;
          }

          await pool.request()
            .input("DocNo", sql.NVarChar, docNo) // Use generated DocNo
            .input("Division", sql.NVarChar, Division)
            .input("Requester", sql.NVarChar, Requester)
            .input("PartNo", sql.NVarChar, PartNo)
            .input("ItemNo", sql.NVarChar, ItemNo)
            .input("SPEC", sql.NVarChar, SPEC)
            .input("Process", sql.NVarChar, Process)
            .input("MCType", sql.NVarChar, MCType)
            .input("MCNo", sql.NVarChar, finalMCNo) // Add MCNo input
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
                (DocNo, Division, Requester, PartNo, ItemNo, SPEC, Process, MCType, MCNo, Fac, PathDwg, ON_HAND, Req_QTY, QTY, DueDate, [CASE], Status, PathLayout, Remark, PhoneNo)
                VALUES 
                (@DocNo,@Division, @Requester, @PartNo, @ItemNo, @SPEC, @Process, @MCType, @MCNo, @Fac, @PathDwg, @ON_HAND, @Req_QTY, @QTY, @DueDate, @CASE, @Status, @PathLayout, @Remark, @PhoneNo);
            `);

          successCount++;
        } catch (err) {
          console.error("Error inserting item:", item, err);
          failCount++;
        }
      }
    }

    res.status(201).json({
      message: 'Bulk insert completed',
      successCount,
      failCount
    });

  } catch (error) {
    console.error('Error in Add_New_Request_Bulk:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
