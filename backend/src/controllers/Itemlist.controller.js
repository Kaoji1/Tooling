const { connectDb, closeDb, poolPromise } = require("../config/database");
const sql = require("mssql");

// Helper function for error responses
const sendError = (res, statusCode, message, details = null) => {
  const errorResponse = {
    error: message,
    timestamp: new Date().toISOString(),
    ...(details && process.env.NODE_ENV === 'development' && { details })
  };
  
  console.error(`Error ${statusCode}: ${message}`, details);
  res.status(statusCode).json(errorResponse);
};

// Helper function for success responses
const sendSuccess = (res, data, message = null) => {
  const response = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    ...(message && { message })
  };
  
  res.status(200).json(response);
};

// Validation helper
const validateQueryParams = (params, requiredParams = []) => {
  const errors = [];
  
  requiredParams.forEach(param => {
    if (!params[param] || params[param].trim() === '') {
      errors.push(`Missing required parameter: ${param}`);
    }
  });
  
  return errors;
};

/**
 * Get tool data with dynamic filtering
 * Supports filtering by PartNo, SPEC, Process, MC
 */
exports.GetToolData = async function (req, res) {
  try {
    const pool = await poolPromise;
    const { PartNo, SPEC, Process, MC } = req.query;

    // Validate at least PartNo is provided
    if (!PartNo || PartNo.trim() === '') {
      return sendError(res, 400, 'PartNo parameter is required');
    }

    const request = pool.request();

    // Build dynamic query based on provided parameters
    let query = `
      SELECT DISTINCT 
        PartNo, SPECS, Process, MC, Usage, Local
      FROM [dbo].[ToolDataset] 
      WHERE PartNo = @PartNo
    `;
    
    request.input("PartNo", sql.NVarChar, PartNo.trim());

    if (SPEC && SPEC.trim() !== '') {
      query += " AND SPECS = @SPEC";
      request.input("SPEC", sql.NVarChar, SPEC.trim());
    }

    if (Process && Process.trim() !== '') {
      query += " AND Process = @Process";
      request.input("Process", sql.NVarChar, Process.trim());
    }

    if (MC && MC.trim() !== '') {
      query += " AND MC = @MC";
      request.input("MC", sql.NVarChar, MC.trim());
    }

    query += " ORDER BY PartNo, SPECS, Process, MC";

    const result = await request.query(query);
    
    if (result.recordset.length === 0) {
      return sendSuccess(res, [], 'No data found for the specified parameters');
    }

    sendSuccess(res, result.recordset);

  } catch (error) {
    sendError(res, 500, "Failed to retrieve tool data", error.message);
  }
};

/**
 * Get all unique PartNo values for dropdown population
 */
exports.GetPartNoList = async function (req, res) {
  try {
    const pool = await poolPromise;
    
    const result = await pool
      .request()
      .query(`
        SELECT DISTINCT PartNo 
        FROM [dbo].[ToolDataset] 
        WHERE PartNo IS NOT NULL AND PartNo != ''
        ORDER BY PartNo
      `);

    if (result.recordset.length === 0) {
      return sendSuccess(res, [], 'No part numbers found');
    }

    sendSuccess(res, result.recordset);

  } catch (error) {
    sendError(res, 500, "Failed to retrieve part number list", error.message);
  }
};

/**
 * Get unique specifications for a specific part number
 */
