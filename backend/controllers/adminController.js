// backend/controllers/adminController.js

import pool from '../config/db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
// Setup multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Upload video controller
export const uploadVideo = [
  upload.single('video'),
  async (req, res) => {
    const { title, description} = req.body;
    const file_path = `uploads/${req.file.filename}`;

    try {
      const result = await pool.query(
        "INSERT INTO videos (title, description, file_path) VALUES ($1, $2, $3) RETURNING *",
        [title, description, file_path, ]
      );
      res.json({ message: 'Video uploaded successfully', video: result.rows[0] });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
];

// Grant access controller
export const grantAccess = async (req, res) => {
  const { user_id, video_id } = req.body;
  try {
    await pool.query(
      "INSERT INTO user_videos (user_id, video_id) VALUES ($1, $2)",
      [user_id, video_id]
    );
    res.json({ message: 'Access granted successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
// Get all uploaded videos
export const getAllVideos = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM videos ORDER BY id DESC");
    res.json({ videos: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching videos' });
  }
};


// Delete video by ID
export const deleteVideo = async (req, res) => {
  const { id } = req.params;

  try {
    // 1️ Delete any user access records first
    await pool.query("DELETE FROM user_videos WHERE video_id = $1", [id]);

    // 2️Get the video file path before deleting video record
    const result = await pool.query("SELECT file_path FROM videos WHERE id=$1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const filePath = result.rows[0].file_path;

    // 3️ Delete the video record
    await pool.query("DELETE FROM videos WHERE id=$1", [id]);

    // 4️ Delete the file from uploads folder
    fs.unlink(filePath, (err) => {
      if (err) console.warn('Could not delete file:', err.message);
    });

    res.json({ message: 'Video deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting video:', err);
    res.status(500).json({ message: err.message });
  }
};



export const getAllUsers = async (req, res) => {
  try {
    // Only get users where role is 'user'
    const result = await pool.query("SELECT id, name, email FROM users WHERE role = 'user'");
    res.json({ users: result.rows });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

// Remove access controller
export const removeAccess = async (req, res) => {
  const { user_id, video_id } = req.body;
  try {
    const result = await pool.query(
      "DELETE FROM user_videos WHERE user_id = $1 AND video_id = $2",
      [user_id, video_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'No access found for this user and video.' });
    }

    res.json({ message: 'Access removed successfully' });
  } catch (err) {
    console.error('Error removing access:', err);
    res.status(500).json({ message: 'Server error while removing access' });
  }
};
