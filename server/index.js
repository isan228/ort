const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Загружаем .env файл с явным указанием пути
dotenv.config({ path: path.resolve(__dirname, '.env') });

const sequelize = require('./config/database');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tests', require('./routes/tests'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/subscription', require('./routes/subscription'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5000;

// Database connection and server start
sequelize.authenticate()
  .then(() => {
    console.log('Database connected successfully');
    
    // Автоматическая синхронизация БД (управляется через AUTO_SYNC_DB в .env)
    const autoSync = process.env.AUTO_SYNC_DB === 'true' || process.env.NODE_ENV !== 'production';
    
    if (autoSync) {
      console.log('🔄 Автоматическая синхронизация БД включена (alter: true)');
      return sequelize.sync({ alter: true });
    } else {
      console.log('ℹ️  Автоматическая синхронизация БД отключена (используйте миграции вручную)');
      return Promise.resolve();
    }
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Unable to connect to the database:', error);
  });

module.exports = app;