exports.GetSpecifications = async function (req, res) {
  try {
    const { partNo } = req.params;
    
    if (!partNo || partNo.trim() === '') {
      return sendError(res, 400, 'Part number is required');
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input('PartNo', sql.NVarChar, partNo.trim())
      .query(`
        SELECT DISTINCT SPECS as specification
        FROM [dbo].[ToolDataset] 
        WHERE PartNo = @PartNo AND SPECS IS NOT NULL AND SPECS != ''
        ORDER BY SPECS
      `);

    sendSuccess(res, result.recordset);

  } catch (error) {
    sendError(res, 500, "Failed to retrieve specifications", error.message);
  }
};

/**
 * Get unique processes for a specific part number and optional specification
 */
exports.GetProcesses = async function (req, res) {
  try {
    const { partNo } = req.params;
    const { spec } = req.query;
    
    if (!partNo || partNo.trim() === '') {
      return sendError(res, 400, 'Part number is required');
    }

    const pool = await poolPromise;
    const request = pool.request();
    
    let query = `
      SELECT DISTINCT Process 
      FROM [dbo].[ToolDataset] 
      WHERE PartNo = @PartNo AND Process IS NOT NULL AND Process != ''
    `;
    
    request.input('PartNo', sql.NVarChar, partNo.trim());

    if (spec && spec.trim() !== '') {
      query += " AND SPECS = @Spec";
      request.input('Spec', sql.NVarChar, spec.trim());
    }

    query += " ORDER BY Process";

    const result = await request.query(query);
    sendSuccess(res, result.recordset);

  } catch (error) {
    sendError(res, 500, "Failed to retrieve processes", error.message);
  }
};

/**
 * Get unique machine types for specific parameters
 */
exports.GetMachineTypes = async function (req, res) {
  try {
    const { partNo } = req.params;
    const { spec, process } = req.query;
    
    if (!partNo || partNo.trim() === '') {
      return sendError(res, 400, 'Part number is required');
    }

    const pool = await poolPromise;
    const request = pool.request();
    
    let query = `
      SELECT DISTINCT MC as machineType
      FROM [dbo].[ToolDataset] 
      WHERE PartNo = @PartNo AND MC IS NOT NULL AND MC != ''
    `;
    
    request.input('PartNo', sql.NVarChar, partNo.trim());

    if (spec && spec.trim() !== '') {
      query += " AND SPECS = @Spec";
      request.input('Spec', sql.NVarChar, spec.trim());
    }

    if (process && process.trim() !== '') {
      query += " AND Process = @Process";
      request.input('Process', sql.NVarChar, process.trim());
    }

    query += " ORDER BY MC";

    const result = await request.query(query);
    sendSuccess(res, result.recordset);

  } catch (error) {
    sendError(res, 500, "Failed to retrieve machine types", error.message);
  }
};

/**
 * Submit a new request with cart items
 */
exports.SubmitRequest = async function (req, res) {
  const transaction = new sql.Transaction(await poolPromise);
  
  try {
    const { items, requestInfo } = req.body;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return sendError(res, 400, 'Items array is required and cannot be empty');
    }

    if (!requestInfo) {
      return sendError(res, 400, 'Request information is required');
    }

    const { division, factory, dueDate, phoneNumber } = requestInfo;

    // Validate required fields
    const validationErrors = validateQueryParams(requestInfo, ['division', 'factory']);
    if (validationErrors.length > 0) {
      return sendError(res, 400, validationErrors.join(', '));
    }

    await transaction.begin();

    // Generate document number
    const docNoResult = await transaction.request()
      .query(`
        SELECT 'REQ' + FORMAT(GETDATE(), 'yyyyMMdd') + 
               RIGHT('000' + CAST(ISNULL(MAX(RIGHT(Doc_no, 3)), 0) + 1 AS VARCHAR), 3) as newDocNo
        FROM [dbo].[Requests] 
        WHERE Doc_no LIKE 'REQ' + FORMAT(GETDATE(), 'yyyyMMdd') + '%'
      `);

    const docNo = docNoResult.recordset[0].newDocNo;

    // Insert main request record
    await transaction.request()
      .input('DocNo', sql.NVarChar, docNo)
      .input('Division', sql.NVarChar, division)
      .input('Factory', sql.NVarChar, factory)
      .input('RequestDate', sql.DateTime, new Date())
      .input('DueDate', sql.DateTime, dueDate ? new Date(dueDate) : null)
      .input('PhoneNumber', sql.NVarChar, phoneNumber || null)
      .input('Status', sql.NVarChar, 'PENDING')
      .query(`
        INSERT INTO [dbo].[Requests] 
        (Doc_no, Division, Factory, Date_of_Req, Due_Date, Phone_Number, Status, Created_Date)
        VALUES (@DocNo, @Division, @Factory, @RequestDate, @DueDate, @PhoneNumber, @Status, GETDATE())
      `);

    // Insert request items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      await transaction.request()
        .input('DocNo', sql.NVarChar, docNo)
        .input('ItemNo', sql.Int, i + 1)
        .input('PartNo', sql.NVarChar, item.Part_no)
        .input('Process', sql.NVarChar, item.Process)
        .input('MCType', sql.NVarChar, item.MC_type)
        .input('Spec', sql.NVarChar, item.Spec)
        .input('Qty', sql.Int, item.Qty || 0)
        .input('MCNo', sql.NVarChar, item.MC_no || null)
        .input('Usage', sql.Int, item.Usage || 0)
        .input('Local', sql.Int, item.Local || 0)
        .query(`
          INSERT INTO [dbo].[RequestItems] 
          (Doc_no, Item_no, Part_no, Process, MC_type, Spec, Qty, MC_no, Usage, Local)
          VALUES (@DocNo, @ItemNo, @PartNo, @Process, @MCType, @Spec, @Qty, @MCNo, @Usage, @Local)
        `);
    }

    await transaction.commit();

    sendSuccess(res, { 
      docNo,
      itemCount: items.length,
      message: 'Request submitted successfully'
    });

  } catch (error) {
    await transaction.rollback();
    sendError(res, 500, "Failed to submit request", error.message);
  }
};

