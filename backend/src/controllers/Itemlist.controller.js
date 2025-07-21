const { error } = require("console");
const { connectDb, closeDb, poolPromise } = require("../config/database");
var Type = require("mssql").TYPES;

// Get all PartNo
exports.Get_PARTNO = async function (req, res) {
  try {
    const pool = await poolPromise;
    const result = await pool
    .request()
    .query("EXEC [dbo].[stored_Item]")

    res.json(result.recordset);
  }
  catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

// Get SPEC values based on selected PartNo
exports.Post_SPEC = async function (req, res) {
  try {
    const { PartNo } = req.body;

    if (!PartNo) {
      return res.status(400).json({ error: "PartNo is required" });
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("PartNo", Type.NVarChar, PartNo.trim())
      .query("EXEC [dbo].[GetSpecByPartNo] @PartNo");

    if (result.recordset.length === 0) {
      res.status(404).json({ error: "No SPEC found for this Part Number" });
    } 
    else {
      res.json(result.recordset);
    }
  }
  catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Server Error", details: error.message });
  }
};


// Get Process by PartNo
exports.Post_PROCESS = async function (req, res) {
  try {
    const { PartNo } = req.body;

    if (!PartNo) {
      return res.status(400).json({ error:"PartNo is required"});
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("PartNo", sql.NVarChar, PartNo.trim())
      .query("EXEC [dbo].[GetProcessByPartNo] @PartNo")

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "No Process found for this PartNo"});
    }

    res.json(result.recordset);
  }
  catch (error) {
    console.error("Error executing query:", error.stack);
    res.status(500).json({ error: "Server Error", details: error.message});
  }
};


// // Get all unique Part Numbers for dropdown initialization
// const Get_PARTNO = async function (req, res) {
//   try {
//     const pool = await poolPromise;
//     const result = await pool
//       .request()
//       .query("EXEC [trans].[stored_Master_Tooling_Query_A]");

//     res.json(result.recordset);
//   } catch (error) {
//     console.error("Error executing query:", error.stack);
//     res.status(500).json({ error: "Internal Server Error", details: error.message });
//   }
// };

// // Get SPEC values based on selected PartNo
// const Post_SPEC = async function (req, res) {
//   try {
//     const { PartNo } = req.body;

//     if (!PartNo) {
//       return res.status(400).json({ error: "PartNo is required" });
//     }

//     const pool = await poolPromise;
//     const result = await pool
//       .request()
//       .input("PartNo", Type.NVarChar, PartNo)
//       .query("EXEC [trans].[stored_Master_Tooling_Query_GetSpec] @PartNo");

//     if (result.recordset.length === 0) {
//       res.status(404).json({ error: "No SPEC found for this Part Number" });
//     } else {
//       res.json(result.recordset);
//     }
//   } catch (error) {
//     console.error("Error executing query:", error.stack);
//     res.status(500).json({ error: "Server Error", details: error.message });
//   }
// };

// // Get PROCESS values based on selected PartNo (and optionally SPEC)
// const Post_PROCESS = async function (req, res) {
//   try {
//     const { PartNo, Spec } = req.body;

//     if (!PartNo) {
//       return res.status(400).json({ error: "PartNo is required" });
//     }

//     const pool = await poolPromise;
//     const request = pool.request().input("PartNo", Type.NVarChar, PartNo);
    
//     let query = "EXEC [trans].[stored_Master_Tooling_Query_B] @PartNo";
    
//     // If Spec is provided, add it as parameter for more specific filtering
//     if (Spec) {
//       request.input("Spec", Type.NVarChar, Spec);
//       query = "EXEC [trans].[stored_Master_Tooling_Query_B] @PartNo, @Spec";
//     }

//     const result = await request.query(query);

//     if (result.recordset.length === 0) {
//       res.status(404).json({ error: "No processes found for this Part Number" });
//     } else {
//       // Return only the first recordset if multiple exist
//       res.json(result.recordset);
//     }
//   } catch (error) {
//     console.error("Error executing query:", error.stack);
//     res.status(500).json({ error: "Server Error", details: error.message });
//   }
// };

// // Get MACHINE TYPE values based on selected PartNo and Process (and optionally SPEC)
// const Post_MACHINETYPE = async function (req, res) {
//   try {
//     const { PartNo, Process, Spec } = req.body;

