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

// --- MIGRATION: Ensure icon_color column exists ---
try {
  db.exec(`ALTER TABLE habits ADD COLUMN icon_color TEXT DEFAULT ''`);
} catch (e) {
  // Ignore if already exists
}

// --- MIGRATION: Ensure profile_image column exists ---
try {
  db.exec(`ALTER TABLE users ADD COLUMN profile_image TEXT DEFAULT ''`);
} catch (e) {
  // Ignore if already exists
}

// Create tables if they don't exist
const initDb = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '⭐',
      icon_color TEXT DEFAULT '',
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
      user_id TEXT NOT NULL,
      completion_date DATE NOT NULL,
      completed_amount INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (habit_id) REFERENCES habits (id) ON DELETE CASCADE,
      UNIQUE(habit_id, user_id, completion_date)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS daily_mood (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      mood TEXT,
      focus_level INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, date)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT UNIQUE NOT NULL,
      first_name TEXT,
      last_name TEXT,
      email TEXT,
      timezone TEXT,
      language TEXT,
      profile_image TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ Database initialized');
};

initDb();

// --- SEED DEFAULT HABITS FOR NEW USERS ---
const starterHabits = [
  {
    name: "Drink water",
    icon: "Droplets",
    icon_color: "text-blue-500",
    frequency: "daily",
    daily_goal: 1,
    unit: "glass",
    description: "Stay hydrated",
    reminder_enabled: false,
    reminder_time: "09:00"
  },
  {
    name: "Read book",
    icon: "Book",
    icon_color: "text-purple-500",
    frequency: "daily",
    daily_goal: 1,
    unit: "chapter",
    description: "Read every day",
    reminder_enabled: false,
    reminder_time: "09:00"
  },
  {
    name: "Exercise",
    icon: "Dumbbell",
    icon_color: "text-red-500",
    frequency: "weekly",
    daily_goal: 3,
    unit: "times",
    description: "Move your body",
    reminder_enabled: false,
    reminder_time: "09:00"
  },
  {
    name: "Meditate",
    icon: "Brain",
    icon_color: "text-green-500",
    frequency: "daily",
    daily_goal: 1,
    unit: "session",
    description: "Mindfulness",
    reminder_enabled: false,
    reminder_time: "09:00"
  },
  {
    name: "Journal",
    icon: "PenTool",
    icon_color: "text-orange-500",
    frequency: "daily",
    daily_goal: 1,
    unit: "entry",
    description: "Write your day",
    reminder_enabled: false,
    reminder_time: "09:00"
  },
  {
    name: "Eat fruit",
    icon: "Apple",
    icon_color: "text-pink-500",
    frequency: "daily",
    daily_goal: 1,
    unit: "piece",
    description: "Get your vitamins",
    reminder_enabled: false,
    reminder_time: "09:00"
  }
];

