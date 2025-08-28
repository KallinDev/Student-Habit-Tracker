const express = require('express');
const Database = require('better-sqlite3');
const { body, validationResult } = require('express-validator');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const dbPath = path.join(__dirname, 'habits.db');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// Use environment variable for allowed frontend origin
const allowedOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

// CORS setup: allow credentials and use env variable for origin
app.use(cors({
  origin: allowedOrigin,
  credentials: true
}));

// Initialize SQLite database
const db = new Database(dbPath);

// --- MIGRATION: Ensure icon_color column exists ---
try {
  db.exec(`ALTER TABLE habits ADD COLUMN icon_color TEXT DEFAULT ''`);
} catch (e) {}

// --- MIGRATION: Ensure profile_image column exists ---
try {
  db.exec(`ALTER TABLE users ADD COLUMN profile_image TEXT DEFAULT ''`);
} catch (e) {}

// --- MIGRATION: Ensure user_auth table exists ---
try {
  db.exec(`CREATE TABLE IF NOT EXISTS user_auth (
    user_id TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL
  )`);
} catch (e) {}

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
app.use(express.json({ limit: '2mb' }));

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

// --- Calculate streak for a habit ---
function calculateHabitStreak(habitId, userId) {
  // Get all completion dates for this habit, descending
  const dates = db.prepare(`
    SELECT completion_date FROM habit_completions
    WHERE habit_id = ? AND user_id = ?
    ORDER BY completion_date DESC
  `).all(habitId, userId).map(row => row.completion_date);

  if (dates.length === 0) return { current: 0, best: 0 };

  // Calculate current streak
  let streak = 0;
  let prev = new Date(dates[0]);
  prev.setHours(0,0,0,0);

  for (const dateStr of dates) {
    const d = new Date(dateStr);
    d.setHours(0,0,0,0);
    const diff = (prev - d) / (1000 * 60 * 60 * 24);
    if (streak === 0 && diff > 1) break;
    if (streak > 0 && diff !== 1) break;
    streak++;
    prev = d;
  }

  // Calculate best streak
  let bestStreak = 0;
  let tempStreak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i - 1]);
    const currDate = new Date(dates[i]);
    prevDate.setHours(0,0,0,0);
    currDate.setHours(0,0,0,0);
    const diff = (prevDate - currDate) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      tempStreak++;
    } else {
      if (tempStreak > bestStreak) bestStreak = tempStreak;
      tempStreak = 1;
    }
  }
  if (tempStreak > bestStreak) bestStreak = tempStreak;

  return { current: streak, best: bestStreak };
}

// --- Calculate current streak for a user ---
function calculateCurrentStreak(userId) {
  const dates = db.prepare(`
    SELECT DISTINCT completion_date FROM habit_completions
    WHERE user_id = ?
    ORDER BY completion_date DESC
  `).all(userId).map(row => row.completion_date);

  if (dates.length === 0) return 0;

  let streak = 0;
  let prev = new Date();
  prev.setHours(0,0,0,0);

  for (const dateStr of dates) {
    const date = new Date(dateStr);
    date.setHours(0,0,0,0);
    if (streak === 0) {
      const diff = (prev - date) / (1000 * 60 * 60 * 24);
      if (diff > 1) break;
    } else {
      const diff = (prev - date) / (1000 * 60 * 60 * 24);
      if (diff !== 1) break;
    }
    streak++;
    prev = date;
  }
  return streak;
}

