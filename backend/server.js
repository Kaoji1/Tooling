const express = require('express');
// const cors = require('cors');
// const bodyParser = require('body-parser');
// const path = require('path');
// require('dotenv').config();
<<<<<<< HEAD
const port = 1444
const app = express();



app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// // Middleware
// app.use(cors());
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

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

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({ error: 'Something went wrong!' });
// });

// // 404 handler
// app.use('*', (req, res) => {
//   res.status(404).json({ error: 'Route not found' });
// });

=======

const app = express();

const port = 8400;


app.get('/', (req, res) => {
  res.send('Hello Hell!');
});

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

>>>>>>> 9f0149f014198e51f186252bd64f4c6c23effae4
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });