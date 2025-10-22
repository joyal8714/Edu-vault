const pool = require('../config/db')
const bcrypt = require('bc  rypt')
const jwt = require('jsonwebtoken')


// user registration 
exports.register = async(req,res)=>{
    const {username,email,password}=req.body
    const hashedpassword=await bcrypt.hash(password,10)
}

try{
    const newUser=await pool.qurey(
    "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *",
   [username,email,hashedpassword]
    )

    res.status(202).json({message:'user registered successfully',user:newUser.rows[0]})
   
}catch(err){
    res.status(500).json({messsage:'server error'})
}



// user loginnn

exports.login=async(req,res)=>{
    const {email,password}=req.body
    try{
        const user=await pool.query('select * from users where email=$1',[email])
        if(!user.rows.length) return res.status(400).json({messsage:'invalid email andd pass'})
            const validpass=await bcrypt.compare(password,user.rows[0].password)
if(!validpass)return res.status(400).json({message:'invalid password'})
if(!user.rows[0].is_active)return res.status(400).json({message:'permission is not granted'})
const token =jwt.sign({id:user.rows[0].id,role:user.rows[0].role}, proceess.env.JWT_SECRET,{expiresIN:'1d'})
res.json({token})        
}catch(err){
    res.status(500).json({message:'server error'})
}

}