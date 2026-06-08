import express from 'express'
// import User api/code 
import { CreateUser,UpdateUserByID,DeleteAllUsers } from '../Logic/UserLogic.js'

const BasicRoute = express.Router()

// so another thing to take note is that there are rules when it comes to using api1s 
// for example to request for data is to fetch or get it by normal http standards

// to add something in your database you use PUT
BasicRoute.put(`/createUser`,CreateUser)
BasicRoute.patch(`/UpdateUserById/:id`,UpdateUserByID)
BasicRoute.delete("/DeleteAllUsers",DeleteAllUsers)

export default BasicRoute