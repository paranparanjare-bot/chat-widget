const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Simple hash function
function simpleHash(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

// Hash password
function hashPassword(password) {
  return `hash_${simpleHash(password)}_salt`;
}

// Verify password
function verifyPassword(password, hashed) {
  return hashPassword(password) === hashed;
}

// Default data structure
const defaultData = {
  settings: {
    openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
    adminPassword: hashPassword('bajangratu5bwi'),
    botName: 'Betutu Assistant',
    welcomeMessage: 'Halo! Selamat datang di Bumbu Ayam Betutu Khas Bali.',
    theme: {
      primaryColor: '#D4A574',
      secondaryColor: '#8B4513',
      accentColor: '#FFD700',
    },
  },
  knowledgeBase: [
    {
      id: '1',
      category: 'produk',
      question: 'Apa itu bumbu ayam betutu?',
      answer: 'Bumbu Ayam Betutu adalah bumbu khas Bali yang digunakan untuk memasak ayam, babi, atau ikan. Terbuat dari rempah-rempah pilihan seperti Sereh, cabai rawit, cabai merah lengkuas, kunyit, jahe, bawang merah, bawang putih, terasi, dan gula merah.'
    },
    {
      id: '2',
      category: 'produk',
      question: 'Berapa harga bumbu ayam betutu?',
      answer: 'Kami menyediakan 2 varian Pedas dan Sedang, harga Rp 10.000 per sachet.'
    },
    {
      id: '4',
      category: 'cara_pesan',
      question: 'Bagaimana cara memesan?',
      answer: 'Anda bisa memesan melalui WhatsApp, Telegram, atau website kami. Klik tombon "Pesan Sekarang" di halaman utama.'
    },
    {
      id: '5',
      category: 'cara_pesan',
      question: 'Bagaimana cara memesan?',
      answer: 'Anda bisa memesan melalui WhatsApp (0895 428 200 700) atau lewat formulir di website kami.'
    }
  ],
  chatHistory: [],
  admins: [
    {
      id: 1,
      username: 'bajangratu',
      password: hashPassword('bajangratu5bwi'),
      role: 'superadmin'
    }
  ]
};

// Load or initialize database
function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading database:', error);
  }
  return JSON.parse(JSON.stringify(defaultData));
}

// Save database to file
function saveDatabase(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving database:', error);
    return false;
  }
}

// Database instance
let db = loadDatabase();

// Database operations
const database = {
  // Settings
  getSettings() {
    return db.settings;
  },

  updateSettings(settings) {
    db.settings = { ...db.settings, ...settings };
    saveDatabase(db);
    return db.settings;
  },

  // Knowledge Base
  getKnowledgeBase() {
    return db.knowledgeBase;
  },

  addKnowledge(item) {
    const newItem = { id: uuidv4(), ...item };
    db.knowledgeBase.push(newItem);
    saveDatabase(db);
    return newItem;
  },

  updateKnowledge(id, updates) {
    const index = db.knowledgeBase.findIndex(item => item.id === id);
    if (index !== -1) {
      db.knowledgeBase[index] = { ...db.knowledgeBase[index], ...updates };
      saveDatabase(db);
      return db.knowledgeBase[index];
    }
    return null;
  },

  deleteKnowledge(id) {
    const index = db.knowledgeBase.findIndex(item => item.id === id);
    if (index !== -1) {
      db.knowledgeBase.splice(index, 1);
      saveDatabase(db);
      return true;
    }
    return false;
  },

  // Chat History
  addChatMessage(sessionId, message) {
    const chatMessage = {
      id: uuidv4(),
      sessionId,
      ...message,
      timestamp: new Date().toISOString()
    };

    db.chatHistory.push(chatMessage);

    // Keep only last 1000 messages
    if (db.chatHistory.length > 1000) {
      db.chatHistory = db.chatHistory.slice(-1000);
    }

    saveDatabase(db);
    return chatMessage;
  },

  getChatHistory(sessionId, limit = 50) {
    let history = db.chatHistory;
    if (sessionId) {
      history = history.filter(msg => msg.sessionId === sessionId);
    }
    return history.slice(-limit);
  },

  // Admin
  getAdmin(username) {
    return db.admins.find(admin => admin.username === username);
  },

  verifyAdmin(username, password) {
    const admin = this.getAdmin(username);
    if (admin && verifyPassword(password, admin.password)) {
      return { id: admin.id, username: admin.username, role: admin.role };
    }
    return null;
  },

  updateAdminPassword(username, newPassword) {
    const admin = this.getAdmin(username);
    if (admin) {
      admin.password = hashPassword(newPassword);
      saveDatabase(db);
      return true;
    }
    return false;
  },

  // Reset to default
  reset() {
    db = JSON.parse(JSON.stringify(defaultData));
    saveDatabase(db);
    return db;
  }
};

module.exports = database;