//     if (!PartNo || !Process) {
//       return res.status(400).json({ error: "PartNo and Process are required" });
//     }

//     const pool = await poolPromise;
//     const request = pool.request()
//       .input("PartNo", Type.NVarChar, PartNo)
//       .input("Process", Type.NVarChar, Process);
    
//     let query = "EXEC [trans].[stored_Master_Tooling_Query_C] @PartNo, @Process";
    
//     // If Spec is provided, add it for more specific filtering
//     if (Spec) {
//       request.input("Spec", Type.NVarChar, Spec);
//       query = "EXEC [trans].[stored_Master_Tooling_Query_C] @PartNo, @Process, @Spec";
//     }

//     const result = await request.query(query);

//     if (result.recordset.length === 0) {
//       res.status(404).json({ error: "No machine types found for this combination" });
//     } else {
//       res.json(result.recordset);
//     }
//   } catch (error) {
//     console.error("Error executing query:", error.stack);
//     res.status(500).json({ error: "Server Error", details: error.message });
//   }
// };

// // Get all cascading dropdown data in one call (more efficient)
// const Post_CASCADING_DATA = async function (req, res) {
//   try {
//     const { PartNo, Spec, Process } = req.body;

//     const pool = await poolPromise;
//     const request = pool.request();
    
//     // Add parameters conditionally
//     if (PartNo) request.input("PartNo", Type.NVarChar, PartNo);
//     if (Spec) request.input("Spec", Type.NVarChar, Spec);
//     if (Process) request.input("Process", Type.NVarChar, Process);

//     const result = await request.query(`
//       EXEC [trans].[stored_Master_Tooling_Cascading_Dropdown] 
//       ${PartNo ? '@PartNo' : 'NULL'}, 
//       ${Spec ? '@Spec' : 'NULL'}, 
//       ${Process ? '@Process' : 'NULL'}
//     `);

//     // Return all recordsets for different dropdown levels
//     res.json({
//       partNumbers: result.recordsets[0] || [],
//       specs: result.recordsets[1] || [],
//       processes: result.recordsets[2] || [],
//       machineTypes: result.recordsets[3] || []
//     });
//   } catch (error) {
//     console.error("Error executing query:", error.stack);
//     res.status(500).json({ error: "Server Error", details: error.message });
//   }
// };

// // Enhanced item detail function with better error handling
// const Post_item_detail = async function (req, res) {
//   try {
//     const { PartNo, Process, MC, Spec } = req.body;

//     // Validate required parameters
//     if (!PartNo || !Process || !MC) {
//       return res.status(400).json({ 
//         error: "Missing required parameters", 
//         required: ["PartNo", "Process", "MC"] 
//       });
//     }

//     const pool = await poolPromise;
//     const request = pool.request()
//       .input("PartNo", Type.NVarChar, PartNo)
//       .input("Process", Type.NVarChar, Process)
//       .input("MC", Type.NVarChar, MC);

//     let query = "EXEC [trans].[stored_Master_Tooling_Query_D] @PartNo, @Process, @MC";
    
//     // Add Spec parameter if provided
//     if (Spec) {
//       request.input("Spec", Type.NVarChar, Spec);
//       query = "EXEC [trans].[stored_Master_Tooling_Query_D] @PartNo, @Process, @MC, @Spec";
//     }

//     const result = await request.query(query);

//     if (result.recordset.length === 0) {
//       res.status(404).json({ 
//         error: "No items found for the specified criteria",
//         criteria: { PartNo, Process, MC, Spec }
//       });
//     } else {
//       res.json({
//         success: true,
//         data: result.recordset,
//         count: result.recordset.length
//       });
//     }
//   } catch (error) {
//     console.error("Error executing query:", error.stack);
//     res.status(500).json({ error: "Server Error", details: error.message });
//   }
// };

// // Enhanced master MCNO function with async/await pattern
// const Get_master_MCNO = async function (req, res) {
//   try {
//     const { McNo } = req.body;

//     if (!McNo) {
//       return res.status(400).json({ error: "McNo is required" });
//     }

//     const pool = await poolPromise;
//     const result = await pool
//       .request()
//       .input('McNo', Type.NVarChar, McNo)
//       .query("EXEC [trans].[stored_Master_MCNO] @McNo");

