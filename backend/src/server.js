import express from 'express'
// Cors this allows are frontend to make api calls without getting flagged 
import cors from 'cors'

// importing route controller
// think of this as our Api`s basically 
import BasicRoute from './Routes/RouteController.js'

const server = express()
const port = 1111

// testing if our api works 


server.listen(port,()=>{
    console.log(`server is running on http//:localhost/${port}`)
})