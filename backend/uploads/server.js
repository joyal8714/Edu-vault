require ('dotenv').config()
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const app = express()

app.use(cors())
app.use(bodyParser.json())
app.use('/uploads',express.static('uploads'))


const authRoutes=require('./routes/authRoutes')
const videoRoutes=require('./routes/videoRoutes')
const adminRoutes=require('./routes/adminRoutes')


app.use('/api/auth',authRoutes)
app.use('/api/videos',videoRoutes)
app.use('/api/admin',adminRoutes)


const PORT = process.env.PORT || 3000
app.listen(PORT,()=>{
    console.log(`server is running on port ${PORT}`)
})

