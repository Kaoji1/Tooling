const { poolPromise } = require("../config/database");
const sql = require('mssql');
const nodemailer = require('nodemailer'); // ใส่บนสุดของไฟล์



// เพิ่มรายการลงฐานข้อมูล
exports.AddCartItems = async (req, res) => {
  try {
    const items = req.body;
    const pool = await poolPromise;

    // บันทึกทุกรายการลง DB
    for (const item of items) {
      await pool.request()
        .input('Division', sql.NVarChar(50), item.Division)
        .input('Employee_ID', sql.NVarChar(50), item.Employee_ID)
        .input('Requester', sql.NVarChar(50), item.Employee_Name)
        .input('Fac', sql.Int, item.Factory)
        .input('PartNo', sql.NVarChar(50), item.PartNo)
        .input('Process', sql.NVarChar(50), item.Process)
        .input('CASE', sql.NVarChar(50), item.Case_)
        .input('MCType', sql.NVarChar(50), item.MC)
        .input('ItemNo', sql.NVarChar(50), item.ItemNo)
        .input('SPEC', sql.NVarChar(50), item.SPEC)
        .input('Fresh_QTY', sql.Int, item.FreshQty)
        .input('Reuse_QTY', sql.Int, item.ReuseQty)
        .input('QTY', sql.Int, item.QTY)
        .input('MCNo', sql.NVarChar(50), item.MCNo_)
        .input('Due_Date', sql.Date, item.DueDate_)
        .input('PathDwg', sql.NVarChar(50), item.PathDwg_)
        .input('ON_HAND', sql.Int, item.ON_HAND)
        .input('PhoneNo', sql.Int, item.PhoneNo)
        .query(`
          INSERT INTO tb_IssueCuttingTool_SendToCart (
            Division, Employee_ID, Requester, Fac, PartNo, Process, [CASE],
            MCType, ItemNo, SPEC, Fresh_QTY, Reuse_QTY, QTY, MCNo, Due_Date, PathDwg, ON_HAND, PhoneNo
          ) VALUES (
            @Division, @Employee_ID, @Requester, @Fac, @PartNo, @Process, @CASE,
            @MCType, @ItemNo, @SPEC, @Fresh_QTY, @Reuse_QTY, @QTY, @MCNo, @Due_Date, @PathDwg, @ON_HAND, @PhoneNo
          )
        `);
    }

    // === เตรียมส่งอีเมลแบบ background ===
    const setItems = items.filter(item => item.Case_?.toUpperCase() === 'SET');
    const burBroItems = items.filter(item => ['BUR', 'BRO'].includes(item.Case_?.toUpperCase()));

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: 'testsystem1508@gmail.com', pass: 'amdo inzi npqq asnd' }
    });

    // --- ฟังก์ชันสร้าง HTML ตาราง ---
    const createTableHTML = (itemArray) => {
      const rows = itemArray.map(i => `
        <tr>
          <td>${i.Division}</td>
          <td>${i.PartNo}</td>
          <td>${i.ItemNo}</td>
          <td>${i.SPEC}</td>
          <td>${i.Case_}</td>
          <td>${i.MC}</td>
          <td>${i.MCNo_}</td>
          <td>${i.Factory}</td>
          <td>${i.QTY}</td>
          <td>${i.DueDate_}</td>
          <td>${i.Employee_Name}</td>
        </tr>`).join('');
      return `
        <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
          <thead style="background-color: #f2f2f2;">
            <tr>
              <th>Division</th>
              <th>Part No</th>
              <th>Item No</th>
              <th>Spec</th>
              <th>Case</th>
              <th>MCType</th>
              <th>MCNo.</th>
              <th>Factory</th>
              <th>QTY</th>
              <th>DueDate</th>
              <th>Requester</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>`;
    };

    // ส่ง SET → production/admin
    if (setItems.length > 0) {
      const emailResultSet = await pool.request()
        .query(`SELECT Email FROM tb_CuttingTool_Employee WHERE Role IN ('production','admin')`);
      const emailListSet = emailResultSet.recordset.map(r => r.Email).filter(e => !!e);

      if (emailListSet.length > 0) {
        transporter.sendMail({
          from: '"Indirect expense" <testsystem1508@gmail.com>',
          to: emailListSet,
          subject: 'New SET items added to cart',
          html: `<h3>📦 New SET items added 📦</h3>${createTableHTML(setItems)}
       <h3>Come in and check 👉 <a href="http://pbgm06:4200/login">Indirect expense</a></h3>`
        }).then(info => console.log('SET email sent:', info.response))
          .catch(err => console.error('SET email error:', err));
      }
    }

    // ส่ง BUR/BRO → engineer
    if (burBroItems.length > 0) {
      const emailResultEng = await pool.request()
        .query(`SELECT Email FROM tb_CuttingTool_Employee WHERE Role = 'engineer'`);
      const emailListEng = emailResultEng.recordset.map(r => r.Email).filter(e => !!e);

      if (emailListEng.length > 0) {
        transporter.sendMail({
          from: '"Indirect expense" <testsystem1508@gmail.com>',
          to: emailListEng,
          subject: 'New BUR/BRO items added to cart',
          html: `<h3>📦 New BUR/BRO items added 📦</h3>${createTableHTML(burBroItems)}
       <h3>Come in and check 👉 <a href="http://pbgm06:4200/login">Indirect expense</a></h3>`
        }).then(info => console.log('BUR/BRO email sent:', info.response))
          .catch(err => console.error('BUR/BRO email error:', err));
      }
    }

    // ตอบ client ทันที
    res.status(200).json({ message: 'Items saved. Emails are sending in background.' });

  } catch (err) {
    console.error('❌ Error AddCartItems:', err);
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

//  ดึงรายการทั้งหมดในตะกร้าจากฐานข้อมูล
exports.GetCartItems = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM tb_IssueCuttingTool_SendToCart'); // ชื่อ table/temp ที่เก็บตะกร้า
    res.json(result.recordset);
  } catch (err) {
    console.error(' Error GetCartItems:', err);
    res.status(500).json({ error: 'Unable to load shopping cart items.' });
  }
};

