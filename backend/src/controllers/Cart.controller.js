const { poolPromise } = require("../config/database");
const sql = require('mssql');


//  เพิ่มรายการลงฐานข้อมูล
exports.AddCartItems = async (req, res) => {
  try {
    const items = req.body;
    const pool = await poolPromise;

    for (const item of items) {
     console.log("กำลังบันทึก ItemNo:", item.ItemNo);
     await pool.request()
        .input('Division', sql.VarChar, item.Division)
        .input('Requester',sql.NVarChar(50),item.Employee_Name)
        .input('Fac', sql.VarChar, item.Factory)
        .input('PartNo', sql.VarChar, item.PartNo)
        .input('Process', sql.VarChar, item.Process)
        .input('CASE', sql.VarChar, item.Case_) 
        .input('MCType', sql.VarChar, item.MC)
        .input('ItemNo', sql.VarChar, item.ItemNo)
        .input('SPEC', sql.VarChar, item.SPEC)
        .input('Fresh_QTY', sql.Int, item.FreshQty)
        .input('Reuse_QTY', sql.Int, item.ReuseQty)
        .input('QTY', sql.Int, item.QTY)
        .input('MCQTY', sql.Int, item.MCQTY_)
        .input('Due_Date', sql.Date, item.DueDate_)
        .input('PathDwg',sql.NVarChar,item.PathDwg_)
        .query(`
            INSERT INTO tb_IssueCuttingTool_SendToCart (
            Division, Requester, Fac, PartNo, Process, [CASE],
            MCType, ItemNo, SPEC, Fresh_QTY, Reuse_QTY, QTY, MCQTY, Due_Date, PathDwg
            )
            VALUES (
            @Division, @Requester, @Fac, @PartNo, @Process, @CASE,
            @MCType,@ItemNo, @SPEC, @Fresh_QTY, @Reuse_QTY, @QTY, @MCQTY, @Due_Date, @PathDwg
            )
        `);
    }

    res.status(200).json({ message: ' บันทึกรายการตะกร้าสำเร็จ' });
  } catch (error) {
    console.error(' Error AddCartItems:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message });
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
    res.status(500).json({ error: 'ไม่สามารถโหลดรายการตะกร้าได้' });
  }
};

// ลบรายการตาม id หรือรหัสเฉพาะ
exports.DeleteItem = async (req, res) => {
  try {
    const ID_Cart = parseInt(req.params.id); // แปลง string → int

    if (isNaN(ID_Cart)) {
      return res.status(400).json({ error: 'ID_Cart ที่ส่งมาไม่ถูกต้อง (ไม่ใช่ตัวเลข)' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('ID_Cart', sql.Int, ID_Cart)
      .query('DELETE FROM tb_IssueCuttingTool_SendToCart WHERE ID_Cart = @ID_Cart');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'ไม่พบรายการที่ต้องการลบ' });
    }

    res.json({ message: 'ลบรายการสำเร็จ' });
  } catch (err) {
    console.error(' Error DeleteItem:', err);
    res.status(500).json({ error: 'ลบไม่สำเร็จ', detail: err.message });
  }
};

//  ลบรายการทั้งหมดในตะกร้า
exports.ClearAllItems = async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request().query('DELETE FROM tb_IssueCuttingTool_SendToCart'); // ลบทั้งหมด
    res.json({ message: ' ล้างตะกร้าทั้งหมดแล้ว' });
  } catch (err) {
    console.error(' Error ClearAllItems:', err);
    res.status(500).json({ error: 'ไม่สามารถล้างตะกร้าได้' });
  }
};

// updateรายการ
// exports.UpdateCartItem = async (req, res) => {
//   try {
//     const item = req.body;
//     const pool = await poolPromise;

//     await pool.request()
//       .input('ID_Cart', sql.Int, item.ID_Cart) // หรือเปลี่ยนเป็น id ที่ใช้
//       .input('QTY', sql.Int, item.QTY)
//       .input('Path',sql.NVarChar,item.Path)
//       .input('Due_Date', sql.Date, item.Due_Date)
//       .query(`
//         UPDATE tb_IssueCuttingTool_SendToCart
//         SET QTY = @QTY,
//             Path = @Path,
//             Due_Date = @Due_Date
//         WHERE ID_Cart = @ID_Cart
//       `);

//     res.status(200).json({ message: 'อัปเดตข้อมูลสำเร็จ' });
//   } catch (error) {
//     console.error(' UpdateCartItem error:', error);
//     res.status(500).json({ error: error.message });
//   }
// };

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

    res.json({ message: 'ลบรายการเฉพาะที่ตรงเงื่อนไขเรียบร้อยแล้ว' });
  } catch (err) {
    console.error('❌ Error DeleteCartItemsByCaseProcessFac:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบข้อมูล' });
  }
};

exports.UpdateMultipleCartItems = async (req, res) => {
  try {
    const items = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'ข้อมูลที่ส่งมาต้องเป็น Array' });
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

    res.status(200).json({ message: 'อัปเดตรายการทั้งหมดสำเร็จ' });
  } catch (error) {
    console.error(' UpdateMultipleCartItems error:', error);
    res.status(500).json({ error: error.message });
  }
};