// backend/controllers/videoController.js
import pool from '../config/db.js';

// Get all videos for a specific user
export const getVideosByUser = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT v.id, v.title, v.description, v.file_path, c.name AS category
       FROM videos v
       JOIN user_videos uv ON uv.video_id = v.id
       JOIN categories c ON v.category_id = c.id
       WHERE uv.user_id = $1`,
      [userId]
    );

    res.json({ videos: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
