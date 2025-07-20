const express = require('express');
const Database = require('better-sqlite3');
const { body, validationResult } = require('express-validator');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize SQLite database
const db = new Database(process.env.DB_PATH || 'habits.db');

// Create tables if they don't exist
const initDb = () => {
  // Habits table - Contains all required fields
  db.exec(`
    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,                    -- ✅ name
      icon TEXT DEFAULT '⭐',                -- ✅ icon  
      frequency TEXT NOT NULL CHECK(frequency IN ('daily', 'weekly', 'custom')), -- ✅ frequency
      daily_goal INTEGER NOT NULL,          -- ✅ daily goal
      unit TEXT NOT NULL,                   -- ✅ unit
      description TEXT,                     -- ✅ description (optional)
      reminder_enabled BOOLEAN DEFAULT FALSE, -- ✅ reminderEnabled
      reminder_time TEXT DEFAULT '09:00',   -- ✅ reminderTime
      current_streak INTEGER DEFAULT 0,
      best_streak INTEGER DEFAULT 0,
      total_completions INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Daily completions table for tracking progress
  db.exec(`
    CREATE TABLE IF NOT EXISTS habit_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER NOT NULL,
      completion_date DATE NOT NULL,
      completed_amount INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (habit_id) REFERENCES habits (id) ON DELETE CASCADE,
      UNIQUE(habit_id, completion_date)
    )
  `);

  console.log('✅ Database initialized');
};

initDb();

// Middleware
app.use(cors());
app.use(express.json());

// Prepared statements for better performance
const statements = {
  // Habits
  getAllHabits: db.prepare('SELECT * FROM habits WHERE user_id = ? ORDER BY created_at DESC'),
  getHabitById: db.prepare('SELECT * FROM habits WHERE id = ? AND user_id = ?'),
  createHabit: db.prepare(`
    INSERT INTO habits (user_id, name, icon, frequency, daily_goal, unit, description, reminder_enabled, reminder_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  updateHabit: db.prepare(`
    UPDATE habits 
    SET name = ?, icon = ?, frequency = ?, daily_goal = ?, unit = ?, description = ?, 
        reminder_enabled = ?, reminder_time = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `),
  deleteHabit: db.prepare('DELETE FROM habits WHERE id = ? AND user_id = ?'),
  updateStreaks: db.prepare(`
    UPDATE habits 
    SET current_streak = ?, best_streak = ?, total_completions = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),

  // Completions
  getCompletion: db.prepare('SELECT * FROM habit_completions WHERE habit_id = ? AND completion_date = ?'),
  addCompletion: db.prepare(`
    INSERT OR REPLACE INTO habit_completions (habit_id, completion_date, completed_amount)
    VALUES (?, ?, ?)
  `),
  getHabitCompletions: db.prepare(`
    SELECT * FROM habit_completions 
    WHERE habit_id = ? 
    ORDER BY completion_date DESC 
    LIMIT ?
  `),
  getCompletionStats: db.prepare(`
    SELECT 
      COUNT(*) as total_days,
      SUM(completed_amount) as total_completions
    FROM habit_completions 
    WHERE habit_id = ? AND completion_date >= date('now', '-30 days')
  `)
};

// Validation middleware
const habitValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Habit name must be between 1 and 100 characters'),
  
  body('icon')
    .optional()
    .isLength({ min: 1, max: 10 })
    .withMessage('Icon must be valid'),
  
  body('frequency')
    .isIn(['daily', 'weekly', 'custom'])
    .withMessage('Frequency must be daily, weekly, or custom'),
  
  body('dailyGoal')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Daily goal must be between 1 and 1000'),
  
  body('unit')
    .isLength({ min: 1, max: 50 })
    .withMessage('Unit is required'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
];

// Helper functions
const getUserId = (req) => req.headers['user-id'] || 'demo_user';

const calculateSuccessRate = (habitId) => {
  const stats = statements.getCompletionStats.get(habitId);
  if (!stats || stats.total_days === 0) return 0;
  return Math.round((stats.total_days / 30) * 100);
};

const updateHabitStreaks = (habitId) => {
  const completions = statements.getHabitCompletions.get(habitId, 30);
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;
  
  const today = new Date().toISOString().split('T')[0];
  const dates = [];
  
  // Generate last 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  // Calculate streaks
  for (const date of dates) {
    const completed = completions.some(c => c.completion_date === date);
    if (completed) {
      tempStreak++;
      if (date === today || currentStreak === 0) {
        currentStreak = tempStreak;
      }
      bestStreak = Math.max(bestStreak, tempStreak);
    } else {
      if (date === today) {
        currentStreak = 0;
      }
      tempStreak = 0;
    }
  }
  
  const totalCompletions = completions.length;
  statements.updateStreaks.run(currentStreak, bestStreak, totalCompletions, habitId);
  
  return { currentStreak, bestStreak, totalCompletions };
};

// Routes

// GET /api/habits - Get all habits
app.get('/api/habits', (req, res) => {
  try {
    const userId = getUserId(req);
    const habits = statements.getAllHabits.all(userId);
    
    // Add calculated success rates
    const habitsWithStats = habits.map(habit => ({
      ...habit,
      successRate: calculateSuccessRate(habit.id),
      reminderEnabled: Boolean(habit.reminder_enabled)
    }));
    
    res.json({
      success: true,
      data: habitsWithStats,
      count: habitsWithStats.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve habits',
      error: error.message
    });
  }
});

// POST /api/habits - Create new habit
app.post('/api/habits', habitValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  try {
    const userId = getUserId(req);
    const { name, icon, frequency, dailyGoal, unit, description, reminderEnabled, reminderTime } = req.body;
    
    const result = statements.createHabit.run(
      userId,
      name,
      icon || '⭐',
      frequency,
      dailyGoal,
      unit,
      description || '',
      reminderEnabled || false,
      reminderTime || '09:00'
    );
    
    const newHabit = statements.getHabitById.get(result.lastInsertRowid, userId);
    
    res.status(201).json({
      success: true,
      message: 'Habit created successfully',
      data: {
        ...newHabit,
        successRate: 0,
        reminderEnabled: Boolean(newHabit.reminder_enabled)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create habit',
      error: error.message
    });
  }
});

// GET /api/habits/:id - Get specific habit
app.get('/api/habits/:id', (req, res) => {
  try {
    const userId = getUserId(req);
    const habitId = parseInt(req.params.id);
    
    const habit = statements.getHabitById.get(habitId, userId);
    
    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        ...habit,
        successRate: calculateSuccessRate(habit.id),
        reminderEnabled: Boolean(habit.reminder_enabled)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve habit',
      error: error.message
    });
  }
});

// PUT /api/habits/:id - Update habit
app.put('/api/habits/:id', habitValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  try {
    const userId = getUserId(req);
    const habitId = parseInt(req.params.id);
    const { name, icon, frequency, dailyGoal, unit, description, reminderEnabled, reminderTime } = req.body;
    
    const result = statements.updateHabit.run(
      name,
      icon || '⭐',
      frequency,
      dailyGoal,
      unit,
      description || '',
      reminderEnabled || false,
      reminderTime || '09:00',
      habitId,
      userId
    );
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found'
      });
    }
    
    const updatedHabit = statements.getHabitById.get(habitId, userId);
    
    res.json({
      success: true,
      message: 'Habit updated successfully',
      data: {
        ...updatedHabit,
        successRate: calculateSuccessRate(habitId),
        reminderEnabled: Boolean(updatedHabit.reminder_enabled)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update habit',
      error: error.message
    });
  }
});

// DELETE /api/habits/:id - Delete habit
app.delete('/api/habits/:id', (req, res) => {
  try {
    const userId = getUserId(req);
    const habitId = parseInt(req.params.id);
    
    const habit = statements.getHabitById.get(habitId, userId);
    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found'
      });
    }
    
    const result = statements.deleteHabit.run(habitId, userId);
    
    res.json({
      success: true,
      message: 'Habit deleted successfully',
      data: habit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete habit',
      error: error.message
    });
  }
});

// POST /api/habits/:id/complete - Mark habit as completed
app.post('/api/habits/:id/complete', (req, res) => {
  try {
    const userId = getUserId(req);
    const habitId = parseInt(req.params.id);
    const amount = req.body.amount || 1;
    const date = req.body.date || new Date().toISOString().split('T')[0];
    
    const habit = statements.getHabitById.get(habitId, userId);
    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found'
      });
    }
    
    // Add completion
    statements.addCompletion.run(habitId, date, amount);
    
    // Update streaks
    const stats = updateHabitStreaks(habitId);
    
    const updatedHabit = statements.getHabitById.get(habitId, userId);
    
    res.json({
      success: true,
      message: 'Habit marked as completed',
      data: {
        ...updatedHabit,
        successRate: calculateSuccessRate(habitId),
        reminderEnabled: Boolean(updatedHabit.reminder_enabled)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to complete habit',
      error: error.message
    });
  }
});

// GET /api/habits/:id/stats - Get habit statistics
app.get('/api/habits/:id/stats', (req, res) => {
  try {
    const userId = getUserId(req);
    const habitId = parseInt(req.params.id);
    
    const habit = statements.getHabitById.get(habitId, userId);
    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found'
      });
    }
    
    const monthStats = statements.getCompletionStats.get(habitId);
    const recentCompletions = statements.getHabitCompletions.get(habitId, 7);
    
    const totalDays = Math.floor((new Date() - new Date(habit.created_at)) / (1000 * 60 * 60 * 24));
    
    const stats = {
      currentStreak: habit.current_streak,
      bestStreak: habit.best_streak,
      totalCompletions: habit.total_completions,
      successRate: calculateSuccessRate(habitId),
      totalDays: totalDays,
      last7Days: recentCompletions,
      monthlyStats: monthStats
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve stats',
      error: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Habit Tracker API is running',
    timestamp: new Date().toISOString(),
    database: 'SQLite (Better-SQLite3)'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Graceful shutdown
process.on('exit', () => db.close());
process.on('SIGHUP', () => process.exit(128 + 1));
process.on('SIGINT', () => process.exit(128 + 2));
process.on('SIGTERM', () => process.exit(128 + 15));

app.listen(PORT, () => {
  console.log(`🚀 Habit Tracker API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`💾 Database: SQLite (Better-SQLite3)`);
});

module.exports = app;