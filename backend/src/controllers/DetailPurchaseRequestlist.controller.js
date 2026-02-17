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
      .query(`
        SELECT T1.*, T2.MCT_MachineTypeCode
        FROM [dbo].[View_CuttingTool_RequestList] T1
        LEFT JOIN [db_SmartCuttingTool_PMA].[viewer].[tb_MachineType] T2 
        ON T1.MCType = T2.MCT_MachineTypeName COLLATE Thai_CI_AS 
        WHERE T1.Status IN ('Waiting','In Progress')
        ORDER BY T1.DateTime_Record ASC
      `);

    res.json(result.recordset);
  }
  catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }

};

exports.Detail_Purchase_Setup = async (req, res) => {
  console.log('Fetching Setup Tool Data');
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query(`
        SELECT *
        FROM [db_Tooling].[viewer].[View_SetupTool_RequestList]
        WHERE Status IN ('Waiting','In Progress')
        AND ([CASE] IS NULL OR [CASE] != 'SET')
        ORDER BY DateTime_Record ASC
      `);

    res.json(result.recordset);
  }
  catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

exports.Detail_CaseSetup = async (req, res) => {
  console.log('Fetching Case Setup Data');
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query(`
        SELECT *
        FROM [db_Tooling].[viewer].[View_CaseSetup_Request]
        WHERE Status IN ('Waiting','In Progress')
        ORDER BY DueDate ASC
      `);

    if (result.recordset.length > 0) {
      console.log('Case Setup Columns:', Object.keys(result.recordset[0]));
    }

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
      .query("SELECT * FROM [db_Tooling].[viewer].[View_tb_Master_Purchase_SUM_ALL]");

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
      .query("SELECT * FROM [db_Tooling].[viewer].[View_tb_Master_Purchase_SUM_ALL]");

    res.json(result.recordset);
  }
  catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};


