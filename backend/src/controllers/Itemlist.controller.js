const { connectDb, closeDb, poolPromise } = require("../config/database"); // นำเข้าฟังก์ชันสำหรับเชื่อมต่อกับฐานข้อมูล
var Type = require("mssql").TYPES;// นำเข้า TYPE สำหรับใช้ในการกำหนดชนิดข้อมูล

const Post_PARTNO = async function (req, res) {
  try {
    // console.log("Request Body:", req.body); // แสดงข้อมูลที่ได้รับจาก body

    const pool = await poolPromise; // รอการเชื่อมต่อกับฐานข้อมูล
    // console.log("Database pool created:", pool);

    const result = await pool
      .request() // สร้างคำขอใหม่
      .query("EXEC [trans].[stored_Master_Tooling_Query_A]"); // เรียกใช้ stored procedure

    // console.log("Query Result:", result); // แสดงผลลัพธ์ของคำขอ
    res.json(result.recordset); // ส่งผลลัพธ์กลับไปยังผู้เรียก
  } catch (error) {
    // console.error("Error executing query:", error.stack); // แสดงข้อผิดพลาด
    res.status(500).json({ error: "Internal Server Error", details: error.message }); // ส่งสถานะ 500 พร้อมข้อความข้อผิดพลาด
  }
};



// ฟังก์ชันเพื่อดึงข้อมูลตาม OPIST_PartNo
const Post_PROCESS = async function (req, res) {
  try {
    // console.log("Request Params:", req.body); // แสดงข้อมูลที่ได้รับจาก body

    const { PartNo } = req.body; // ดึงหมายเลขชิ้นส่วนจาก body

    const pool = await poolPromise; // รอการเชื่อมต่อกับฐานข้อมูล
    const result = await pool
      .request()
      .input("PartNo", Type.NVarChar, PartNo) // เพิ่มพารามิเตอร์ OPIST_PartNo
      .query("EXEC [trans].[stored_Master_Tooling_Query_B] @PartNo"); // เรียกใช้ stored procedure

    // ตรวจสอบผลลัพธ์
    if (result.recordset.length === 0) {
      res.status(404).json({ error: "Part Number not found" }); // ถ้าไม่มีข้อมูล ส่งสถานะ 404
    } else {
      res.json(result.recordsets); // ส่งผลลัพธ์กลับไปยังผู้เรียก
      // console.log(result.recordsets); // แสดงผลลัพธ์
    }
  } catch (error) {
    console.error("Error executing query:", error.stack); // แสดงข้อผิดพลาด
    res.status(500).json({ error: " Server Error", details: error.message }); // ส่งสถานะ 500 พร้อมข้อความข้อผิดพลาด
  }
};

// ฟังก์ชันเพื่อดึงข้อมูลตาม OPIST_Process
const Post_MACHINETYPE = async function (req, res) {
  try {
    const { PartNo, Process } = req.body; // ดึงหมายเลขชิ้นส่วนและกระบวนการจาก body

    const pool = await poolPromise; // รอการเชื่อมต่อกับฐานข้อมูล
    const result = await pool
      .request()
      .input("PartNo", Type.NVarChar, PartNo) // เพิ่มพารามิเตอร์ OPIST_PartNo
      .input("Process", Type.NVarChar, Process) // เพิ่มพารามิเตอร์ OPIST_Process
      .query("EXEC [trans].[stored_Master_Tooling_Query_C] @PartNo, @Process"); // เรียกใช้ stored procedure

    // ตรวจสอบผลลัพธ์
    if (result.recordset.length === 0) {
      res.status(404).json({ error: "Part Number not found" }); // ถ้าไม่มีข้อมูล ส่งสถานะ 404
    } else {
      res.json(result.recordsets); // ส่งผลลัพธ์กลับไปยังผู้เรียก
    }
  } catch (error) {
    // console.error("Error executing query:", error.stack); // แสดงข้อผิดพลาด
    res.status(500).json({ error: " Server Error", details: error.message }); // ส่งสถานะ 500 พร้อมข้อความข้อผิดพลาด
  }
};


