const { poolPromise } = require("../config/database");
const Type = require("mssql").TYPES;
const sql = require("mssql");


exports.Detail_Purchase = async (req, res) => {
  console.log('data:',req.body)
  try {
    const pool = await poolPromise;
    const result = await pool
    .request()
    .query("SELECT * FROM [dbo].[View_CuttingTool_RequestList] WHERE Status IN ('Waiting','In Progress') ");

    res.json(result.recordset);
  } 
  catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
 
};

exports.Update_Status_Purchase = async (req, res) => {
  console.log(req.body); // ตรวจสอบค่าที่ส่งมา { ID_Request: , Status:  }

  try {
    const { ID_Request, Status } = req.body; //  ดึงค่าออกมา

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("ID_Request", ID_Request)
      .input("Status", Status)
      .query(`
        UPDATE [dbo].[View_CuttingTool_RequestList]
        SET Status = @Status
        WHERE ID_Request = @ID_Request
      `);

    res.json({ success: true, message: "Updated successfully" });
  } catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};



//ล่าสุด// const { poolPromise } = require("../config/database");
// const Type = require("mssql").TYPES;
// const sql = require("mssql");


// exports.Detail_Purchase = async (req, res) => {
//   console.log('data:',req.body)
//   try {
//     const pool = await poolPromise;
//     const result = await pool
//     .request()
//     .query("SELECT * FROM [dbo].[View_CuttingTool_RequestList] WHERE Status IN ('Waiting','In Progress') ");

//     res.json(result.recordset);
//   } 
//   catch (error) {
//     console.error("Error executing query:", error.stack);
//     res.status(500).json({ error: "Internal Server Error", details: error.message });
//   }
 
// };

// exports.Update_Status_Purchase = async (req, res) => {
//   console.log(req.body); 
//  // ตรวจสอบค่าที่ส่งมา { ID_Request: , Status:  }

//   try {
//     const { ID_Request, Status, QTY, Remark} = req.body; //  ดึงค่าออกมา

//     const pool = await poolPromise;
//     const result = await pool
//      .request()
//   .input("ID_Request", sql.Int, ID_Request)
//   .input("Status", sql.NVarChar, Status)
//   .input("QTY", sql.Int, QTY)
//   .input("Remark", sql.NVarChar, Remark)
//   .query(`
//         UPDATE [dbo].[View_CuttingTool_RequestList]
//         SET Status = @Status,
//             QTY = @QTY,
//             Remark = @Remark
//         WHERE ID_Request = @ID_Request
//       `);

//     res.json({ success: true, message: "Updated successfully" });
//   } catch (error) {
//     console.error("Error executing query:", error.stack);
//     res.status(500).json({ error: "Internal Server Error", details: error.message });
//   }
// };