exports.Update_Status_Purchase = async (req, res) => {
  try {
    const { ID_Request, Status, TableType } = req.body || {};

    // Normalize → array
    let idList = [];
    if (Array.isArray(ID_Request)) idList = ID_Request;
    else if (ID_Request !== undefined) idList = [ID_Request];

    if (!idList.length) {
      return res.status(400).json({ success: false, message: "No valid ID_Request" });
    }
    if (!Status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }

    const pool = await poolPromise;

    const performUpdate = async (type, ids) => {
      const targetTable = type === 'Setup'
        ? 'dbo.tb_IssueSetupTool_Request_Document'
        : 'dbo.tb_IssueCuttingTool_Request_Document';

      // Determine if searching by numeric ID or Public_Id
      const isPublicId = typeof ids[0] === 'string';
      const idColumn = isPublicId
        ? 'Public_Id'
        : (type === 'Setup' ? 'ID_RequestSetupTool' : 'ID_Request');

      const rq = pool.request();
      rq.input("Status", sql.NVarChar, Status);

      let whereClause = "";
      if (isPublicId) {
        const placeholders = ids.map((_, i) => `@id${i}`).join(", ");
        ids.forEach((id, i) => rq.input(`id${i}`, sql.NVarChar, id));
        whereClause = `d.${idColumn} IN (${placeholders})`;
      } else {
        const numericIds = ids.map(Number);
        const placeholders = numericIds.map((_, i) => `@id${i}`).join(", ");
        numericIds.forEach((id, i) => rq.input(`id${i}`, sql.Int, id));
        whereClause = `d.${idColumn} IN (${placeholders})`;
      }

      const result = await rq.query(`
        UPDATE d
        SET d.Status = @Status,
            d.DateComplete = CASE WHEN @Status = N'Complete' THEN SYSDATETIME() ELSE d.DateComplete END
        FROM ${targetTable} d
        WHERE ${whereClause};
      `);
      return result.rowsAffected[0];
    };

    let rowsUpdated = 0;
    let finalTableType = TableType;

    // Detect if idList contains Public_Ids
    const usesPublicId = typeof idList[0] === 'string';

    if (usesPublicId) {
      // Split by prefix
      const cuttingIds = idList.filter(id => id.startsWith('C'));
      const setupIds = idList.filter(id => id.startsWith('S'));

      if (cuttingIds.length > 0) {
        rowsUpdated += await performUpdate('Cutting', cuttingIds);
        if (rowsUpdated > 0) finalTableType = 'Cutting';
      }
      if (setupIds.length > 0) {
        const setupRows = await performUpdate('Setup', setupIds);
        rowsUpdated += setupRows;
        if (setupRows > 0) finalTableType = 'Setup';
      }
    } else {
      // Legacy numeric ID logic
      if (TableType === 'Cutting') {
        rowsUpdated = await performUpdate('Cutting', idList);
      } else if (TableType === 'Setup') {
        rowsUpdated = await performUpdate('Setup', idList);
      } else {
        // Fallback: Try Cutting first, then Setup if nothing updated
        console.log("No TableType provided for status update, trying Cutting Tool fallback...");
        rowsUpdated = await performUpdate('Cutting', idList);
        if (rowsUpdated > 0) {
          finalTableType = 'Cutting';
        } else {
          console.log("Not found in Cutting Tool, trying Setup Tool fallback...");
          rowsUpdated = await performUpdate('Setup', idList);
          if (rowsUpdated > 0) finalTableType = 'Setup';
        }
      }
    }

    // ส่งอีเมลถ้า Status = Complete
    if (Status === "Complete" && rowsUpdated > 0) {
      try {
        console.log(`Attempting to send email for ${finalTableType} Tool, IDs:`, idList);

        const targetTable = finalTableType === 'Setup'
          ? 'dbo.tb_IssueSetupTool_Request_Document'
          : 'dbo.tb_IssueCuttingTool_Request_Document';
        const idColumn = finalTableType === 'Setup' ? 'ID_RequestSetupTool' : 'ID_Request';
        const safeIds = idList.join(",");

        const rows = await pool.request().query(`
          SELECT Division, PartNo, ItemNo, SPEC, [CASE], MCType, MCNo, Fac, QTY, DueDate, Requester, Remark
          FROM ${targetTable}
          WHERE ${idColumn} IN (${safeIds});
        `);

        console.log(`Found ${rows.recordset.length} items for email body.`);

        const emailRes = await pool.request().query(
          `SELECT Email FROM tb_CuttingTool_Employee WHERE Role IN ('production','admin')`
        );
        const emailList = emailRes.recordset.map(r => r.Email).filter(Boolean);

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
            subject: `รายการเสร็จสิ้น (${finalTableType}) ${rows.recordset.length} รายการ`,
            html: `
              <h1 style="color:black;">✅ Massage Notification!! Item has been successfully delivered.</h1>
              <p>Type: ${finalTableType} Tooling</p>
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

    return res.json({ success: true, message: `Updated ${rowsUpdated} item(s) in ${finalTableType || 'unknown'} table` });

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
      QTY,
      PhoneNo,
      MatLot,
      MR_No,
      MFGOrderNo,
      ItemName,
      SPEC,
      TableType
    } = req.body;

    const pool = await poolPromise;

    // Helper function for Cutting Tool Update
    const updateCutting = async (idValue, isPublic = false) => {
      const idCol = isPublic ? "Public_Id" : "ID_Request";
      return await pool.request()
        .input("ID_Val", isPublic ? sql.NVarChar : sql.Int, idValue)
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
        .input("MatLot", sql.NVarChar, MatLot)
        .input("MR_No", sql.NVarChar, MR_No)
        .input("MFGOrderNo", sql.NVarChar, MFGOrderNo)
        .input("ItemName", sql.NVarChar, (ItemName || '').substring(0, 255) || null)
        .input("MCNo", sql.NVarChar, req.body.MCNo || req.body.MCQTY)
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
                PhoneNo = @PhoneNo,
                MatLot = @MatLot,
                MR_No = @MR_No,
                MFGOrderNo = @MFGOrderNo,
                ItemName = @ItemName,
                MCNo = @MCNo
            WHERE ${idCol} = @ID_Val
        `);
    };

    // Helper function for Setup Tool Update
    const updateSetup = async (idValue, isPublic = false) => {
      const idCol = isPublic ? "Public_Id" : "ID_RequestSetupTool";
      return await pool.request()
        .input("ID_Val", isPublic ? sql.NVarChar : sql.Int, idValue)
        .input("DocNo", sql.NVarChar, DocNo)
        .input("Requester", sql.NVarChar, Requester)
        .input("PartNo", sql.NVarChar, PartNo)
        .input("ItemNo", sql.NVarChar, ItemNo)
        .input("SPEC", sql.NVarChar, SPEC)
        .input("Process", sql.NVarChar, Process)
        .input("MCType", sql.NVarChar, MCType)
        .input("Fac", sql.Int, Fac)
        .input("ON_HAND", sql.Int, ON_HAND)
        .input("Req_QTY", sql.Int, Req_QTY)
        .input("QTY", sql.Int, QTY)
        .input("DueDate", sql.DateTime, DueDate ? new Date(DueDate) : null)
        .input("CASE", sql.NVarChar, CASE)
        .input("Status", sql.NVarChar, Status)
        .input("Remark", sql.NVarChar, Remark)
        .input("PhoneNo", sql.Int, PhoneNo)
        .input("ItemName", sql.NVarChar, (ItemName || '').substring(0, 255) || null)
        .input("MatLot", sql.NVarChar, MatLot)
        .input("MR_No", sql.NVarChar, MR_No)
        .input("MFGOrderNo", sql.NVarChar, MFGOrderNo)
        .input("MCNo", sql.NVarChar, req.body.MCNo || req.body.MCQTY)
        .query(`
            UPDATE [dbo].[tb_IssueSetupTool_Request_Document]
            SET DocNo = @DocNo,
                Requester = @Requester,
                PartNo = @PartNo,
                ItemNo = @ItemNo,
                SPEC = @SPEC,
                Process = @Process,
                MCType = @MCType,
                Fac = @Fac,
                ON_HAND = @ON_HAND,
                Req_QTY = @Req_QTY,
                QTY = @QTY,
                DueDate = @DueDate,
                [CASE] = @CASE,
                Status = @Status,
                Remark = @Remark,
                PhoneNo = @PhoneNo,
                ItemName = @ItemName,
                MatLot = @MatLot,
                MR_No = @MR_No,
                MFGOrderNo = @MFGOrderNo,
                MCNo = @MCNo
            WHERE ${idCol} = @ID_Val
        `);
    };

    let result;
    const isPublic = typeof ID_Request === 'string';

    if (isPublic) {
      if (ID_Request.startsWith('C')) {
        result = await updateCutting(ID_Request, true);
      } else if (ID_Request.startsWith('S')) {
        result = await updateSetup(ID_Request, true);
      } else {
        return res.status(400).json({ success: false, message: "Invalid Public ID format" });
      }
    } else {
      if (TableType === 'Cutting') {
        result = await updateCutting(ID_Request, false);
      } else if (TableType === 'Setup') {
        result = await updateSetup(ID_Request, false);
      } else {
        // Fallback
        result = await updateCutting(ID_Request, false);
        if (!result || result.rowsAffected[0] === 0) {
          result = await updateSetup(ID_Request, false);
        }
      }
    }

    if (result && result.rowsAffected[0] > 0) {
      res.json({ success: true, message: "Updated successfully" });
    } else {
      res.status(404).json({ success: false, message: "Record not found or no changes" });
    }

  } catch (error) {
    console.error("Update_Request Error:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
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
      PhoneNo,
      ItemName
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

    // Auto-Generate MFGOrderNo
    let GeneratedMFGOrderNo = '';

    try {
      let machineCode = '';
      if (['PMC', '71DZ', 'GM', '7122'].includes(Division)) {
        // Centralized Lookup
        const machineResult = await pool.request()
          .input("MCType", sql.NVarChar, MCType)
          .query(`
              SELECT TOP 1 MC_Code 
              FROM[db_Cost_Data_Centralized].[master].[tb_Master_Machine_Group] 
              WHERE MC_Group = @MCType
          `);
        machineCode = machineResult.recordset[0]?.MC_Code || '';
      }

      if (['PMC', '71DZ'].includes(Division)) {
        const partNoPrefix = (PartNo || '').substring(0, 6);
        GeneratedMFGOrderNo = `M${partNoPrefix}${machineCode}`;

      } else if (['GM', '7122'].includes(Division)) {
        const partNoPrefix = (PartNo || '').substring(0, 6);
        GeneratedMFGOrderNo = `P${partNoPrefix}${machineCode}`;

      } else {
        // Fallback: [Case][Process][Fac][Date:YYYYMMDD]
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        GeneratedMFGOrderNo = `${CASE}${Process}F${Fac}${dateStr}`;
      }
    } catch (err) {
      console.error('Error generating MFGOrderNo:', err);
      // Fallback on error
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      GeneratedMFGOrderNo = `${CASE}${Process}F${Fac}${dateStr}`;
    }

    const MFGOrderNo = GeneratedMFGOrderNo;

    // Generate MR_No (yyMMdd)
    const MR_No = new Date().toISOString().slice(2, 10).replace(/-/g, '');

    const result = await pool.request()

      .input("DocNo", sql.NVarChar, DocNo)
      .input("MFGOrderNo", sql.NVarChar, MFGOrderNo)
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
      .input("MR_No", sql.NVarChar, MR_No)
      .input("ItemName", sql.NVarChar, (ItemName || '').substring(0, 255) || null)
      .query(`
        INSERT INTO[dbo].[tb_IssueCuttingTool_Request_Document]
          (DocNo, Division, Requester, PartNo, ItemNo, SPEC, Process, MCType, Fac, PathDwg, ON_HAND, Req_QTY, QTY, DueDate, [CASE], Status, PathLayout, Remark, PhoneNo, MFGOrderNo, MR_No, ItemName)
        OUTPUT INSERTED.ID_Request
        VALUES
            (@DocNo, @Division, @Requester, @PartNo, @ItemNo, @SPEC, @Process, @MCType, @Fac, @PathDwg, @ON_HAND, @Req_QTY, @QTY, @DueDate, @CASE, @Status, @PathLayout, @Remark, @PhoneNo, @MFGOrderNo, @MR_No, @ItemName);
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
    const items = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Invalid input: Expected an array of request items." });
    }

    const pool = await poolPromise;

    // 🔄 Call Professional Stored Procedure
    // Note: DocNo and MFGOrderNo are now generated inside the Stored Procedure
    const result = await pool.request()
      .input("ItemsJson", sql.NVarChar(sql.MAX), JSON.stringify(items))
      .execute("trans.Stored_Insert_Request_Bulk");

    let totalInserted = result.recordset[0].InsertedCount;
    let totalCaseSetup = result.recordset[0].CaseSetupCount || 0;
    let totalCutting = result.recordset[0].CuttingCount || 0;
    let totalSetup = result.recordset[0].SetupCount || 0;

    res.status(201).json({
      message: 'Bulk insert completed successfully',
      successCount: totalInserted,
      failCount: items.length - totalInserted,
      CaseSetupCount: totalCaseSetup,
      CuttingCount: totalCutting,
      SetupCount: totalSetup
    });

  } catch (error) {
    console.error('Error in Add_New_Request_Bulk:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


