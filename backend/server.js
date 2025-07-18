const express = require('express');
const cors = require('cors');
const routes = require('./src/routes/index.route.js'); // Import the routes

// Create Instance and Express application
const app = express();
const port = 3000; // Define the port number

// Define the routes
app.use('/api', routes);

app.use(cors());

// กำหนดเส้นทางหลัก
app.get('/', (req, res) => {
  res.send('This is backend!'); // ส่งข้อความ "Hello World!" เมื่อเข้า URL หลัก
});


app.get('/Item', function(req, res) {
  res.send('post_Item')
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

