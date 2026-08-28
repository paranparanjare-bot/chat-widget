const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// --- AUTO-RESET PASSWORD LOGIC (RESET KE: bajangratu5bwi) ---
// Bagian ini akan menghapus database lama agar password baru di database.js terbaca
const DB_FILE = path.join(__dirname, 'server/data/database.json');
if (fs.existsSync(DB_FILE)) {
    try {
        fs.unlinkSync(DB_FILE);
        console.log("⚠️ Database lama terdeteksi dan telah dihapus untuk sinkronisasi password baru.");
    } catch (err) {
        console.error("Gagal menghapus database lama:", err);
    }
}

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- STATIC FILES ---
app.use(express.static(path.join(__dirname, 'public')));

// --- ROUTES ---
const chatRoutes = require('./server/routes/chat');
const knowledgeRoutes = require('./server/routes/knowledge');
const settingsRoutes = require('./server/routes/settings');
const authMiddleware = require('./server/middleware/auth');

// Import services
const telegramBot = require('./server/telegramBot');
const openaiService = require('./server/openaiService');

// API Routes
app.use('/api/chat', chatRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/settings', settingsRoutes);

// Auth routes
app.post('/api/auth/login', authMiddleware.login);
app.post('/api/auth/verify', authMiddleware.verifyToken, authMiddleware.verify);
app.post('/api/auth/change-password', authMiddleware.verifyToken, authMiddleware.changePassword);
app.post('/api/auth/logout', authMiddleware.verifyToken, authMiddleware.logout);

// Health check
app.get('/api/health', (req, res) => {
  const botStatus = telegramBot.getStatus();
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        telegram: botStatus.isRunning ? 'running' : 'stopped',
        openai: openaiService.openai ? 'connected' : 'not configured'
      }
    }
  });
});

// --- SERVE FRONTEND ---
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // Initialize services
  const settings = require('./server/database').getSettings();
  if (settings.openRouterApiKey) console.log('🤖 OpenRouter AI initialized');
  if (settings.telegramBotToken) console.log('📱 Telegram bot initialized');
});

module.exports = app;