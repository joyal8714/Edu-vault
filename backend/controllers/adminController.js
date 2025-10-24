// backend/controllers/adminController.js

import pool from '../config/db.js';
import multer from 'multer';
import path from 'path';

// Setup multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
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
    const { title, description, category_id } = req.body;
    const file_path = req.file.path;

    try {
      const result = await pool.query(
        "INSERT INTO videos (title, description, file_path, category_id) VALUES ($1, $2, $3, $4) RETURNING *",
        [title, description, file_path, category_id]
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
