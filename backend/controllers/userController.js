// here the file name is not belongs to usercontroller its belongs to admincontroller 
//like here  the action is like admin uploading the video 

const pool=require('../config/db')
const multer=require('multer')
const path=require('path')

const storage=multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,'uploads/')
    },

    filename:function(req,file,cb){
        cb(null,Date.now()+path.extname(file.originalname))
    }
})
const upload=multer({storage:storage})

exports.uploadvideo=[
upload.single('video'),
async(req,res)=>{
    const {title,description,category_id}=req.body
    const filepath=req.file.path

    try{
        const result=await pool.query(
              "INSERT INTO videos (title, description, file_path, category_id) VALUES ($1, $2, $3, $4) RETURNING *",
                [title, description, file_path, category_id]
            );
        res.json({message:'video uploaded successfully',video:result.rows[0]})
    }catch(err){
        res.status(400).json({message:'err.message'})
    }
}
]
