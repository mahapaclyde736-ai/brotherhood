import express, { json } from 'express'
// Cors this allows are frontend to make api calls without getting flagged 
import cors from 'cors'

import Connection from './Database/Connection.js'

// importing route controller
// think of this as our Api`s basically 
import BasicRoute from './Routes/RouteController.js'

const server = express()
const port = 1111

server.use(json())
// testing if our api works 
server.use("api/",BasicRoute)

server.listen(port,()=>{
    Connection()
    console.log(`server is running on http//:localhost/${port}`)
})