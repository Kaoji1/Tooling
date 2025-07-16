const express = require('express');
const cors = require('cors');
const routes = require('./src/routes/index.route.js'); // Import the routes
// const bodyParser = require('body-parser');
// const path = require('path');
// require('dotenv').config();

const app = express();
const port = 3000;


app.use('/api', routes);



app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});


// // Import routes
// const authRoutes = require('./src/routes/auth.routes');
// const itemRoutes = require('./src/routes/item.routes');
// const cartRoutes = require('./src/routes/cart.routes');
// const requestRoutes = require('./src/routes/request.routes');
// const notificationRoutes = require('./src/routes/notification.routes');

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/items', itemRoutes);
// app.use('/api/cart', cartRoutes);
// app.use('/api/requests', requestRoutes);
// app.use('/api/notifications', notificationRoutes);

// Error handling middleware
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({ error: 'Something went wrong!' });
// });

// // 404 handler
// app.use('*', (req, res) => {
//   res.status(404).json({ error: 'Route not found' });
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });