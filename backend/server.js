const express = require('express');
const cors = require('cors');
const routes = require('./src/routes/index.route.js'); // Import the routes

// Create Instance and Express application
const app = express();
const port = 3000; // Define the port number

// // Use middlewares
// app.use(cors()); // ใช้ CORS middleware เพื่ออนุญาตให้เรียก API จากโดเมนอื่น
// app.use(express.json()); // ใช้ middleware สำหรับการแปลง JSON ใน request body
// app.use(express.urlencoded({ extended: true })); // ใช้ middleware สำหรับการแปลง URL-encoded data

// // Middleware สำหรับตั้งค่าหัวข้อการตอบสนอง
// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "*"); // อนุญาตให้ทุกโดเมนเข้าถึง
//   res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT"); // กำหนดวิธีการที่อนุญาต
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-client-key, x-client-token, x-client-secret, Authorization"); // กำหนดหัวข้อที่อนุญาต
//   next(); // ไปยัง middleware ถัดไป
// });

// Define the routes
app.use('/api', routes);


// ใช้ middleware สำหรับจัดการข้อผิดพลาด
// app.use(errorMiddleware);

// กำหนดเส้นทางหลัก
app.get('/', (req, res) => {
  res.send('This is backend!'); // ส่งข้อความ "Hello World!" เมื่อเข้า URL หลัก
});


app.get('/PostName', function(req, res) {
  res.send('post_PartName')
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

