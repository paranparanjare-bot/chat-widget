const express = require('express');
const router = express.Router();
const database = require('../database');
const authMiddleware = require('../middleware/auth');

// Get all knowledge base items (public)
router.get('/', (req, res) => {
  try {
    const knowledge = database.getKnowledgeBase();
    res.json({
      success: true,
      data: knowledge
    });
  } catch (error) {
    console.error('Get knowledge error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get knowledge by category (public)
router.get('/category/:category', (req, res) => {
  try {
    const { category } = req.params;
    const knowledge = database.getKnowledgeBase().filter(k => k.category === category);
    
    res.json({
      success: true,
      data: knowledge
    });
  } catch (error) {
    console.error('Get knowledge by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add new knowledge item (admin only)
router.post('/', authMiddleware.verifyToken, (req, res) => {
  try {
    const { category, question, answer } = req.body;

    if (!category || !question || !answer) {
      return res.status(400).json({
        success: false,
        message: 'Category, question, and answer are required'
      });
    }

    const newItem = database.addKnowledge({ category, question, answer });

    res.json({
      success: true,
      message: 'Knowledge item added successfully',
      data: newItem
    });
  } catch (error) {
    console.error('Add knowledge error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update knowledge item (admin only)
router.put('/:id', authMiddleware.verifyToken, (req, res) => {
  try {
    const { id } = req.params;
    const { category, question, answer } = req.body;

    const updates = {};
    if (category) updates.category = category;
    if (question) updates.question = question;
    if (answer) updates.answer = answer;

    const updatedItem = database.updateKnowledge(id, updates);

    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        message: 'Knowledge item not found'
      });
    }

    res.json({
      success: true,
      message: 'Knowledge item updated successfully',
      data: updatedItem
    });
  } catch (error) {
    console.error('Update knowledge error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete knowledge item (admin only)
router.delete('/:id', authMiddleware.verifyToken, (req, res) => {
  try {
    const { id } = req.params;
    const success = database.deleteKnowledge(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Knowledge item not found'
      });
    }

    res.json({
      success: true,
      message: 'Knowledge item deleted successfully'
    });
  } catch (error) {
    console.error('Delete knowledge error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
