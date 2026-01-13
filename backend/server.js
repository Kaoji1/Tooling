
require('dotenv').config();

const express = require('express');
const http = require('http'); // สำหรับสร้าง server ให้ Socket.IO ใช้งาน
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const fileupload = require('express-fileupload');
//นำเข้าroutesทุกroutesที่ใช้ในการรับส่งข้อมูล
const pcPlanRoutes = require('./src/routes/PCPlan.route');
const Request = require('./src/routes/Request.route.js');
const SendRequestRoutes = require('./src/routes/SendRequest.route.js');
const UserHistory = require('./src/routes/UserHistory.route.js');
const PurchaseRequest = require('./src/routes/PurchaseRequest.route.js');
const Cart = require('./src/routes/Cart.route.js');
const Login = require('./src/routes/Login.route.js');
const Upload = require('./src/routes/FileUpload.route.js');
const Read = require('./src/routes/FileRead.route.js');
const Detail = require('./src/routes/DetailPurchaseRequestlist.route.js');
const Analyze = require('./src/routes/analyze.route.js');
const AnalyzeSmartRack = require('./src/routes/analyzeSmartRack.route.js');
// const Update_Request = require('./src/routes/DetailPurchaseRequestlist.route.js');
const PurchaseHistory = require('./src/routes/PurchaseHistory.route.js');
const Employee = require('./src/routes/Employee.route.js')
const Permission = require('./src/routes/Permission.route.js');
const HistoryPrint = require('./src/routes/HistoryPrint.route.js')
// const FileSaver = require('/src/routes/FileSaver.route.js');
// const ExportToExcel = require('./src/routes/ExportToExcel.route.js');
// const updateItem = require('./src/routes/DetailPurchaseRequestlist.route.js');

// Create Instance and Express application
const app = express();
const port = 3000; // Define the port number

// Define the routes
app.use(fileupload());
app.use(cors());
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))
app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.raw())

// นำเข้าpathของrouterทุกหน้า
app.use('/api/pc-plan', pcPlanRoutes);
app.use('/api', Request);
app.use('/api', SendRequestRoutes);
app.use('/api', UserHistory);
app.use('/api', PurchaseRequest);
app.use('/api', Cart);
app.use('/api', Login);
app.use('/api', Upload);
app.use('/api', Read);
app.use('/api', Detail); //DetailPurchaseRequestlistRoutes
app.use('/api', Analyze);
app.use('/api', AnalyzeSmartRack);
app.use('/api', PurchaseHistory);
app.use('/api', Employee);
app.use('/api', Permission);
app.use('/api', HistoryPrint);
// app.use('/api',FileSaver);
// app.use('/api',ExportToExcel);
// app.use('/api', updateItem);



// กำหนดเส้นทางหลัก
app.get('/', (req, res) => {
  res.send('This is backend!'); // ส่งข้อความ "Hello World!" เมื่อเข้า URL หลัก
});

// === เพิ่ม Socket.IO ===
const server = http.createServer(app); // ใช้ HTTP server ของ Node
const io = new Server(server, {
  cors: { origin: '*' } // อนุญาตทุก domain เชื่อมต่อ Socket.IO
});

// เมื่อ client เชื่อมต่อ
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // รับ event จาก client
  socket.on('sendNotification', (data) => {
    console.log('Notification received:', data);
    // ส่งไปทุก client
    io.emit('receiveNotification', data);
  });

  // เมื่อ client ตัดการเชื่อมต่อ
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});


server.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${port}`);
});