const Post_item_detail = async function (req, res) {
  try {
    // console.log("Request Params:", req.body); // แสดงข้อมูลที่ได้รับจาก body

    const { PartNo, Process, MC } = req.body; // ดึงข้อมูลจาก body
    const pool = await poolPromise; // รอการเชื่อมต่อกับฐานข้อมูล
    const result = await pool
      .request()
      .input("PartNo", Type.NVarChar, PartNo) // เพิ่มพารามิเตอร์ OPIST_PartNo
      .input("Process", Type.NVarChar,Process) // เพิ่มพารามิเตอร์ OPIST_Process
      .input("MC", Type.NVarChar, MC) // เพิ่มพารามิเตอร์ OPIST_MC
      .query(
        "EXEC [trans].[stored_Master_Tooling_Query_D] @PartNo, @Process, @MC" // เรียกใช้ stored procedure
      );

    // ตรวจสอบผลลัพธ์
    if (result.recordset.length === 0) {
      res.status(404).json({ error: "Part Number not found" }); // ถ้าไม่มีข้อมูล ส่งสถานะ 404
    } else {
      res.json(result.recordsets); // ส่งผลลัพธ์กลับไปยังผู้เรียก
    }
  } catch (error) {
    // console.error("Error executing query:", error.stack); // แสดงข้อผิดพลาด
    res.status(500).json({ error: " Server Error", details: error.message }); // ส่งสถานะ 500 พร้อมข้อความข้อผิดพลาด
  }
};

const Get_master_MCNO = async function (req, res) {
  try {
      console.log("Request Body:", req.body); // แสดงข้อมูลที่ได้รับจาก body

      const pool = await poolPromise; // รอการเชื่อมต่อกับฐานข้อมูล
      // console.log("Database pool created:", pool);

      const result = await pool.request()
          // .input('a', req.body.Line_Machine_Group)
          .input('b', req.body.McNo)
          // สร้างคำขอใหม่
          .query("EXEC [trans].[stored_Master_MCNO] @b", function (err, result) {
              if (err) {
                  console.log(err)
              }
              else {
                  res.json(result.recordset);
                  console.log(result.recordset);
              }
          }) // เรียกใช้ stored procedure

      // console.log("Query Result:", result); // แสดงผลลัพธ์ของคำขอ
      //res.json(result.recordset); // ส่งผลลัพธ์กลับไปยังผู้เรียก
  } catch (error) {
      // console.error("Error executing query:", error.stack); // แสดงข้อผิดพลาด
      res.status(500).json({ error: "Internal Server Error", details: error.message }); // ส่งสถานะ 500 พร้อมข้อความข้อผิดพลาด
  }
};