/**
 * Get all requests with pagination and filtering
 */
exports.GetRequests = async function (req, res) {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      division, 
      factory,
      startDate,
      endDate 
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const pool = await poolPromise;
    const request = pool.request();

    let whereClause = "WHERE 1=1";
    
    if (status) {
      whereClause += " AND r.Status = @Status";
      request.input('Status', sql.NVarChar, status);
    }
    
    if (division) {
      whereClause += " AND r.Division = @Division";
      request.input('Division', sql.NVarChar, division);
    }
    
    if (factory) {
      whereClause += " AND r.Factory = @Factory";
      request.input('Factory', sql.NVarChar, factory);
    }

    if (startDate) {
      whereClause += " AND r.Date_of_Req >= @StartDate";
      request.input('StartDate', sql.DateTime, new Date(startDate));
    }

    if (endDate) {
      whereClause += " AND r.Date_of_Req <= @EndDate";
      request.input('EndDate', sql.DateTime, new Date(endDate));
    }

    const query = `
      SELECT 
        r.*,
        COUNT(ri.Item_no) as ItemCount
      FROM [dbo].[Requests] r
      LEFT JOIN [dbo].[RequestItems] ri ON r.Doc_no = ri.Doc_no
      ${whereClause}
      GROUP BY r.Doc_no, r.Division, r.Factory, r.Date_of_Req, r.Due_Date, 
               r.Phone_Number, r.Status, r.Created_Date, r.Updated_Date
      ORDER BY r.Created_Date DESC
      OFFSET ${offset} ROWS FETCH NEXT ${parseInt(limit)} ROWS ONLY
    `;

    const result = await request.query(query);
    
    // Get total count
    const countResult = await pool.request().query(`
      SELECT COUNT(*) as total FROM [dbo].[Requests] r ${whereClause}
    `);
    
    const totalRecords = countResult.recordset[0].total;
    const totalPages = Math.ceil(totalRecords / parseInt(limit));

    sendSuccess(res, {
      requests: result.recordset,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRecords,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    sendError(res, 500, "Failed to retrieve requests", error.message);
  }
};

/**
 * Get request by ID with items
 */
exports.GetRequestById = async function (req, res) {
  try {
    const { id } = req.params;
    
    if (!id) {
      return sendError(res, 400, 'Request ID is required');
    }

    const pool = await poolPromise;
    
    // Get request details
    const requestResult = await pool
      .request()
      .input('DocNo', sql.NVarChar, id)
      .query(`
        SELECT * FROM [dbo].[Requests] WHERE Doc_no = @DocNo
      `);

    if (requestResult.recordset.length === 0) {
      return sendError(res, 404, 'Request not found');
    }

    // Get request items
    const itemsResult = await pool
      .request()
      .input('DocNo', sql.NVarChar, id)
      .query(`
        SELECT * FROM [dbo].[RequestItems] 
        WHERE Doc_no = @DocNo 
        ORDER BY Item_no
      `);

    const requestData = {
      ...requestResult.recordset[0],
      items: itemsResult.recordset
    };

    sendSuccess(res, requestData);

  } catch (error) {
    sendError(res, 500, "Failed to retrieve request", error.message);
  }
};

/**
 * Update request status
 */
exports.UpdateRequest = async function (req, res) {
  try {
    const { id } = req.params;
    const { status, setBy } = req.body;
    
    if (!id) {
      return sendError(res, 400, 'Request ID is required');
    }

    if (!status) {
      return sendError(res, 400, 'Status is required');
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input('DocNo', sql.NVarChar, id)
      .input('Status', sql.NVarChar, status)
      .input('SetBy', sql.NVarChar, setBy || null)
      .input('UpdatedDate', sql.DateTime, new Date())
      .query(`
        UPDATE [dbo].[Requests] 
        SET Status = @Status, Set_by = @SetBy, Updated_Date = @UpdatedDate
        WHERE Doc_no = @DocNo
      `);

    if (result.rowsAffected[0] === 0) {
      return sendError(res, 404, 'Request not found');
    }

    sendSuccess(res, { message: 'Request updated successfully' });

  } catch (error) {
    sendError(res, 500, "Failed to update request", error.message);
  }
};

/**
 * Delete request (soft delete by updating status)
 */
exports.DeleteRequest = async function (req, res) {
  try {
    const { id } = req.params;
    
    if (!id) {
      return sendError(res, 400, 'Request ID is required');
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input('DocNo', sql.NVarChar, id)
      .input('UpdatedDate', sql.DateTime, new Date())
      .query(`
        UPDATE [dbo].[Requests] 
        SET Status = 'CANCELLED', Updated_Date = @UpdatedDate
        WHERE Doc_no = @DocNo AND Status != 'COMPLETED'
      `);

    if (result.rowsAffected[0] === 0) {
      return sendError(res, 404, 'Request not found or already completed');
    }

    sendSuccess(res, { message: 'Request cancelled successfully' });

  } catch (error) {
    sendError(res, 500, "Failed to delete request", error.message);
  }
};

/**
 * Get dashboard statistics
 */
exports.GetStatistics = async function (req, res) {
  try {
    const pool = await poolPromise;
    
    const stats = await pool.request().query(`
      SELECT 
        COUNT(*) as TotalRequests,
        COUNT(CASE WHEN Status = 'PENDING' THEN 1 END) as PendingRequests,
        COUNT(CASE WHEN Status = 'COMPLETED' THEN 1 END) as CompletedRequests,
        COUNT(CASE WHEN Status = 'CANCELLED' THEN 1 END) as CancelledRequests,
        COUNT(CASE WHEN CAST(Date_of_Req as DATE) = CAST(GETDATE() as DATE) THEN 1 END) as TodayRequests
      FROM [dbo].[Requests]
    `);

    sendSuccess(res, stats.recordset[0]);

  } catch (error) {
    sendError(res, 500, "Failed to retrieve statistics", error.message);
  }
};

// Utility endpoints
exports.GetDivisions = async function (req, res) {
  try {
    const divisions = [
      { label: 'GM', value: 'GM' },
      { label: 'PMC', value: 'PMC' }
    ];
    sendSuccess(res, divisions);
  } catch (error) {
    sendError(res, 500, "Failed to retrieve divisions", error.message);
  }
};

exports.GetFactories = async function (req, res) {
  try {
    const factories = [
      { label: 'Factory 1', value: '1' },
      { label: 'Factory 2', value: '2' },
      { label: 'Factory 3', value: '3' },
      { label: 'Factory 4', value: '4' },
      { label: 'Factory 5', value: '5' },
      { label: 'Factory 6', value: '6' },
      { label: 'Factory 7', value: '7' }
    ];
    sendSuccess(res, factories);
  } catch (error) {
    sendError(res, 500, "Failed to retrieve factories", error.message);
  }
};