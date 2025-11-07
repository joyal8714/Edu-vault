// videoAccessMiddleware.js
import pool from '../config/db.js';

export const hasAccessToStream = async (req, res, next) => {
  const userId = req.user.id;

  const result = await pool.query(
    "SELECT * FROM user_videos WHERE user_id = $1",
    [userId]
  );

  if (result.rows.length > 0) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied to this stream' });
  }
};

