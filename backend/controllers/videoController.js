const pool = require('../config/db')

exports .getvideosByUser=async(req,res)=>{
    try {
        const videos = await pool.query(
                `select v.id,v.title,v.filepath,v.description,c.name as category from videos v
                join users_videos uv on uv.video_id=v.id
                join categories c on v.category_id=c.id
                where uv.user_id=$1`,
                [req.user.id]
        )
    res.json(videos.rows)
    
    
    } catch(err){
        res.status(500).json({message:err.message})
    }


}