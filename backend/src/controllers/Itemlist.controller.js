const { poolPromise } = require("../config/database");
const Type = require("mssql").TYPES;

//เรียกdivisionจากSQL 
exports.Get_Division = async (req, res) => {
  console.log(req.body)
  try {
    const pool = await poolPromise;
    const result = await pool
    .request()
    .query("EXEC [dbo].[stored_IssueCuttingTool_ToolDataset]");

    res.json(result.recordset);
  } 
  catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

// ดึงข้อมูล PartNo กรองจาก Division
exports.Get_PartNo = async (req, res) => {
  console.log(req);
  try {
    const { Division }= req.body;
    console.log( Division );

    if (!Division) {
      return res.status(400).json({ error: "Missing PartNo parameter" });
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("Division", req.body.Division)
      .query("EXEC [dbo].[stored_IssueCuttingTool_ToolDataset] @Division");

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Spec not found for this PartNo" });
    } else {
      res.json(result.recordset);
    }    
  } catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};
// ดึง Spec ตาม PartNo,Division
exports.Get_SPEC = async (req, res) => {
  console.log(req);
  try {
    const { Division, PartNo }= req.body;
    console.log( Division, PartNo );

    if ( !Division || !PartNo ) {
      return res.status(400).json({ error: "Missing PartNo parameter" });
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("Division", req.body.Division)
      .input("PartNo", req.body.PartNo)
      .query("EXEC [dbo].[stored_IssueCuttingTool_ToolDataset] @Division, @PartNo");

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Spec not found for this PartNo" });
    } else {
      res.json(result.recordset);
    }    
  } catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};
// ดึวข้อมูลprocess จาก division partno spec
exports.Get_Process = async (req, res) => {
  console.log(req.body);
  try {
    const { Division, PartNo, Spec }= req.body;
    console.log( Division, PartNo, Spec);

    if (!PartNo || !Spec) {
      return res.status(400).json({ error: "Missing PartNo parameter" });
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("Division", req.body.Division)
      .input("PartNo", req.body.PartNo)
      .input("Spec", req.body.Spec)
      .query("EXEC [dbo].[stored_IssueCuttingTool_ToolDataset] @Division, @PartNo, @Spec");

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Spec not found for this PartNo" });
    } else {
      res.json(result.recordset);
    }    
  } catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

//Get MC by PartNo, SPEC and Process
  exports.Get_MC = async (req, res) => {
  console.log(req.body);
  try {
    const { Division, PartNo, Spec, Process}= req.body;
    console.log( Division, PartNo, Spec, Process);

    if ( !Division || !PartNo || !Spec || !Process) {
      return res.status(400).json({ error: "Missing PartNo parameter" });
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("Division", req.body.Division)
      .input("PartNo", req.body.PartNo)
      .input("Spec", req.body.Spec)
      .input("PROCESS", req.body.Process)
      .query("EXEC [dbo].[stored_IssueCuttingTool_ToolDataset] @Division, @PartNo, @Spec, @PROCESS");

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Spec not found for this PartNo" });
    } else {
      res.json(result.recordset);
    }    
  } catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }  

};
// ดึงItemno จาก division partno process mc
exports.Post_ITEMNO = async (req, res) => {
  console.log(req.body);
  try {
    const { Division, PartNo, Process, MC }= req.body;
    console.log( Division,PartNo, Process, MC );

    if (!Division || !PartNo  || !Process || !MC ) {
      return res.status(400).json({ error: "Missing PartNo parameter" });
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("Division", req.body.Division)
      .input("PartNo", req.body.PartNo)
      .input("Spec", req.body.Spec)
      .input("PROCESS", req.body.Process)
      .input("MC", req.body.MC)
      .query("EXEC [dbo].[stored_IssueCuttingTool_ToolDataset_QTY]  @Division,@PartNo, @Spec, @PROCESS, @MC ");

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Spec not found for this PartNo" });
    } else {
      res.json(result.recordset);
    }    
  } catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

// ตัวอย่างข้อมูลที่ใช้ในการดึง แบบget
// exports.Get_PartNo = async (req, res) => {
//   try {
//     const pool = await poolPromise;
//     const result = await pool
//     .request()
//     .query("EXEC [dbo].[stored_IssueCuttingTool_ToolsDataset]");

//     res.json(result.recordset);
//   } 
//   catch (error) {
//     console.error("Error executing query:", error.stack);
//     res.status(500).json({ error: "Internal Server Error", details: error.message });
//   }
// };

// ดึงข้อมูลแบบ รับข้อมูลลงมาด้วย
// exports.Get_PartNo = async (req, res) => {
//   console.log(req);
//   try {
//     const { Division }= req.body;
//     console.log( Division );

//     if (!Division) {
//       return res.status(400).json({ error: "Missing PartNo parameter" });
//     }

//     const pool = await poolPromise;
//     const result = await pool
//       .request()
//       .input("Division", req.body.Division)
//       .query("EXEC [dbo].[stored_IssueCuttingTool_ToolsDataset] @Division");

//     if (result.recordset.length === 0) {
//       return res.status(404).json({ message: "Spec not found for this PartNo" });
//     } else {
//       res.json(result.recordset);
//     }    
//   } catch (error) {
//     console.error("Error executing query:", error.stack);
//     res.status(500).json({ error: "Internal Server Error", details: error.message });
//   }
// };

// exports.Post_ITEMNO = async (req, res) => {
//   console.log(req.body);
//   try {
//     const { PartNo, Spec, Process, MC } = req.body;
//     console.log(PartNo, Spec, Process, MC); // ดึงข้อมูลจาก body

//     if (!PartNo || !Spec || !Process || !MC) {
//       return res.status(400).json({ error: "Missing PartNo parameter" });
//     }
//     const pool = await poolPromise; // รอการเชื่อมต่อกับฐานข้อมูล
//     const result = await pool
//       .request()
//       .input("PartNo", req.body.PartNo) // เพิ่มพารามิเตอร์ OPIST_PartNo
//       .input("Spec", req.body.Spec)
//       .input("Process", req.body.Process) // เพิ่มพารามิเตอร์ OPIST_Process
//       .input("MC", req.body.MC) // เพิ่มพารามิเตอร์ OPIST_MC
//       .query(
//         "EXEC [dbo].[stored_IssueCuttingTool_ToolsDataset] @PartNo, @Spec, @PROCESS, @MC" // เรียกใช้ stored procedure
//       );

//     // ตรวจสอบผลลัพธ์
//     if (result.recordset.length === 0) {
//       res.status(404).json({ error: "Part Number not found" }); // ถ้าไม่มีข้อมูล ส่งสถานะ 404
//     } else {
//       res.json(result.recordsets); // ส่งผลลัพธ์กลับไปยังผู้เรียก
//     }
//   } catch (error) {
//     // console.error("Error executing query:", error.stack); // แสดงข้อผิดพลาด
//     res.status(500).json({ error: " Server Error", details: error.message }); // ส่งสถานะ 500 พร้อมข้อความข้อผิดพลาด
//   }
// };
