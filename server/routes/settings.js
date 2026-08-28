const express = require('express');
const router = express.Router();
const database = require('../database');
const openaiService = require('../openaiService');
const telegramBot = require('../telegramBot');
const authMiddleware = require('../middleware/auth');

// Get public settings (public)
router.get('/public', (req, res) => {
  try {
    const settings = database.getSettings();
    
    // Return only public settings
    const publicSettings = {
      botName: settings.botName,
      welcomeMessage: settings.welcomeMessage,
      theme: settings.theme
    };
    
    res.json({
      success: true,
      data: publicSettings
    });
  } catch (error) {
    console.error('Get public settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all settings (admin only)
router.get('/', authMiddleware.verifyToken, (req, res) => {
  try {
    const settings = database.getSettings();
    
    // Mask sensitive data
    const safeSettings = {
      ...settings,
      openRouterApiKey: settings.openRouterApiKey ? '••••••••' + settings.openRouterApiKey.slice(-4) : '',
      telegramBotToken: settings.telegramBotToken ? '••••••••' + settings.telegramBotToken.slice(-4) : '',
      adminPassword: undefined // Never return password
    };
    
    res.json({
      success: true,
      data: safeSettings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update settings (admin only)
router.put('/', authMiddleware.verifyToken, (req, res) => {
  try {
    const { 
      groqApiKey, 
      telegramBotToken, 
      botName, 
      welcomeMessage, 
      theme 
    } = req.body;
    
    const updates = {};
    
    if (groqApiKey !== undefined && groqApiKey !== '••••••••') {
      updates.openRouterApiKey = groqApiKey;
    }
    if (telegramBotToken !== undefined && telegramBotToken !== '••••••••') {
      updates.telegramBotToken = telegramBotToken;
    }
    if (botName !== undefined) updates.botName = botName;
    if (welcomeMessage !== undefined) updates.welcomeMessage = welcomeMessage;
    if (theme !== undefined) updates.theme = theme;
    
    const updatedSettings = database.updateSettings(updates);
    
    // Reinitialize services if API keys changed
    if (updates.openRouterApiKey) {
      openaiService.updateApiKey(updates.openRouterApiKey);
    }
    if (updates.telegramBotToken) {
      telegramBot.updateToken(updates.telegramBotToken);
    }
    
    // Return safe settings
    const safeSettings = {
      ...updatedSettings,
      openRouterApiKey: updatedSettings.openRouterApiKey ? '••••••••' + updatedSettings.openRouterApiKey.slice(-4) : '',
      telegramBotToken: updatedSettings.telegramBotToken ? '••••••••' + updatedSettings.telegramBotToken.slice(-4) : '',
      adminPassword: undefined
    };
    
    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: safeSettings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get bot status (admin only)
router.get('/bot-status', authMiddleware.verifyToken, (req, res) => {
  try {
    const status = telegramBot.getStatus();
    const settings = database.getSettings();
    
    res.json({
      success: true,
      data: {
        ...status,
        hasGroqKey: !!settings.openRouterApiKey,
        hasTelegramToken: !!settings.telegramBotToken
      }
    });
  } catch (error) {
    console.error('Get bot status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Restart bot (admin only)
router.post('/restart-bot', authMiddleware.verifyToken, (req, res) => {
  try {
    const settings = database.getSettings();
    
    if (settings.telegramBotToken) {
      telegramBot.updateToken(settings.telegramBotToken);
    }
    
    if (settings.openRouterApiKey) {
      openaiService.updateApiKey(settings.openRouterApiKey);
    }
    
    const status = telegramBot.getStatus();
    res.json({
      success: true,
      message: 'Bot restarted successfully',
      data: status
    });
  } catch (error) {
    console.error('Restart bot error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});
module.exports = router;