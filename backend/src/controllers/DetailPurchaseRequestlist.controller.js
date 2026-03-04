const { poolPromise } = require("../config/database");
const sql = require("mssql");
const nodemailer = require('nodemailer');
const { emitNotification } = require("./Notification.controller");

const frontendLink = process.env.FRONTEND_URL

/**
 * API: ดึงข้อมูลรายการเบิกเครื่องมือตัด (Cutting Tool)
 * หน้าที่: ดึงรายการสั่งซื้อ Cutting Tool ที่พนักงานเบิกค้างอยู่ (Waiting) มาแสดงให้ PH ดู
 */
exports.Detail_Purchase = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT T1.*, T2.MCT_MachineTypeCode
      FROM [db_Tooling].[viewer].[View_IssueCuttingTool_Request_Document] T1
      LEFT JOIN [db_SmartCuttingTool_PMA].[viewer].[tb_MachineType] T2 
      ON T1.MCType = T2.MCT_MachineTypeName COLLATE Thai_CI_AS 
      WHERE (T1.Status IN ('Waiting','In Progress', 'Complete', 'CompletetoExcel')) 
        AND T1.DateTime_Record >= DATEADD(day, -90, GETDATE())
      ORDER BY T1.DateTime_Record ASC
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

/**
 * API: ดึงข้อมูลรายการเบิกเครื่องมือติดตั้ง (Setup Tool)
 * หน้าที่: ดึงรายการสั่งซื้อ Setup Tool ที่ค้างอยู่ (Waiting) เพื่อแยกเป็นอีกตารางหนึ่งให้ PH ทำงาน
 */
exports.Detail_Purchase_Setup = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT *
      FROM [db_Tooling].[viewer].[View_IssueSetupTool_Request_Document]
      WHERE Status IN ('Waiting','In Progress', 'Complete', 'CompletetoExcel') 
        AND DateTime_Record >= DATEADD(day, -90, GETDATE())
      AND ([CASE] IS NULL OR [CASE] != 'SET')
      ORDER BY DateTime_Record ASC
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

/**
 * API: ดึงข้อมูลรายการ Case Setup 
 * หน้าที่: ดึงรายการขอ Case Setup ที่ค้างอยู่ มาแสดงโดยเรียงตามวันที่ที่ต้องใช้ของ (DueDate) เพื่อให้รู้ว่างานไหนรีบ
 */
exports.Detail_CaseSetup = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT *
      FROM [db_Tooling].[viewer].[View_CaseSetup_Request]
      WHERE Status IN ('Waiting','In Progress', 'Complete', 'CompletetoExcel')
        AND DateTime_Record >= DATEADD(day, -90, GETDATE())
      ORDER BY DueDate ASC
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

/**
 * API: ค้นหารายการเครื่องมือทั้งหมดในคลัง (Item Master)
 * หน้าที่: เอาไว้ใช้ในระบบค้นหา (Search) คลังสินค้าบนหน้าเว็บแบบพิมพ์แล้วแสดงรายชื่อเครื่องมือที่ตรงกันขึ้นมาให้ User เลือก
 */
const getItemsQuery = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM [db_Tooling].[viewer].[View_tb_Master_Purchase_SUM_ALL]");
    res.json(result.recordset);
  } catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

exports.Get_ItemNo = getItemsQuery;
exports.get_ItemNo = getItemsQuery;

/**
 * (ยังใช้ไม่ได้) สำหรับส่งอีเมลแจ้งเตือน
 * หน้าที่: ฟังก์ชันนี้จะคอยส่งอีเมล์ไปบอกคนเบิกหรือแผนก Production ว่า "รายการรอเบิกนี้เตรียมของเสร็จแล้วนะ"
 */
