const TelegramBot = require('node-telegram-bot-api');
const database = require('./database');
const openaiService = require('./openaiService');  // Updated: renamed from groqService

class TelegramBotService {
  constructor() {
    this.bot = null;
    this.isRunning = false;
    this.initialize();
  }

  initialize() {
    const settings = database.getSettings();
    if (settings.telegramBotToken) {
      this.startBot(settings.telegramBotToken);
    }
  }

  startBot(token) {
    try {
      if (this.bot) {
        this.bot.stopPolling();
      }
      this.bot = new TelegramBot(token, { polling: true });
      this.isRunning = true;
      console.log('✅ Telegram bot started with Strict AI Mode');

      // Handler untuk /start
      this.bot.onText('/start', async (msg) => {
        const chatId = msg.chat.id;
        const welcome = "Halo kak 😊. Selamat datang di BR Bumbu Betutu - Premium Bali Heritage. Ada yang bisa saya bantu seputar produk atau cara masak?";
        await this.bot.sendMessage(chatId, welcome);

        const menuText = `*Menu Cepat:*\n/produk - Info Produk & Foto\n/harga - Cek Harga & Varian\n/caramasak - Panduan Memasak\n/order - Cara Pemesanan`;

        await this.bot.sendMessage(chatId, menuText, { parse_mode: 'Markdown' });
      });

      // Handler pesan teks (Semua diarahkan ke AI agar jawaban konsisten)
      this.bot.on('message', async (msg) => {
        if (!msg.text) return;

        const chatId = msg.chat.id;
        const userMessage = msg.text;

        // Jika pesan adalah command, kita petakan ke pertanyaan alami agar dijawab AI
        let aiQuery = userMessage;
        if (userMessage.startsWith('/')) {
            const command = userMessage.split(' ')[0].toLowerCase();
            switch(command) {
                case '/produk': aiQuery = "Bisa jelaskan detail produk dan minta link fotonya?"; break;
                case '/harga': aiQuery = "Berapa harga bumbunya dan ada varian apa saja?"; break;
                case '/caramasak': aiQuery = "Bagaimana cara memasak ayam betutu menggunakan bumbu BR?"; break;
                case '/order': aiQuery = "Saya mau pesan, bagaimana caranya dan lewat mana?"; break;
                case '/start': return; // Sudah ditangani di atas
                default: aiQuery = userMessage.replace('/', '');
            }
        }

        await this.bot.sendChatAction(chatId, 'typing');

        // Ambil riwayat chat Telegram (maksimal 5 pesan terakhir agar tetap fokus)
        const chatHistory = database.getChatHistory(`telegram_${chatId}`, 5);
        const formattedHistory = chatHistory.map(h => ({
          role: h.role,
          content: h.content
        }));

        // Generate respon menggunakan OpenRouterService yang sudah kita perketat sebelumnya
        const result = await openaiService.generateResponse(aiQuery, formattedHistory);
        const responseText = result.response;

        // Simpan ke history database
        database.addChatMessage(`telegram_${chatId}`, { role: 'user', content: userMessage });
        database.addChatMessage(`telegram_${chatId}`, { role: 'assistant', content: responseText });

        // Kirim jawaban ke user
        await this.bot.sendMessage(chatId, responseText);
      });

      this.bot.on('polling_error', (error) => {
        console.error('Telegram polling error:', error);
      });

      return true;
    } catch (error) {
      console.error('Error starting Telegram bot:', error);
      this.isRunning = false;
      return false;
    }
  }

  stopBot() {
    if (this.bot) {
      this.bot.stopPolling();
      this.bot = null;
      this.isRunning = false;
    }
  }

  updateToken(token) {
    this.stopBot();
    if (token) this.startBot(token);
  }

  getStatus() {
    return { isRunning: this.isRunning, hasBot: !!this.bot };
  }
}

module.exports = new TelegramBotService();