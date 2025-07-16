const express = require('express');
const cors = require('cors');
const routes = require('./src/routes/index.route.js'); // Import the routes

const app = express();
const port = 3000;


app.use('/', routes);

app.get('/PostName', function(req, res) {
  res.send('post_PartName')
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

