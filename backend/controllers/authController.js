// backend/controllers/authController.js (Final Definitive Version)

import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// --- Register User ---
export const register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    // Always register new users with the 'user' role
    const result = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'user') RETURNING id, name, email",
      [name, email, hashedPassword]
    );
    res.status(201).json({ message: 'User registered successfully', user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') { // Unique constraint violation
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
    
    // **THE FIX:** Check if a user was found.
    if (result.rows.length === 0) {
      // If no user is found, it's invalid credentials. Do not proceed.
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0]; // Now it's safe to get the user

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