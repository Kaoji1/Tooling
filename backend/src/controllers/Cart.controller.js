const { poolPromise } = require("../config/database");
const sql = require('mssql');


//  เพิ่มรายการลงฐานข้อมูล
exports.AddCartItems = async (req, res) => {
  try {
    const items = req.body;
    const pool = await poolPromise;

    for (const item of items) {
     console.log("กำลังบันทึก ItemNo:", item.ITEM_NO);
     await pool.request()
        .input('Division', sql.VarChar, item.Division)
        .input('Fac', sql.VarChar, item.Factory)
        .input('PartNo', sql.VarChar, item.PartNo)
        .input('Process', sql.VarChar, item.Process)
        .input('CASE', sql.VarChar, item.Case_) 
        .input('MCType', sql.VarChar, item.MC)
        .input('ItemNo', sql.VarChar, item.ITEM_NO)
        .input('SPEC', sql.VarChar, item.SPEC)
        .input('Fresh_QTY', sql.Int, item.FreshQty)
        .input('Reuse_QTY', sql.Int, item.ReuseQty)
        .input('QTY', sql.Int, item.QTY)
        .input('Due_Date', sql.Date, item.DueDate_)
        .query(`
            INSERT INTO tb_IssueCuttingTool_SendToCart (
            Division, Fac, PartNo, Process, [CASE],
            MCType, ItemNo, SPEC, Fresh_QTY, Reuse_QTY, QTY, Due_Date
            )
            VALUES (
            @Division, @Fac, @PartNo, @Process, @CASE,
            @MCType,@ItemNo, @SPEC, @Fresh_QTY, @Reuse_QTY, @QTY, @Due_Date
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
exports.UpdateCartItem = async (req, res) => {
  try {
    const item = req.body;
    const pool = await poolPromise;

    await pool.request()
      .input('ID_Cart', sql.Int, item.ID_Cart) // หรือเปลี่ยนเป็น id ที่คุณใช้
      .input('QTY', sql.Int, item.QTY)
      .input('Due_Date', sql.Date, item.DueDate_)
      .query(`
        UPDATE tb_IssueCuttingTool_SendToCart
        SET QTY = @QTY,
            Due_Date = @Due_Date
        WHERE ID_Cart = @ID_Cart
      `);

    res.status(200).json({ message: 'อัปเดตข้อมูลสำเร็จ' });
  } catch (error) {
    console.error(' UpdateCartItem error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ลบรายการตามcaseที่กดsendแล้ว
exports.DeleteCartItemsByCase = async (req, res) => {
  
  try {
    const rawCase = req.params.case_;
    const case_ = decodeURIComponent(rawCase);
    const pool = await poolPromise;

    await pool.request()
      .input('Case_', sql.VarChar, case_)
      .query('DELETE FROM tb_IssueCuttingTool_SendToCart WHERE [CASE] = @Case_');

    res.json({ message: 'ลบรายการในตะกร้าเรียบร้อยแล้ว' });
  } catch (err) {
    console.error('Error DeleteCartItemsByCase:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบข้อมูล' });
  }
};