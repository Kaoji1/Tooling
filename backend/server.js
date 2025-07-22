const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser')
const routes = require('./src/routes/index.route.js'); // Import the routes

// Create Instance and Express application
const app = express();
const port = 3000; // Define the port number

// Define the routes
app.use(cors());
app.use(bodyParser.urlencoded({ limit: '900mb', extended: true}))
app.use(bodyParser.json({ limit: '9000mb'}))
app.use(bodyParser.raw())

app.use('/api', routes);

// กำหนดเส้นทางหลัก
app.get('/', (req, res) => {
  res.send('This is backend!'); // ส่งข้อความ "Hello World!" เมื่อเข้า URL หลัก
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

