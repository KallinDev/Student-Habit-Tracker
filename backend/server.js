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
  db.exec(`
    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '⭐',
      frequency TEXT NOT NULL CHECK(frequency IN ('daily', 'weekly', 'custom')),
      daily_goal INTEGER NOT NULL,
      unit TEXT NOT NULL,
      description TEXT,
      reminder_enabled BOOLEAN DEFAULT FALSE,
      reminder_time TEXT DEFAULT '09:00',
      current_streak INTEGER DEFAULT 0,
      best_streak INTEGER DEFAULT 0,
      total_completions INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

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

// --- SEED DEFAULT HABITS FOR NEW USERS ---
const starterHabits = [
  {
    name: "Drink water",
    icon: "💧",
    frequency: "daily",
    daily_goal: 1,
    unit: "glass",
    description: "Stay hydrated",
    reminder_enabled: false,
    reminder_time: "09:00"
  },
  {
    name: "Read book",
    icon: "📚",
    frequency: "daily",
    daily_goal: 1,
    unit: "chapter",
    description: "Read every day",
    reminder_enabled: false,
    reminder_time: "09:00"
  },
  {
    name: "Exercise",
    icon: "🏋️‍♂️",
    frequency: "weekly",
    daily_goal: 3,
    unit: "times",
    description: "Move your body",
    reminder_enabled: false,
    reminder_time: "09:00"
  },
  {
    name: "Meditate",
    icon: "🧠",
    frequency: "daily",
    daily_goal: 1,
    unit: "session",
    description: "Mindfulness",
    reminder_enabled: false,
    reminder_time: "09:00"
  },
  {
    name: "Journal",
    icon: "📝",
    frequency: "daily",
    daily_goal: 1,
    unit: "entry",
    description: "Write your day",
    reminder_enabled: false,
    reminder_time: "09:00"
  }
];

// Helper to seed starter habits for a user if they have none
function seedStarterHabitsForUser(userId) {
  const existing = db.prepare('SELECT COUNT(*) as count FROM habits WHERE user_id = ?').get(userId);
  if (existing.count === 0) {
    const insert = db.prepare(`
      INSERT INTO habits (user_id, name, icon, frequency, daily_goal, unit, description, reminder_enabled, reminder_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const habit of starterHabits) {
      insert.run(
        userId,
        habit.name,
        habit.icon,
        habit.frequency,
        habit.daily_goal,
        habit.unit,
        habit.description,
        habit.reminder_enabled ? 1 : 0,
        habit.reminder_time
      );
    }
    console.log(`🌱 Seeded starter habits for user: ${userId}`);
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Prepared statements for better performance
const statements = {
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
const getUserId = (req) => req.headers['user-id'] || 'default_user';

// --- NEW: Calculate success rate for a habit (last N days) ---
function calculateSuccessRateForHabit(habitId, days = 21) {
  // Get completions for this habit (last N days)
  const completions = db.prepare(
    `SELECT completion_date FROM habit_completions WHERE habit_id = ? AND completion_date >= date('now', ?)`
  ).all(habitId, `-${days - 1} days`);

  // If no completions yet, success rate is 0%
  if (completions.length === 0) return 0;

  // Build date array for last N days (oldest first)
  const dates = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }

  // Find first completion date
  const sortedCompletions = completions.map(c => c.completion_date).sort();
  const firstCompletionDate = sortedCompletions[0];

  // Only consider days since first completion
  const relevantDates = dates.filter(date => date >= firstCompletionDate);
  const completedSet = new Set(completions.map(c => c.completion_date));
  const relevantCompletedDays = relevantDates.filter(date => completedSet.has(date)).length;

  // If all relevant days are completed, success rate is 100%
  if (relevantCompletedDays === relevantDates.length) return 100;

  // Otherwise, calculate actual percentage
  return Math.round((relevantCompletedDays / relevantDates.length) * 100);
}

const updateHabitStreaks = (habitId) => {
  const completions = statements.getHabitCompletions.all(habitId, 30);
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;
  
  const today = new Date().toISOString().split('T')[0];
  const dates = [];
  
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
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

// --- SEED DEFAULT HABITS ON FIRST GET ---
app.get('/api/user/habits', (req, res) => {
  try {
    const userId = getUserId(req);
    seedStarterHabitsForUser(userId); // Seed if none exist

    const habits = statements.getAllHabits.all(userId);

    res.json(
      Array.isArray(habits)
        ? habits.map(habit => ({
            ...habit,
            successRate: calculateSuccessRateForHabit(habit.id, 21),
            reminderEnabled: Boolean(habit.reminder_enabled)
          }))
        : []
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve habits',
      error: error.message
    });
  }
});

// --- GET USER STATS (activeHabits, totalDays, successRate, bestStreak, currentStreak) ---
app.get('/api/user/stats', (req, res) => {
  try {
    const userId = getUserId(req);
    const habits = statements.getAllHabits.all(userId);

    let bestStreak = 0;
    let currentStreak = 0;
    let successRates = [];

    habits.forEach(habit => {
      if (habit.best_streak > bestStreak) bestStreak = habit.best_streak;
      if (habit.current_streak > currentStreak) currentStreak = habit.current_streak;

      // Calculate success rate for each habit
      const rate = typeof habit.successRate === "number"
        ? habit.successRate
        : calculateSuccessRateForHabit(habit.id, 21);
      successRates.push(rate);
    });

    // Average success rate
    const successRate =
      successRates.length > 0
        ? Math.round(successRates.reduce((a, b) => a + b, 0) / successRates.length)
        : 0;

    // Count unique days with any completion for this user
    const uniqueDaysRow = db.prepare(`
      SELECT COUNT(DISTINCT completion_date) as count
      FROM habit_completions
      WHERE habit_id IN (
        SELECT id FROM habits WHERE user_id = ?
      )
    `).get(userId);
    const totalDays = uniqueDaysRow.count;

    res.json({
      activeHabits: habits.length,
      totalDays,
      successRate,
      bestStreak,
      currentStreak
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user stats',
      error: error.message
    });
  }
});

// --- COMPLETE HABIT FOR TODAY ---
app.post('/api/habits/:id/complete', (req, res) => {
  try {
    const userId = getUserId(req);
    const habitId = parseInt(req.params.id, 10);
    const habit = statements.getHabitById.get(habitId, userId);
    if (!habit) {
      return res.status(404).json({ success: false, message: 'Habit not found' });
    }

    // Use provided date or today
    const date = req.body.date || new Date().toISOString().split('T')[0];

    // Add completion (or update if already exists)
    statements.addCompletion.run(habitId, date, 1);

    // Update streaks
    updateHabitStreaks(habitId);

    res.json({ success: true, message: 'Habit marked as completed', date });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to complete habit',
      error: error.message
    });
  }
});