// Helper to seed starter habits for a user if they have none
function seedStarterHabitsForUser(userId) {
  const existing = db.prepare('SELECT COUNT(*) as count FROM habits WHERE user_id = ?').get(userId);
  if (existing.count === 0) {
    const insert = db.prepare(`
      INSERT INTO habits (user_id, name, icon, icon_color, frequency, daily_goal, unit, description, reminder_enabled, reminder_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const habit of starterHabits) {
      insert.run(
        userId,
        habit.name,
        habit.icon,
        habit.icon_color,
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
app.use(express.json({ limit: '2mb' }));

// Prepared statements for better performance
const statements = {
  getAllHabits: db.prepare('SELECT * FROM habits WHERE user_id = ? ORDER BY created_at DESC'),
  getHabitById: db.prepare('SELECT * FROM habits WHERE id = ? AND user_id = ?'),
  createHabit: db.prepare(`
    INSERT INTO habits (user_id, name, icon, icon_color, frequency, daily_goal, unit, description, reminder_enabled, reminder_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  updateHabit: db.prepare(`
    UPDATE habits 
    SET name = ?, icon = ?, icon_color = ?, frequency = ?, daily_goal = ?, unit = ?, description = ?, 
        reminder_enabled = ?, reminder_time = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `),
  deleteHabit: db.prepare('DELETE FROM habits WHERE id = ? AND user_id = ?'),
  updateStreaks: db.prepare(`
    UPDATE habits 
    SET current_streak = ?, best_streak = ?, total_completions = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),
  getCompletion: db.prepare('SELECT * FROM habit_completions WHERE habit_id = ? AND user_id = ? AND completion_date = ?'),
  addCompletion: db.prepare(`
    INSERT OR REPLACE INTO habit_completions (habit_id, user_id, completion_date, completed_amount)
    VALUES (?, ?, ?, ?)
  `),
  removeCompletion: db.prepare('DELETE FROM habit_completions WHERE habit_id = ? AND user_id = ? AND completion_date = ?'),
  getHabitCompletions: db.prepare(`
    SELECT * FROM habit_completions 
    WHERE habit_id = ? AND user_id = ?
    ORDER BY completion_date DESC 
    LIMIT ?
  `),
  getCompletionStats: db.prepare(`
    SELECT 
      COUNT(*) as total_days,
      SUM(completed_amount) as total_completions
    FROM habit_completions 
    WHERE habit_id = ? AND user_id = ? AND completion_date >= date('now', '-30 days')
  `)
};

// Helper functions
const getUserId = (req) => req.headers['user-id'] || 'default_user';

const formatDate = (date) => {
  if (!date) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return date;
  }
  const dateObj = new Date(date);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// --- Calculate success rate for a habit (last N days) ---
function calculateSuccessRateForHabit(habitId, userId, days = 21) {
  const completions = db.prepare(
    `SELECT completion_date FROM habit_completions WHERE habit_id = ? AND user_id = ? AND completion_date >= date('now', ?)`
  ).all(habitId, userId, `-${days - 1} days`);

  if (completions.length === 0) return 0;

  const dates = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }

  const sortedCompletions = completions.map(c => c.completion_date).sort();
  const firstCompletionDate = sortedCompletions[0];

  const relevantDates = dates.filter(date => date >= firstCompletionDate);
  const completedSet = new Set(completions.map(c => c.completion_date));
  const relevantCompletedDays = relevantDates.filter(date => completedSet.has(date)).length;

  if (relevantCompletedDays === relevantDates.length) return 100;

  return Math.round((relevantCompletedDays / relevantDates.length) * 100);
}

const updateHabitStreaks = (habitId, userId) => {
  try {
    const completions = statements.getHabitCompletions.all(habitId, userId, 365);
    let currentStreak = 0;
    let bestStreak = 0;
    const today = formatDate();
    const dates = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      dates.push(`${year}-${month}-${day}`);
    }
    const completedDates = new Set(completions.map(c => c.completion_date));
    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];
      const isCompleted = completedDates.has(date);
      if (isCompleted) {
        currentStreak++;
      } else {
        break;
      }
    }
    const sortedDates = Array.from(completedDates).sort();
    let tempStreak = 0;
    let lastDate = null;
    for (const dateStr of sortedDates) {
      const currentDate = new Date(dateStr + 'T00:00:00');
      if (lastDate) {
        const daysDiff = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      bestStreak = Math.max(bestStreak, tempStreak);
      lastDate = currentDate;
    }
    const totalCompletions = completions.length;
    statements.updateStreaks.run(currentStreak, bestStreak, totalCompletions, habitId);
    return { currentStreak, bestStreak, totalCompletions };
  } catch (error) {
    return { currentStreak: 0, bestStreak: 0, totalCompletions: 0 };
  }
};

// --- SEED DEFAULT HABITS ON FIRST GET ---
app.get('/api/user/habits', (req, res) => {
  try {
    const userId = getUserId(req);
    seedStarterHabitsForUser(userId);

    const habits = statements.getAllHabits.all(userId);

    res.json(
      Array.isArray(habits)
        ? habits.map(habit => ({
            ...habit,
            successRate: calculateSuccessRateForHabit(habit.id, userId, 21),
            reminderEnabled: Boolean(habit.reminder_enabled),
            total_completions: habit.total_completions,
            best_streak: habit.best_streak
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

// --- GET USER STATS ---
app.get('/api/user/stats', (req, res) => {
  try {
    const userId = getUserId(req);
    const habits = statements.getAllHabits.all(userId);

    let bestStreak = 0;
    let currentStreak = 0;
    let successRates = [];
    let habitsCompleted = 0;
    let bestHabit = null;
    let bestRate = 0;

    habits.forEach(habit => {
      if (habit.best_streak > bestStreak) bestStreak = habit.best_streak;
      if (habit.current_streak > currentStreak) currentStreak = habit.current_streak;

      const rate = calculateSuccessRateForHabit(habit.id, userId, 21);
      successRates.push(rate);

      habitsCompleted += habit.total_completions || 0;
      if (rate > bestRate) {
        bestRate = rate;
        bestHabit = habit;
      }
    });

    const successRate =
      successRates.length > 0
        ? Math.round(successRates.reduce((a, b) => a + b, 0) / successRates.length)
        : 0;

    const uniqueDaysRow = db.prepare(`
      SELECT COUNT(DISTINCT completion_date) as count
      FROM habit_completions
      WHERE habit_id IN (
        SELECT id FROM habits WHERE user_id = ?
      ) AND user_id = ?
    `).get(userId, userId);
    const totalDays = uniqueDaysRow.count;

    res.json({
      activeHabits: habits.length,
      totalDays,
      successRate,
      bestStreak,
      currentStreak,
      habitsCompleted,
      bestHabit: bestHabit
        ? {
            id: bestHabit.id,
            name: bestHabit.name,
            icon: bestHabit.icon,
            successRate: bestRate
          }
        : null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user stats',
      error: error.message
    });
  }
});

// --- API: Success Rate Trend for Line Chart ---
app.get('/api/user/stats/trend', (req, res) => {
  try {
    const userId = getUserId(req);
    const days = parseInt(req.query.days, 10) || 30;
    const habits = statements.getAllHabits.all(userId);

    // For each day, calculate average success rate across all habits
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      let completedCount = 0;
      habits.forEach(habit => {
        const completion = db.prepare(
          'SELECT * FROM habit_completions WHERE habit_id = ? AND user_id = ? AND completion_date = ?'
        ).get(habit.id, userId, dateStr);
        if (completion) completedCount++;
      });

      const rate =
        habits.length > 0
          ? Math.round((completedCount / habits.length) * 100)
          : 0;

      result.push({ date: dateStr, successRate: rate });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get stats trend',
      error: error.message
    });
  }
});

// --- COMPLETE HABIT FOR TODAY ---
app.post('/api/habits/:id/complete', (req, res) => {
  try {
    const userId = getUserId(req);
    const habitId = parseInt(req.params.id, 10);
    if (isNaN(habitId)) {
      return res.status(400).json({ success: false, message: 'Invalid habit ID' });
    }
    const habit = statements.getHabitById.get(habitId, userId);
    if (!habit) {
      return res.status(404).json({ success: false, message: 'Habit not found' });
    }
    const date = formatDate(req.body.date);
    const existingCompletion = statements.getCompletion.get(habitId, userId, date);
    if (existingCompletion) {
      return res.json({ success: true, message: 'Habit already completed for this date', date });
    }
    statements.addCompletion.run(habitId, userId, date, 1);
    updateHabitStreaks(habitId, userId);
    res.json({ success: true, message: 'Habit marked as completed', date });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to complete habit',
      error: error.message
    });
  }
});

// --- GET COMPLETIONS FOR TODAY ---
app.get('/api/user/habits/completions', (req, res) => {
  try {
    const userId = getUserId(req);
    const date = formatDate(req.query.date);
    const habits = statements.getAllHabits.all(userId);
    const completions = habits.map(habit => {
      const completion = statements.getCompletion.get(habit.id, userId, date);
      const isCompleted = !!completion;
      return { habitId: habit.id, completed: isCompleted };
    });
    res.json(completions);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get completions', 
      error: error.message 
    });
  }
});

// --- UNCOMPLETE HABIT FOR TODAY ---
app.post('/api/habits/:id/uncomplete', (req, res) => {
  try {
    const userId = getUserId(req);
    const habitId = parseInt(req.params.id, 10);
    if (isNaN(habitId)) {
      return res.status(400).json({ success: false, message: 'Invalid habit ID' });
    }
    const habit = statements.getHabitById.get(habitId, userId);
    if (!habit) {
      return res.status(404).json({ success: false, message: 'Habit not found' });
    }
    const date = formatDate(req.body.date);
    const existingCompletion = statements.getCompletion.get(habitId, userId, date);
    if (!existingCompletion) {
      return res.json({ success: true, message: 'Habit was not completed for this date', date });
    }
    statements.removeCompletion.run(habitId, userId, date);
    updateHabitStreaks(habitId, userId);
    res.json({ success: true, message: 'Habit unmarked as completed', date });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to uncomplete habit', 
      error: error.message 
    });
  }
});

// --- Get habit completion history for last N days ---
app.get('/api/habits/:id/history', (req, res) => {
  try {
    const userId = getUserId(req);
    const habitId = parseInt(req.params.id, 10);
    const days = parseInt(req.query.days, 10) || 21;
    const habit = statements.getHabitById.get(habitId, userId);
    if (!habit) {
      return res.status(404).json({ success: false, message: 'Habit not found' });
    }
    const dates = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    const completions = db.prepare(
      `SELECT completion_date FROM habit_completions WHERE habit_id = ? AND user_id = ? AND completion_date >= date('now', ?)`
    ).all(habitId, userId, `-${days - 1} days`);
    const completedSet = new Set(completions.map(c => c.completion_date));
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
    const userId = getUserId(req);
    const habitId = parseInt(req.params.id, 10);
    const habit = statements.getHabitById.get(habitId, userId);
    if (!habit) {
      return res.status(404).json({ success: false, message: 'Habit not found' });
    }
    const {
      name,
      icon,
      iconColor,
      frequency,
      dailyGoal,
      unit,
      description,
      reminder_enabled,
      reminder_time,
    } = req.body;

    // Convert reminder_enabled to number for SQLite
    const reminderEnabledValue =
      typeof reminder_enabled === "boolean"
        ? (reminder_enabled ? 1 : 0)
        : habit.reminder_enabled;

    statements.updateHabit.run(
      name ?? habit.name,
      icon ?? habit.icon,
      iconColor ?? habit.icon_color,
      frequency ?? habit.frequency,
      dailyGoal ?? habit.daily_goal,
      unit ?? habit.unit,
      description ?? habit.description,
      reminderEnabledValue,
      reminder_time ?? habit.reminder_time,
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
    const userId = getUserId(req);
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

app.post('/api/habits', (req, res) => {
  try {
    const userId = req.headers['user-id'] || 'default_user';
    const {
      name,
      icon,
      iconColor,
      frequency,
      dailyGoal,
      unit,
      description,
      reminder_enabled,
      reminder_time,
    } = req.body;

    if (!name || !icon || !frequency || !dailyGoal || !unit) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const insert = statements.createHabit.run(
      userId,
      name,
      icon,
      iconColor || "",
      frequency,
      dailyGoal,
      unit,
      description || "",
      reminder_enabled ? 1 : 0,
      reminder_time || "09:00"
    );

    // Return the newly created habit
    const habit = statements.getHabitById.get(insert.lastInsertRowid, userId);
    res.json({ success: true, habit });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create habit', error: error.message });
  }
});

// --- API: Save daily mood/focus ---
app.post('/api/user/mood', (req, res) => {
  try {
    const userId = getUserId(req);
    const { mood, focusLevel, date } = req.body;
    const day = formatDate(date);

    db.prepare(`
      INSERT INTO daily_mood (user_id, date, mood, focus_level, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, date) DO UPDATE SET
        mood=excluded.mood,
        focus_level=excluded.focus_level,
        updated_at=CURRENT_TIMESTAMP
    `).run(userId, day, mood, focusLevel);

    res.json({ success: true, message: "Mood/focus saved", date: day });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to save mood/focus", error: error.message });
  }
});

// --- API: Get daily mood/focus for a date ---
app.get('/api/user/mood', (req, res) => {
  try {
    const userId = getUserId(req);
    const day = formatDate(req.query.date);
    const row = db.prepare(
      "SELECT mood, focus_level FROM daily_mood WHERE user_id = ? AND date = ?"
    ).get(userId, day);
    res.json(row || {});
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get mood/focus", error: error.message });
  }
});

// --- API: Get mood/focus history (last N days) ---
app.get('/api/user/mood/history', (req, res) => {
  try {
    const userId = getUserId(req);
    const days = parseInt(req.query.days, 10) || 21;
    const rows = db.prepare(
      `SELECT date, mood, focus_level FROM daily_mood WHERE user_id = ? AND date >= date('now', ?)`
    ).all(userId, `-${days - 1} days`);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get mood/focus history", error: error.message });
  }
});

// --- GET USER PROFILE ---
app.get('/api/user/profile', (req, res) => {
  const userId = getUserId(req);
  const user = db.prepare('SELECT * FROM users WHERE user_id = ?').get(userId);
  if (!user) {
    // Create default user if not exists
    db.prepare(`
      INSERT INTO users (user_id, first_name, last_name, email, timezone, language, profile_image)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, "Student", "User", `${userId}@example.com`, "Europe/Stockholm", "English", "");
    // Get the newly created user to fetch created_at
    const newUser = db.prepare('SELECT * FROM users WHERE user_id = ?').get(userId);
    return res.json({
      firstName: "Student",
      lastName: "User",
      email: `${userId}@example.com`,
      timezone: "Europe/Stockholm",
      language: "English",
      profileImage: "",
      memberSince: newUser.created_at // <-- Add this
    });
  }
  res.json({
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    timezone: user.timezone,
    language: user.language,
    profileImage: user.profile_image || "",
    memberSince: user.created_at // <-- Add this
  });
});

// --- UPDATE USER PROFILE ---
app.put('/api/user/profile', (req, res) => {
  const userId = getUserId(req);
  const { firstName, lastName, email, timezone, language, profileImage } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE user_id = ?').get(userId);

  if (!user) {
    db.prepare(`
      INSERT INTO users (user_id, first_name, last_name, email, timezone, language, profile_image)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, firstName, lastName, email, timezone, language, profileImage || "");
  } else {
    db.prepare(`
      UPDATE users SET
        first_name = ?,
        last_name = ?,
        email = ?,
        timezone = ?,
        language = ?,
        profile_image = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(firstName, lastName, email, timezone, language, profileImage || "", userId);
  }
  res.json({ success: true, message: "Profile updated" });
});

// --- DELETE USER ACCOUNT ---
app.delete('/api/user/delete', (req, res) => {
  const userId = getUserId(req);
  db.prepare('DELETE FROM users WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM habits WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM habit_completions WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM daily_mood WHERE user_id = ?').run(userId);
  res.json({ success: true, message: "Account deleted" });
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

// Debug endpoint to check database contents
app.get('/api/debug/completions', (req, res) => {
  try {
    const userId = getUserId(req);
    const allCompletions = db.prepare('SELECT * FROM habit_completions WHERE user_id = ? ORDER BY completion_date DESC LIMIT 20').all(userId);
    const allHabits = statements.getAllHabits.all(userId);
    res.json({
      habits: allHabits.map(h => ({ id: h.id, name: h.name })),
      completions: allCompletions,
      todayFormatted: formatDate(),
      userId: userId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling
app.use((err, req, res, next) => {
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