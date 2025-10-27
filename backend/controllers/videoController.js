// backend/controllers/videoController.js
import pool from '../config/db.js';

export const getVideosByUser = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT v.id, v.title, v.description, v.file_path
       FROM videos v
       INNER JOIN user_videos uv ON uv.video_id = v.id
       WHERE uv.user_id = $1`,
      [userId]
    );

    // Return videos properly
    res.json({ videos: result.rows });
  } catch (err) {
    console.error('❌ Error fetching videos:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