const Post_request_to_cart = async (req, res) => {
  try {
    const {
      Doc_no,
      Division,
      Factory,
      Date_of_Req,
      Item_no,
      Part_no,
      Revision,
      Process,
      MC_type,
      Spec,
      Usage ,
      MC_no,
      ON_HAND,
      Qty,
      Case_,
      Status,
      Set_by,
      Local,
      phone_number,
      McQty,
      DateSetUp,
      MAIN_LOCATION,
      Deliver_Items,
      Remark,
      MATLOT,
      NAME_NAME
      
    } = req.body; // ดึงข้อมูลจาก body
    const pool = await poolPromise;
    const result = pool.request()
    .input('Doc_no', Type.NVarChar, Doc_no) // เพิ่มพารามิเตอร์ Doc_no
    .input('Division', Type.NVarChar, Division) // เพิ่มพารามิเตอร์ Division
    .input('Factory', Type.Int, Factory) // เพิ่มพารามิเตอร์ Factory
    .input('Date_of_Req', Type.Date, Date_of_Req) // เพิ่มพารามิเตอร์ Date_of_Req
    .input('Item_no', Type.NVarChar, Item_no) // เพิ่มพารามิเตอร์ Item_no
    .input('Part_no', Type.NVarChar, Part_no) // เพิ่มพารามิเตอร์ Part_no
    .input('Revision', Type.NVarChar, Revision) // เพิ่มพารามิเตอร์ Revision
    .input('Process', Type.NVarChar, Process) // เพิ่มพารามิเตอร์ Process
    .input('MC_type', Type.NVarChar, MC_type) // เพิ่มพารามิเตอร์ MC_type
    .input('Spec', Type.NVarChar, Spec) // เพิ่มพารามิเตอร์ Spec
    .input('Usage', Type.Int, Usage) // เพิ่มพารามิเตอร์ Usage
    .input('MC_no', Type.NVarChar, MC_no) // เพิ่มพารามิเตอร์ MC_no
    .input('ON_HAND', Type.Float, ON_HAND )
    .input('Qty', Type.Int, Qty) // เพิ่มพารามิเตอร์ Qty
    .input('Case_', Type.NVarChar, Case_) // เพิ่มพารามิเตอร์ Case_
    .input('Status', Type.NVarChar, Status) // เพิ่มพารามิเตอร์ Status
    .input('Set_by', Type.NVarChar, Set_by) // เพิ่มพารามิเตอร์ Set_by
    .input('Local', Type.Int, Local) // เพิ่มพารามิเตอร์ Local
    .input('phone_number', Type.NVarChar, phone_number)
    .input('McQty', Type.Int, McQty)
    .input('DateSetUp', Type.Date, DateSetUp) // เพิ่มพารามิเตอร์ Date_of_Req MAIN_LOCATION
    .input('MAIN_LOCATION', Type.NVarChar, MAIN_LOCATION)
    .input('Deliver_Items', Type.NVarChar, Deliver_Items)
    .input('Remark', Type.NVarChar, Remark)
    .input('NAME_NAME', Type.NVarChar, NAME_NAME)
    .query(`
      EXEC [master].[stored_tb_Indirect_Expense_Detail_Request_Insert]
      @Emp_Code		
		,@Doc_no		
		,@Division		
		,@Factory
    ,@Date_of_Req		
		,@Item_no		
		,@Part_no			
    ,@Revision
		,@Process		
		,@MC_type		
		,@Spec			
		,@Usage		
		,@MC_no	
    ,@ON_HAND
		,@Qty				
		,@Case_		
    ,@Status
    ,@Set_by
    ,@Local
    ,@phone_number
    ,@McQty
    ,@DateSetUp
    ,@MAIN_LOCATION
    ,@Deliver_Items
    ,@Remark
    ,@MATLOT
    ,@NAME_NAME
`); // เรียกใช้ stored procedure
    res.json(result.recordset);
    console.log(result.recordset);
  } catch (err) {
    console.error('Error inserting rows:', err);
    res.status(500).send('Error inserting rows');
  }
};

const Get_list_table = async function (req, res) {
  try {
    const pool = await poolPromise; // รอการเชื่อมต่อกับฐานข้อมูล
    const result = await pool
      .request() // เริ่มการร้องขอ
      .query("EXEC [master].[stored_tb_Indirect_Expense_Query_list_Table]  "); // เรียกใช้ stored procedure
    if (result.recordset.length === 0) { // ตรวจสอบว่ามีข้อมูลหรือไม่
      res.status(404).send('No rows found'); // ส่งสถานะ 404 หากไม่มีแถว
    } else {
      res.status(200).json(result.recordset); // ส่งข้อมูล response กลับไปยัง Frontend
    }
  } catch (err) {
    console.error('Error selecting rows:', err); // แสดงข้อผิดพลาดใน console
    res.status(500).send('Error selecting rows'); // ส่งสถานะ 500 หากเกิดข้อผิดพลาด
  }
};


module.exports = {
  Post_PARTNO,
  Post_PROCESS,
  Post_MACHINETYPE,
  Post_item_detail,
  Post_request_to_cart,
  Get_list_table,
  Get_master_MCNO
};