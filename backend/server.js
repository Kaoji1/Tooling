const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
 //นำเข้าroutesทุกroutesที่ใช้ในการรับส่งข้อมูล
const routes = require('./src/routes/Request.route.js'); 
const SendRequestRoutes = require('./src/routes/SendRequest.route.js');
const UserHistory = require('./src/routes/UserHistory.route.js');
const PurchaseRequest = require('./src/routes/Purchaserequest.route.js');
const Cart = require('./src/routes/Cart.route.js');
const Login = require('./src/routes/Login.route.js')

// Create Instance and Express application
const app = express();
const port = 3000; // Define the port number

// Define the routes
app.use(cors());
app.use(bodyParser.urlencoded({ limit: '900mb', extended: true}))
app.use(bodyParser.json({ limit: '9000mb'}))
app.use(bodyParser.raw())

// นำเข้าpathของrouterทุกหน้า
app.use('/api', routes);
app.use('/api', SendRequestRoutes);
app.use('/api', UserHistory);
app.use('/api', PurchaseRequest);
app.use('/api', Cart);
app.use('/api', Login)

// กำหนดเส้นทางหลัก
app.get('/', (req, res) => {
  res.send('This is backend!'); // ส่งข้อความ "Hello World!" เมื่อเข้า URL หลัก
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

