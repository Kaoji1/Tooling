const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fileupload = require('express-fileupload');
 //นำเข้าroutesทุกroutesที่ใช้ในการรับส่งข้อมูล
const Request= require('./src/routes/Request.route.js');
const SendRequestRoutes = require('./src/routes/SendRequest.route.js');
const UserHistory = require('./src/routes/UserHistory.route.js');
const PurchaseRequest = require('./src/routes/PurchaseRequest.route.js');
const Cart = require('./src/routes/Cart.route.js');
const Login = require('./src/routes/Login.route.js');
const Upload = require('./src/routes/FileUpload.route.js');
const Read = require('./src/routes/FileRead.route.js');
const Detail = require('./src/routes/DetailPurchaseRequestlist.route.js');
// const Update_Request = require('./src/routes/DetailPurchaseRequestlist.route.js');
const PurchaseHistory = require('./src/routes/PurchaseHistory.route.js');
const Employee = require('./src/routes/Employee.route.js')
// const FileSaver = require('/src/routes/FileSaver.route.js');
// const ExportToExcel = require('./src/routes/ExportToExcel.route.js');
// const updateItem = require('./src/routes/DetailPurchaseRequestlist.route.js');

// Create Instance and Express application
const app = express();
const port = 3000; // Define the port number

// Define the routes
app.use(fileupload());
app.use(cors());
app.use(bodyParser.urlencoded({ limit: '900mb', extended: true}))
app.use(bodyParser.json({ limit: '9000mb'}))
app.use(bodyParser.raw())

// นำเข้าpathของrouterทุกหน้า
app.use('/api', Request);
app.use('/api', SendRequestRoutes);
app.use('/api', UserHistory);
app.use('/api', PurchaseRequest);
app.use('/api', Cart);
app.use('/api', Login);
app.use('/api', Upload);
app.use('/api', Read);
app.use('/api', Detail); //DetailPurchaseRequestlistRoutes
app.use('/api', PurchaseHistory);
app.use('/api',Employee);
// app.use('/api',FileSaver);
// app.use('/api',ExportToExcel);
// app.use('/api', updateItem);



// กำหนดเส้นทางหลัก
app.get('/', (req, res) => {
  res.send('This is backend!'); // ส่งข้อความ "Hello World!" เมื่อเข้า URL หลัก
});


app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${port}`);
});