const sendCompletionEmail = async (pool, idList, finalTableType, isPublicId) => {
  try {
    const targetTable = finalTableType === 'Setup'
      ? 'dbo.tb_IssueSetupTool_Request_Document'
      : 'dbo.tb_IssueCuttingTool_Request_Document';

    let idColumn = isPublicId ? 'Public_Id' : (finalTableType === 'Setup' ? 'ID_RequestSetupTool' : 'ID_Request');

    const rq = pool.request();
    let whereClause = "";

    if (isPublicId) {
      const placeholders = idList.map((_, i) => `@id${i}`).join(", ");
      idList.forEach((id, i) => rq.input(`id${i}`, sql.NVarChar, id));
      whereClause = `${idColumn} IN (${placeholders})`;
    } else {
      const numericIds = idList.map(Number);
      const placeholders = numericIds.map((_, i) => `@id${i}`).join(", ");
      numericIds.forEach((id, i) => rq.input(`id${i}`, sql.Int, id));
      whereClause = `${idColumn} IN (${placeholders})`;
    }

    const rows = await rq.query(`
      SELECT Division, PartNo, ItemNo, SPEC, [CASE], MCType, MCNo, Fac, QTY, DueDate, Requester, Remark
      FROM ${targetTable}
      WHERE ${whereClause};
    `);

    if (!rows.recordset.length) return;

    const emailRes = await pool.request().query(
      `SELECT Email FROM tb_CuttingTool_Employee WHERE Role IN ('production','admin')`
    );
    const emailList = emailRes.recordset.map(r => r.Email).filter(Boolean);

    if (!emailList.length) {
      console.warn("Email not sent. No recipients found.");
      return;
    }

    const fmtDate = d => (d ? new Date(d).toLocaleDateString() : "-");
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
        <td>${fmtDate(it.DueDate)}</td>
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

    await transporter.sendMail({
      from: `"Indirect expense" <${process.env.EMAIL_USER || 'testsystem1508@gmail.com'}>`,
      to: emailList,
      subject: `รายการเสร็จสิ้น (${finalTableType}) ${rows.recordset.length} รายการ`,
      html: `
        <h1 style="color:black;">✅ Message Notification!! Item has been successfully delivered.</h1>
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
        <h3>Come in and check 👉 <a href="${frontendLink}/login">Indirect expense</a></h3>
      `
    });
    console.log(`[${finalTableType}] Email sent successfully.`);
  } catch (emailErr) {
    console.error(`[${finalTableType}] Error sending email:`, emailErr);
  }
};

/**
 * API: เปลี่ยนสถานะรายการขอเบิก
 * หน้าที่: ทำงานเวลากดปุ่มเปลี่ยนสถานะตามตาราง เช่น เปลี่ยนจาก "Waiting" ไปเป็น "Complete" 
 * รองรับการเปลี่ยนทีละหลายๆ แถวพร้อมกันได้เลย
 */
