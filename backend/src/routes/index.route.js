// Import required libraries
const express = require('express');
const router = express.Router();

// Import controllers
const ItemlistController = require('../controllers/Itemlist.controller');
const testController = require('../controllers/test.controller');

// Middleware for logging requests (optional)
router.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'API is running'
  });
});

// =================== TOOL DATA ROUTES ===================

/**
 * GET /api/PartNo
 * Get all unique part numbers for dropdown population
 */
router.get('/PartNo', ItemlistController.GetPartNoList);

/**
 * GET /api/tool
 * Get filtered tool data based on query parameters
 * Query params: PartNo, SPEC, Process, MC
 * Example: /api/tool?PartNo=ABC123&SPEC=High&Process=TURNING
 */
router.get('/tool', ItemlistController.GetToolData);

/**
 * GET /api/tool/specifications/:partNo
 * Get unique specifications for a specific part number
 */
router.get('/tool/specifications/:partNo', ItemlistController.GetSpecifications);

/**
 * GET /api/tool/processes/:partNo
 * Get unique processes for a specific part number and specification
 * Query param: spec (optional)
 */
router.get('/tool/processes/:partNo', ItemlistController.GetProcesses);

/**
 * GET /api/tool/machines/:partNo
 * Get unique machine types for specific parameters
 * Query params: spec, process (optional)
 */
router.get('/tool/machines/:partNo', ItemlistController.GetMachineTypes);

// =================== REQUEST MANAGEMENT ROUTES ===================

/**
 * POST /api/submit
 * Submit cart data / create new request
 */
router.post('/submit', ItemlistController.SubmitRequest);

/**
 * GET /api/requests
 * Get all requests (with pagination and filtering)
 * Query params: page, limit, status, division, factory
 */
router.get('/requests', ItemlistController.GetRequests);

/**
 * GET /api/requests/:id
 * Get specific request by ID
 */
router.get('/requests/:id', ItemlistController.GetRequestById);

/**
 * PUT /api/requests/:id
 * Update request status or details
 */
router.put('/requests/:id', ItemlistController.UpdateRequest);

/**
 * DELETE /api/requests/:id
 * Delete/cancel a request
 */
router.delete('/requests/:id', ItemlistController.DeleteRequest);

// =================== UTILITY ROUTES ===================

/**
 * GET /api/divisions
 * Get all available divisions
 */
router.get('/divisions', ItemlistController.GetDivisions);

/**
 * GET /api/factories
 * Get all available factories
 */
router.get('/factories', ItemlistController.GetFactories);

/**
 * GET /api/stats
 * Get dashboard statistics
 */
router.get('/stats', ItemlistController.GetStatistics);

// =================== TEST ROUTES (Development only) ===================

if (process.env.NODE_ENV === 'development') {
  /**
   * GET /api/test/data
   * Test endpoint for development
   */
  router.get('/test/data', testController.GetTestData);

  /**
   * GET /api/test/partno
   * Test PartNo endpoint
   */
  router.get('/test/partno', testController.Get_PARTNO);
}

// =================== ERROR HANDLING ===================

// Handle 404 for undefined routes
router.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Route Error:', error);
  
  res.status(error.status || 500).json({
    error: error.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

module.exports = router;