// ลบรายการตาม id หรือรหัสเฉพาะ
exports.DeleteItem = async (req, res) => {
  try {
    const ID_Cart = parseInt(req.params.id); // แปลง string → int

    if (isNaN(ID_Cart)) {
      return res.status(400).json({ error: 'ID_Cart The submission is incorrect (not a number)' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('ID_Cart', sql.Int, ID_Cart)
      .query('DELETE FROM tb_IssueCuttingTool_SendToCart WHERE ID_Cart = @ID_Cart');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'The item you want to delete was not found.' });
    }

    res.json({ message: 'The item was successfully deleted.' });
  } catch (err) {
    console.error(' Error DeleteItem:', err);
    res.status(500).json({ error: 'Failed to delete', detail: err.message });
  }
};

//  ลบรายการทั้งหมดในตะกร้า
exports.ClearAllItems = async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request().query('DELETE FROM tb_IssueCuttingTool_SendToCart'); // ลบทั้งหมด
    res.json({ message: ' All baskets have been emptied.' });
  } catch (err) {
    console.error(' Error ClearAllItems:', err);
    res.status(500).json({ error: 'Unable to empty basket' });
  }
};

// ลบรายการตามcaseที่กดsendแล้ว
exports.DeleteCartItemsByCaseProcessFac = async (req, res) => {
  try {
    const case_ = decodeURIComponent(req.params.case_);
    const process = decodeURIComponent(req.params.process);
    const factory = decodeURIComponent(req.params.fac);

    const pool = await poolPromise;

    await pool.request()
      .input('Case_', sql.VarChar, case_)
      .input('Process', sql.VarChar, process)
      .input('Fac', sql.VarChar, factory)
      .query(`
        DELETE FROM tb_IssueCuttingTool_SendToCart
        WHERE [CASE] = @Case_ AND [Process] = @Process AND [Fac] = @Fac
      `);

    res.json({ message: 'Delete only items that meet the conditions.' });
  } catch (err) {
    console.error('❌ Error DeleteCartItemsByCaseProcessFac:', err);
    res.status(500).json({ error: 'An error occurred while deleting data.' });
  }
};

exports.UpdateMultipleCartItems = async (req, res) => {
  try {
    const items = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'The information submitted must be Array' });
    }

    const pool = await poolPromise;

    for (const item of items) {
      await pool.request()
        .input('ID_Cart', sql.Int, item.ID_Cart)
        .input('QTY', sql.Int, item.QTY)
        .input('PathDwg', sql.NVarChar, item.PathDwg)
        .input('PathLayout', sql.NVarChar, item.PathLayout)
        .input('Due_Date', sql.Date, item.Due_Date)
        .query(`
          UPDATE tb_IssueCuttingTool_SendToCart
          SET QTY = @QTY,
              PathDwg = @PathDwg,
              PathLayout = @PathLayout,
              Due_Date = @Due_Date
          WHERE ID_Cart = @ID_Cart
        `);
    }

    res.status(200).json({ message: 'All items successfully updated' });
  } catch (error) {
    console.error(' UpdateMultipleCartItems error:', error);
    res.status(500).json({ error: error.message });
  }
};