//     if (result.recordset.length === 0) {
//       res.status(404).json({ error: "No machine found with this McNo" });
//     } else {
//       res.json(result.recordset);
//     }
//   } catch (error) {
//     console.error("Error executing query:", error.stack);
//     res.status(500).json({ error: "Internal Server Error", details: error.message });
//   }
// };

// // Enhanced request to cart function with better parameter handling
// const Post_request_to_cart = async (req, res) => {
//   try {
//     const {
//       Doc_no, Division, Factory, Date_of_Req, Item_no, Part_no, Revision,
//       Process, MC_type, Spec, Usage, MC_no, ON_HAND, Qty, Case_, Status,
//       Set_by, Local, phone_number, McQty, DateSetUp, MAIN_LOCATION,
//       Deliver_Items, Remark, MATLOT, NAME_NAME
//     } = req.body;

//     // Validate required fields
//     const requiredFields = ['Doc_no', 'Division', 'Part_no', 'Process', 'MC_type', 'Qty'];
//     const missingFields = requiredFields.filter(field => !req.body[field]);
    
//     if (missingFields.length > 0) {
//       return res.status(400).json({
//         error: "Missing required fields",
//         missingFields: missingFields
//       });
//     }

//     const pool = await poolPromise;
//     const result = await pool.request()
//       .input('Doc_no', Type.NVarChar, Doc_no)
//       .input('Division', Type.NVarChar, Division)
//       .input('Factory', Type.Int, Factory)
//       .input('Date_of_Req', Type.Date, Date_of_Req)
//       .input('Item_no', Type.NVarChar, Item_no)
//       .input('Part_no', Type.NVarChar, Part_no)
//       .input('Revision', Type.NVarChar, Revision)
//       .input('Process', Type.NVarChar, Process)
//       .input('MC_type', Type.NVarChar, MC_type)
//       .input('Spec', Type.NVarChar, Spec)
//       .input('Usage', Type.Int, Usage)
//       .input('MC_no', Type.NVarChar, MC_no)
//       .input('ON_HAND', Type.Float, ON_HAND)
//       .input('Qty', Type.Int, Qty)
//       .input('Case_', Type.NVarChar, Case_)
//       .input('Status', Type.NVarChar, Status)
//       .input('Set_by', Type.NVarChar, Set_by)
//       .input('Local', Type.Int, Local)
//       .input('phone_number', Type.NVarChar, phone_number)
//       .input('McQty', Type.Int, McQty)
//       .input('DateSetUp', Type.Date, DateSetUp)
//       .input('MAIN_LOCATION', Type.NVarChar, MAIN_LOCATION)
//       .input('Deliver_Items', Type.NVarChar, Deliver_Items)
//       .input('Remark', Type.NVarChar, Remark)
//       .input('MATLOT', Type.NVarChar, MATLOT)
//       .input('NAME_NAME', Type.NVarChar, NAME_NAME)
//       .query(`
//         EXEC [master].[stored_tb_Indirect_Expense_Detail_Request_Insert]
//         @Doc_no, @Division, @Factory, @Date_of_Req, @Item_no, @Part_no, @Revision,
//         @Process, @MC_type, @Spec, @Usage, @MC_no, @ON_HAND, @Qty, @Case_, @Status,
//         @Set_by, @Local, @phone_number, @McQty, @DateSetUp, @MAIN_LOCATION,
//         @Deliver_Items, @Remark, @MATLOT, @NAME_NAME
//       `);

//     res.json({
//       success: true,
//       message: "Request added to cart successfully",
//       data: result.recordset
//     });
//   } catch (err) {
//     console.error('Error inserting rows:', err);
//     res.status(500).json({
//       error: "Error inserting rows",
//       details: err.message
//     });
//   }
// };

// // Keep the existing Get_list_table function as is
// const Get_list_table = async function (req, res) {
//   try {
//     const pool = await poolPromise;
//     const result = await pool
//       .request()
//       .query("EXEC [master].[stored_tb_Indirect_Expense_Query_list_Table]");
      
//     if (result.recordset.length === 0) {
//       res.status(404).json({ message: 'No rows found' });
//     } else {
//       res.status(200).json(result.recordset);
//     }
//   } catch (err) {
//     console.error('Error selecting rows:', err);
//     res.status(500).json({ error: 'Error selecting rows', details: err.message });
//   }
// };
