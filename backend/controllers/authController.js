// backend/controllers/authController.js (Final Production-Ready Version)

import pool from '../config/db.js';
import bcrypt from 'bcryptjs'; // **THE FIX: Using 'bcryptjs'**
import jwt from 'jsonwebtoken';

// --- Register User ---
export const register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const result = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'user') RETURNING id",
      [name, email, hashedPassword]
    );
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    if (err.code === '23505') {
        return res.status(400).json({ message: 'User with this email already exists.' });
    }
    console.error("Registration Server Error:", err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

// --- Login User ---
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = { id: user.id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ 
      token: token,
      role: user.role 
    });
  } catch (err) {
    console.error("Login Server Error:", err);
    res.status(500).json({ message: 'Server error during login.' });
  }
};