exports.Update_Status_Purchase = async (req, res) => {
  try {
    const { ID_Request, Status, TableType } = req.body || {};

    let idList = Array.isArray(ID_Request) ? ID_Request : (ID_Request !== undefined ? [ID_Request] : []);

    if (!idList.length) return res.status(400).json({ success: false, message: "No valid ID_Request" });
    if (!Status) return res.status(400).json({ success: false, message: "Status is required" });

    const pool = await poolPromise;
    const usesPublicId = typeof idList[0] === 'string';

    const performUpdate = async (type, ids) => {
      const targetTable = type === 'Setup' ? 'dbo.tb_IssueSetupTool_Request_Document' : 'dbo.tb_IssueCuttingTool_Request_Document';
      const isPublicId = typeof ids[0] === 'string';
      const idColumn = isPublicId ? 'Public_Id' : (type === 'Setup' ? 'ID_RequestSetupTool' : 'ID_Request');

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

    if (usesPublicId) {
      const cuttingIds = idList.filter(id => id.startsWith('C'));
      const setupIds = idList.filter(id => id.startsWith('S'));

      if (cuttingIds.length) {
        const rows = await performUpdate('Cutting', cuttingIds);
        if (rows > 0 && Status === "Complete") await sendCompletionEmail(pool, cuttingIds, 'Cutting', true);
        rowsUpdated += rows;
        if (rows > 0) finalTableType = 'Cutting';
      }
      if (setupIds.length) {
        const rows = await performUpdate('Setup', setupIds);
        if (rows > 0 && Status === "Complete") await sendCompletionEmail(pool, setupIds, 'Setup', true);
        rowsUpdated += rows;
        if (rows > 0) finalTableType = 'Setup';
      }
    } else {
      if (['Cutting', 'Setup'].includes(TableType)) {
        rowsUpdated = await performUpdate(TableType, idList);
        if (rowsUpdated > 0 && Status === "Complete") await sendCompletionEmail(pool, idList, TableType, false);
      } else {
        const cutRows = await performUpdate('Cutting', idList);
        if (cutRows > 0) {
          finalTableType = 'Cutting';
          rowsUpdated += cutRows;
          if (Status === "Complete") await sendCompletionEmail(pool, idList, 'Cutting', false);
        } else {
          const setupRows = await performUpdate('Setup', idList);
          if (setupRows > 0) {
            finalTableType = 'Setup';
            rowsUpdated += setupRows;
            if (Status === "Complete") await sendCompletionEmail(pool, idList, 'Setup', false);
          }
        }
      }
    }

    return res.json({ success: true, message: `Updated ${rowsUpdated} item(s) in ${finalTableType || 'unknown'} table` });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Update failed", error: err.message });
  }
};

/**
 * API: แก้ไขรายละเอียดตัวหนังสือในตาราง
 * หน้าที่: ทำงานเมื่อ PH พิมพ์ช่องว่างๆ ในตารางเพื่อแก้ไขรายละเอียด เช่น เปลี่ยนจำนวน (QTY), ใส่คอมเมนต์ (Remark), ล็อต แล้วตารางจะเซฟลงฐานข้อมูล
 */
exports.Update_Request = async (req, res) => {
  try {
    const {
      ID_Request, DocNo, Status, Requester, Fac, CASE, PartNo, ItemNo, Process, MCType,
      Req_QTY, Remark, ON_HAND, DueDate, PathDwg, PathLayout, QTY, PhoneNo, MatLot,
      MR_No, MFGOrderNo, ItemName, SPEC, TableType
    } = req.body;

    const pool = await poolPromise;

    const executeUpdate = async (type, idValue, isPublic = false) => {
      const isCutting = type === 'Cutting';
      const targetTable = isCutting ? '[dbo].[tb_IssueCuttingTool_Request_Document]' : '[dbo].[tb_IssueSetupTool_Request_Document]';
      const idCol = isPublic ? "Public_Id" : (isCutting ? "ID_Request" : "ID_RequestSetupTool");

      const rq = pool.request()
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
        .input("MatLot", sql.NVarChar, MatLot)
        .input("MR_No", sql.NVarChar, MR_No)
        .input("MFGOrderNo", sql.NVarChar, MFGOrderNo)
        .input("ItemName", sql.NVarChar, (ItemName || '').substring(0, 255) || null)
        .input("MCNo", sql.NVarChar, req.body.MCNo || req.body.MCQTY);

      if (isCutting) {
        rq.input("PathDwg", sql.NVarChar, PathDwg);
        rq.input("PathLayout", sql.NVarChar, PathLayout);
      }

      return await rq.query(`
          UPDATE ${targetTable}
          SET DocNo = @DocNo,
              Requester = @Requester,
              PartNo = @PartNo,
              ItemNo = @ItemNo,
              SPEC = @SPEC,
              Process = @Process,
              MCType = @MCType,
              Fac = @Fac,
              ${isCutting ? 'PathDwg = @PathDwg, PathLayout = @PathLayout,' : ''}
              ON_HAND = @ON_HAND,
              Req_QTY = @Req_QTY,
              QTY = @QTY,
              DueDate = @DueDate,
              [CASE] = @CASE,
              Status = @Status,
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

    let result;
    const isPublic = typeof ID_Request === 'string';

    if (isPublic) {
      const type = ID_Request.startsWith('C') ? 'Cutting' : (ID_Request.startsWith('S') ? 'Setup' : null);
      if (!type) return res.status(400).json({ success: false, message: "Invalid Public ID format" });
      result = await executeUpdate(type, ID_Request, true);
    } else {
      if (['Cutting', 'Setup'].includes(TableType)) {
        result = await executeUpdate(TableType, ID_Request, false);
      } else {
        result = await executeUpdate('Cutting', ID_Request, false);
        if (!result || result.rowsAffected[0] === 0) {
          result = await executeUpdate('Setup', ID_Request, false);
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

/**
 * API: สร้างรายการขอเบิกใหม่
 * หน้าที่: รับข้อมูลการขอเบิกจากฟอร์มหน้าเว็บ เพื่อนำมาสร้างออเดอร์ ช่วยสร้าง MFGOrderNo และ Document อัตโนมัติด้วย
 */
exports.Add_New_Request = async (req, res) => {
  try {
    let {
      DocNo, Division, Status, Requester, Fac, SPEC, QTY, CASE, PartNo, ItemNo, Process, MCType,
      Req_QTY, Remark, ON_HAND, DueDate, PathDwg, PathLayout, PhoneNo, ItemName
    } = req.body;

    if (!ItemNo && !SPEC) return res.status(400).json({ message: "ItemNo or SPEC must be specified." });

    const pool = await poolPromise;

    if (!ItemNo) {
      const itemResult = await pool.request()
        .input("SPEC", sql.NVarChar, SPEC)
        .query(`SELECT TOP 1 ItemNo FROM tb_IssueCuttingTool_Request_Document WHERE SPEC = @SPEC`);

      if (itemResult.recordset.length === 0) return res.status(400).json({ message: "ItemNo not found in database." });
      ItemNo = itemResult.recordset[0].ItemNo;
    }

    let GeneratedMFGOrderNo = '';
    try {
      let machineCode = '';
      if (['PMC', '71DZ', 'GM', '7122'].includes(Division)) {
        const machineResult = await pool.request()
          .input("MCType", sql.NVarChar, MCType)
          .query(`SELECT TOP 1 MC_Code FROM [db_Cost_Data_Centralized].[master].[tb_Master_Machine_Group] WHERE MC_Group = @MCType`);
        machineCode = machineResult.recordset[0]?.MC_Code || '';
      }

      const partNoPrefix = (PartNo || '').substring(0, 6);
      if (['PMC', '71DZ'].includes(Division)) {
        GeneratedMFGOrderNo = `M${partNoPrefix}${machineCode}`;
      } else if (['GM', '7122'].includes(Division)) {
        GeneratedMFGOrderNo = `P${partNoPrefix}${machineCode}`;
      } else {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        GeneratedMFGOrderNo = `${CASE}${Process}F${Fac}${dateStr}`;
      }
    } catch (err) {
      console.error('Error generating MFGOrderNo:', err);
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      GeneratedMFGOrderNo = `${CASE}${Process}F${Fac}${dateStr}`;
    }

    const MR_No = new Date().toISOString().slice(2, 10).replace(/-/g, '');

    const result = await pool.request()
      .input("DocNo", sql.NVarChar, DocNo)
      .input("MFGOrderNo", sql.NVarChar, GeneratedMFGOrderNo)
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
        INSERT INTO [dbo].[tb_IssueCuttingTool_Request_Document]
          (DocNo, Division, Requester, PartNo, ItemNo, SPEC, Process, MCType, Fac, PathDwg, ON_HAND, Req_QTY, QTY, DueDate, [CASE], Status, PathLayout, Remark, PhoneNo, MFGOrderNo, MR_No, ItemName)
        OUTPUT INSERTED.ID_Request
        VALUES
          (@DocNo, @Division, @Requester, @PartNo, @ItemNo, @SPEC, @Process, @MCType, @Fac, @PathDwg, @ON_HAND, @Req_QTY, @QTY, @DueDate, @CASE, @Status, @PathLayout, @Remark, @PhoneNo, @MFGOrderNo, @MR_No, @ItemName);
      `);

    const ID_Request = result.recordset[0]?.ID_Request || null;
    if (!ID_Request) return res.status(500).json({ message: "Unable to create a new ID" });

    res.status(201).json({ message: 'Successfully added information', ID_Request });

  } catch (error) {
    console.error('Error in Add_New_Request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * API: ลบรายการขอเบิกเครื่องมือ
 * หน้าที่: เอาไว้ลบรายการที่พนักงานคีย์ผิดทิ้งออกจากระบบ (ปัจจุบันรองรับแค่ลบเครื่องมือตัด)
 */
exports.DeleteItem = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('ID', sql.Int, id)
      .query('DELETE FROM [dbo].[tb_IssueCuttingTool_Request_Document] WHERE ID_Request = @ID');

    res.status(200).json({ message: 'Successfully deleted' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ message: 'Failed to delete', error: error.message });
  }
};

/**
 * API: สร้างรายการขอเบิกใหม่พร้อมกันเยอะๆ (Add ลงตะกร้าแล้วกดรวดเดียว)
 * หน้าที่: เอาไว้รับตะกร้าที่คนเบิกกดเลือกเครื่องมือหลายๆ ชิ้นมารวดเดียว เพื่อเซฟลงฐานข้อมูลพร้อมกัน ทำให้เซฟได้สะดวกรวดเร็วกว่าคลิกทีละอัน
 */
exports.Add_New_Request_Bulk = async (req, res) => {
  try {
    const items = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Invalid input: Expected an array of request items." });
    }

    const pool = await poolPromise;
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

    // --- Send Notification ---
    try {
      if (totalInserted > 0 && items.length > 0) {
        const firstItem = items[0];
        // req.user.Name might not be available, fallback to Requester ID
        const userName = (req.user && req.user.Name) ? req.user.Name : (firstItem.Requester || 'System');
        const countStr = String(totalInserted);

        await emitNotification(req, pool, {
          eventType: 'REQUEST_SENT',
          subject: `🔴 [Action Required] New Tooling Request: ${countStr} items`,
          messageEN: `A new tooling request has been submitted by ${userName} (Production). Total items: ${countStr}. Please review and proceed with the confirmation.`,
          messageTH: `มีคำขอเบิก Tooling ใหม่ส่งมาจาก ${userName} (แผนก Production) จำนวน ${countStr} รายการ รบกวนตรวจสอบและดำเนินการยืนยันคำขอ`,
          docNo: firstItem.PartNo || firstItem.Division || '-', // Fallback since DocNo is generated in SP
          actionBy: userName,
          targetRoles: 'purchase,ph',
          ctaRoute: '/purchase/request-list',
          division: firstItem.Division,
          detailsJson: {
            type: 'new_request',
            items: items.map(ji => ({
              PartNo: ji.PartNo,
              ItemNo: ji.ItemNo,
              ItemName: ji.ItemName,
              Spec: ji.SPEC,
              Process: ji.Process,
              MC: ji.MCType,
              QTY: ji.QTY,
              Division: ji.Division,
              Facility: ji.Fac ? `F.${ji.Fac}` : ''
            }))
          }
        });
      }
    } catch (notifErr) {
      console.error('[Notification] Error in Add_New_Request_Bulk:', notifErr);
    }

  } catch (error) {
    console.error('Error in Add_New_Request_Bulk:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
