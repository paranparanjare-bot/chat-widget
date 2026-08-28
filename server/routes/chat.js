const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const openaiService = require('../openaiService');
const database = require('../database');
const authMiddleware = require('../middleware/auth');

// Chat endpoint (public)
router.post('/message', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const session = sessionId || uuidv4();

    // Get chat history
    const chatHistory = database.getChatHistory(session, 20);
    const formattedHistory = chatHistory.map(h => ({
      role: h.role,
      content: h.content
    }));

    // Debug: Log request
    console.log('[CHAT] Processing message:', message.substring(0, 50));

    // Generate AI response
    const result = await openaiService.generateResponse(message, formattedHistory);

    // Debug: Log result
    console.log('[CHAT] AI Result:', JSON.stringify(result));

    // Save to chat history
    database.addChatMessage(session, {
      role: 'user',
      content: message
    });

    const responseText = result.success ? result.response : (result.error || 'Internal server error');
    database.addChatMessage(session, {
      role: 'assistant',
      content: responseText
    });

    if (result.success) {
      res.json({
        success: true,
        data: {
          sessionId: session,
          message: responseText,
          isAiGenerated: result.success,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      console.error('[CHAT] AI failed:', result.error || result.message);
      res.status(500).json({
        success: false,
        message: responseText || 'Internal server error'
      });
    }
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get chat history (admin only)
router.get('/history', authMiddleware.verifyToken, (req, res) => {
  try {
    const { sessionId, limit = 50 } = req.query;
    const history = database.getChatHistory(sessionId, parseInt(limit));

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all sessions (admin only)
router.get('/sessions', authMiddleware.verifyToken, (req, res) => {
  try {
    const history = database.getChatHistory(null, 1000);
    const sessions = [...new Set(history.map(h => h.sessionId))];

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