app.get('/api/user/habits/completions', (req, res) => {
  try {
    const userId = req.headers['user-id'] || 'default_user';
    const today = new Date().toISOString().split('T')[0];
    const habits = statements.getAllHabits.all(userId);
    const completions = habits.map(habit => {
      const completion = statements.getCompletion.get(habit.id, today);
      return { habitId: habit.id, completed: !!completion };
    });
    res.json(completions);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get completions', error: error.message });
  }
});

app.post('/api/habits/:id/uncomplete', (req, res) => {
  try {
    const userId = getUserId(req);
    const habitId = parseInt(req.params.id, 10);
    const habit = statements.getHabitById.get(habitId, userId);
    if (!habit) {
      return res.status(404).json({ success: false, message: 'Habit not found' });
    }
    const date = req.body.date || new Date().toISOString().split('T')[0];
    db.prepare('DELETE FROM habit_completions WHERE habit_id = ? AND completion_date = ?').run(habitId, date);
    updateHabitStreaks(habitId);
    res.json({ success: true, message: 'Habit unmarked as completed', date });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to uncomplete habit', error: error.message });
  }
});

// --- Get habit completion history for last N days ---
app.get('/api/habits/:id/history', (req, res) => {
  try {
    const userId = getUserId(req);
    const habitId = parseInt(req.params.id, 10);
    const days = parseInt(req.query.days, 10) || 21;

    // Get habit to verify ownership
    const habit = statements.getHabitById.get(habitId, userId);
    if (!habit) {
      return res.status(404).json({ success: false, message: 'Habit not found' });
    }

    // Build date array for last N days (oldest first)
    const dates = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }

    // Get completions for this habit
    const completions = db.prepare(
      `SELECT completion_date FROM habit_completions WHERE habit_id = ? AND completion_date >= date('now', ?)`
    ).all(habitId, `-${days - 1} days`);

    const completedSet = new Set(completions.map(c => c.completion_date));

    // Build history array
    const history = dates.map(date => ({
      date,
      completed: completedSet.has(date)
    }));

    res.json(history);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get habit history',
      error: error.message
    });
  }
});

app.put('/api/habits/:id', (req, res) => {
  try {
    const userId = req.headers['user-id'] || 'default_user';
    const habitId = parseInt(req.params.id, 10);
    const habit = statements.getHabitById.get(habitId, userId);
    if (!habit) {
      return res.status(404).json({ success: false, message: 'Habit not found' });
    }
    const { name, description, frequency } = req.body;
    statements.updateHabit.run(
      name,
      habit.icon,
      frequency,
      habit.daily_goal,
      habit.unit,
      description,
      habit.reminder_enabled,
      habit.reminder_time,
      habitId,
      userId
    );
    res.json({ success: true, message: 'Habit updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update habit', error: error.message });
  }
});

// --- DELETE HABIT ---
app.delete('/api/habits/:id', (req, res) => {
  try {
    const userId = req.headers['user-id'] || 'default_user';
    const habitId = parseInt(req.params.id, 10);
    const habit = statements.getHabitById.get(habitId, userId);
    if (!habit) {
      return res.status(404).json({ success: false, message: 'Habit not found' });
    }
    statements.deleteHabit.run(habitId, userId);
    res.json({ success: true, message: 'Habit deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete habit', error: error.message });
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