// --- GET USER STATS (FIXED) ---
app.get('/api/user/stats', (req, res) => {
  const userId = req.headers['user-id'] || 'default_user';
  const period = 30; // last 30 days

  // Get habits
  const habitsArr = db.prepare('SELECT * FROM habits WHERE user_id = ?').all(userId);
  const habitCount = habitsArr.length;

  // Calculate possible completions based on habit age (max 30 days)
  let possibleCompletions = 0;
  const today = new Date();
  habitsArr.forEach(habit => {
    const created = new Date(habit.created_at);
    created.setHours(0,0,0,0);
    const daysActive = Math.min(
      Math.floor((today - created) / (1000 * 60 * 60 * 24)) + 1,
      period
    );
    possibleCompletions += daysActive;
  });

  // Total completions in last 30 days
  const completions = db.prepare(
    "SELECT COUNT(*) as count FROM habit_completions WHERE user_id = ? AND completion_date >= date('now', '-29 days')"
  ).get(userId).count;

  // Success rate
  const successRate =
    possibleCompletions > 0
      ? Math.round((completions / possibleCompletions) * 100)
      : 0;

  // Best streak (max best_streak from habits)
  const bestStreakRow = db.prepare('SELECT MAX(best_streak) as maxStreak FROM habits WHERE user_id = ?').get(userId);
  const bestStreak = bestStreakRow && bestStreakRow.maxStreak ? bestStreakRow.maxStreak : 0;
  // Current streak (calculated)
  const currentStreak = calculateCurrentStreak(userId);

  res.json({
    activeHabits: habitCount,
    totalDays: period,
    successRate,
    bestStreak,
    currentStreak,
  });
});

app.put('/api/habits/:habitId', (req, res) => {
  const userId = req.headers['user-id'] || 'default_user';
  const habitId = Number(req.params.habitId);
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

  try {
    db.prepare(`
      UPDATE habits SET
        name = ?,
        icon = ?,
        icon_color = ?,
        frequency = ?,
        daily_goal = ?,
        unit = ?,
        description = ?,
        reminder_enabled = ?,
        reminder_time = ?,
        updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(
      name,
      icon,
      iconColor,
      frequency,
      dailyGoal,
      unit,
      description,
      reminder_enabled ? 1 : 0,
      reminder_time,
      habitId,
      userId
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update habit" });
  }
});

app.post('/api/habits', (req, res) => {
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

  if (!name || !icon || !iconColor || !frequency || !dailyGoal || !unit) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO habits (
        user_id, name, icon, icon_color, frequency, daily_goal, unit, description,
        reminder_enabled, reminder_time, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    stmt.run(
      userId,
      name,
      icon,
      iconColor,
      frequency,
      dailyGoal,
      unit,
      description || "",
      reminder_enabled ? 1 : 0,
      reminder_time || "09:00"
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to create habit" });
  }
});

app.delete('/api/habits/:habitId', (req, res) => {
  const userId = req.headers['user-id'] || 'default_user';
  const habitId = Number(req.params.habitId);

  try {
    // Delete completions for this habit
    db.prepare('DELETE FROM habit_completions WHERE habit_id = ? AND user_id = ?').run(habitId, userId);
    // Delete the habit itself
    db.prepare('DELETE FROM habits WHERE id = ? AND user_id = ?').run(habitId, userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete habit" });
  }
});

// --- GET USER HABITS (FIXED) ---
app.get('/api/user/habits', (req, res) => {
  const userId = req.headers['user-id'];
  if (!userId) return res.status(401).json({ error: "Missing user ID" });
  const habits = db.prepare('SELECT * FROM habits WHERE user_id = ? ORDER BY created_at DESC').all(userId);

  // For each habit, calculate stats
  const habitsWithStats = habits.map(habit => {
    // Total completions (last 30 days)
    const total_completions = db.prepare(
      "SELECT COUNT(*) as count FROM habit_completions WHERE habit_id = ? AND user_id = ? AND completion_date >= date('now', '-29 days')"
    ).get(habit.id, userId).count;

    // Best streak
    const best_streak = habit.best_streak || 0;

    // Success rate (last 30 days)
    let possible = 30;
    if (habit.frequency === "weekly") possible = 4 * habit.daily_goal;
    if (habit.frequency === "custom") possible = 30 * habit.daily_goal;
    const successRate = possible > 0 ? Math.round((total_completions / possible) * 100) : 0;

    return {
      ...habit,
      total_completions,
      best_streak,
      successRate,
    };
  });

  res.json(habitsWithStats);
});

// --- GET USER STATS TREND ---
app.get('/api/user/stats/trend', (req, res) => {
  const userId = req.headers['user-id'] || 'default_user';
  const days = Number(req.query.days) || 30;

  // Get last N days
  const today = new Date();
  const dates = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }

  // For each date, calculate success rate (completed habits / possible completions * 100)
  const habits = db.prepare('SELECT id FROM habits WHERE user_id = ?').all(userId);
  const habitCount = habits.length;

  const trend = dates.map(date => {
    let completed = 0;
    habits.forEach(habit => {
      const row = db.prepare(
        'SELECT 1 FROM habit_completions WHERE habit_id = ? AND user_id = ? AND completion_date = ?'
      ).get(habit.id, userId, date);
      if (row) completed++;
    });
    const possible = habitCount; // 1 completion per habit per day
    return {
      date,
      successRate: possible > 0 ? Math.round((completed / possible) * 100) : 0,
    };
  });

  res.json(trend);
});

// Get all habit completions for a user on a specific date
app.get('/api/user/habits/completions', (req, res) => {
  const userId = req.headers['user-id'];
  if (!userId) return res.status(401).json({ error: "Missing user ID" });
  const date = req.query.date;
  if (!date) return res.status(400).json({ error: "Missing date" });

  // Only include habits created on or before the requested date
  const habits = db.prepare('SELECT * FROM habits WHERE user_id = ? AND date(created_at) <= date(?)').all(userId, date);
  const completions = db.prepare(
    "SELECT habit_id FROM habit_completions WHERE user_id = ? AND completion_date = ?"
  ).all(userId, date);

  const completedIds = completions.map(c => c.habit_id);

  const result = habits.map(habit => ({
    habitId: habit.id,
    completed: completedIds.includes(habit.id),
  }));

  res.json(result);
});

app.patch('/api/user/profile', (req, res) => {
  const userId = req.headers['user-id'] || 'default_user';
  const {
    firstName,
    lastName,
    email,
    timezone,
    language,
    profileImage,
  } = req.body;

  try {
    db.prepare(`
      UPDATE users SET
        first_name = ?,
        last_name = ?,
        email = ?,
        timezone = ?,
        language = ?,
        profile_image = ?,
        updated_at = datetime('now')
      WHERE user_id = ?
    `).run(
      firstName,
      lastName,
      email,
      timezone,
      language,
      profileImage || "",
      userId
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Get mood/focus for a user on a specific date
app.get('/api/user/mood', (req, res) => {
  const userId = req.headers['user-id'] || 'default_user';
  const date = req.query.date;
  if (!date) return res.status(400).json({ error: "Missing date" });
  const row = db.prepare(
    "SELECT mood, focus_level FROM daily_mood WHERE user_id = ? AND date = ?"
  ).get(userId, date);
  if (!row) return res.json({});
  res.json(row);
});

// Save mood/focus for a user on a specific date
app.post('/api/user/mood', (req, res) => {
  const userId = req.headers['user-id'] || 'default_user';
  const { mood, focusLevel, date } = req.body;
  if (!date) return res.status(400).json({ error: "Missing date" });

  db.prepare(`
    INSERT INTO daily_mood (user_id, date, mood, focus_level, created_at, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    ON CONFLICT(user_id, date) DO UPDATE SET mood=excluded.mood, focus_level=excluded.focus_level, updated_at=datetime('now')
  `).run(userId, date, mood, focusLevel);

  res.json({ success: true });
});

// Mark habit as completed for a date (with streak update)
app.post('/api/habits/:habitId/complete', (req, res) => {
  const userId = req.headers['user-id'];
  if (!userId) return res.status(401).json({ error: "Missing user ID" });
  const habitId = Number(req.params.habitId);
  const { date } = req.body;
  if (!date) return res.status(400).json({ error: "Missing date" });

  try {
    db.prepare(`
      INSERT OR IGNORE INTO habit_completions (habit_id, user_id, completion_date, completed_amount)
      VALUES (?, ?, ?, 1)
    `).run(habitId, userId, date);

    // --- Update streaks ---
    const streaks = calculateHabitStreak(habitId, userId);

    db.prepare(`
      UPDATE habits SET current_streak = ?, best_streak = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(streaks.current, streaks.best, habitId);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to complete habit" });
  }
});

// Unmark habit as completed for a date (with streak update)
app.post('/api/habits/:habitId/uncomplete', (req, res) => {
  const userId = req.headers['user-id'];
  if (!userId) return res.status(401).json({ error: "Missing user ID" });
  const habitId = Number(req.params.habitId);
  const { date } = req.body;
  if (!date) return res.status(400).json({ error: "Missing date" });

  try {
    db.prepare(`
      DELETE FROM habit_completions WHERE habit_id = ? AND user_id = ? AND completion_date = ?
    `).run(habitId, userId, date);

    // --- Update streaks ---
    const streaks = calculateHabitStreak(habitId, userId);

    db.prepare(`
      UPDATE habits SET current_streak = ?, best_streak = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(streaks.current, streaks.best, habitId);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to uncomplete habit" });
  }
});

// Get user profile (stub)
app.get('/api/user/profile', (req, res) => {
  const userId = req.headers['user-id'] || 'default_user';
  const row = db.prepare('SELECT * FROM users WHERE user_id = ?').get(userId);
  if (!row) return res.status(404).json({});
  // Map DB fields to camelCase for frontend compatibility
  res.json({
    userId: row.user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    timezone: row.timezone,
    language: row.language,
    profileImage: row.profile_image,
    memberSince: row.created_at,
    updatedAt: row.updated_at,
  });
});

// --- DELETE USER ACCOUNT ---
app.delete('/api/user/delete', (req, res) => {
  const userId = req.headers['user-id'];
  if (!userId) return res.status(401).json({ error: "Missing user ID" });

  try {
    // Delete all habit completions for user
    db.prepare('DELETE FROM habit_completions WHERE user_id = ?').run(userId);
    // Delete all habits for user
    db.prepare('DELETE FROM habits WHERE user_id = ?').run(userId);
    // Delete all moods for user
    db.prepare('DELETE FROM daily_mood WHERE user_id = ?').run(userId);
    // Delete user from user_auth
    db.prepare('DELETE FROM user_auth WHERE user_id = ?').run(userId);
    // Delete user from users
    db.prepare('DELETE FROM users WHERE user_id = ?').run(userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user account" });
  }
});

// --- REGISTER ENDPOINT ---
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // Split name into first and last name
  let firstName = name;
  let lastName = "";
  if (name.includes(" ")) {
    const parts = name.split(" ");
    firstName = parts[0];
    lastName = parts.slice(1).join(" ");
  }

  // Check if user already exists
  const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ message: "Email already registered" });
  }

  // Generate userId
  const userId = `user_${Date.now()}_${Math.floor(Math.random()*10000)}`;

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Insert into user_auth
  db.prepare('INSERT INTO user_auth (user_id, password_hash) VALUES (?, ?)').run(userId, passwordHash);

  // Insert into users
  db.prepare(`
    INSERT INTO users (user_id, first_name, last_name, email, timezone, language, profile_image, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, '', datetime('now'), datetime('now'))
  `).run(
    userId,
    firstName,
    lastName,
    email,
    "Europe/Stockholm",
    "English"
  );

  // Seed starter habits
  seedStarterHabitsForUser(userId);

  // Create JWT token
  const token = jwt.sign({ userId, email }, process.env.JWT_SECRET || "dev_secret", { expiresIn: "7d" });

  res.json({ token, userId });
});

// --- LOGIN ENDPOINT ---
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Missing email or password" });
  }
  // Find user by email
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  // Get password hash
  const auth = db.prepare('SELECT password_hash FROM user_auth WHERE user_id = ?').get(user.user_id);
  if (!auth) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  // Check password
  const valid = await bcrypt.compare(password, auth.password_hash);
  if (!valid) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  // Create JWT token
  const token = jwt.sign({ userId: user.user_id, email: user.email }, process.env.JWT_SECRET || "dev_secret", { expiresIn: "7d" });
  res.json({ token, userId: user.user_id });
});

app.listen(PORT, () => {
  console.log(`🚀 Habit Tracker API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`💾 Database: SQLite (Better-SQLite3)`);
});

module.exports = app;