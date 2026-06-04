// import user model/schema 
// we call this function so that it acts as a template of sorts

import HashPassword from "../Authentication/EncryptPassword.js"
import UsersModel from "../Models/Schema.js"


// when working with databases dont make an odinary functiuon use a asyncronas function because your function waits for a response from the database which doesnt take that much time depeding on the content of the databse and the quality of codr
async function  CreateUser(req,res) {
    const UserDetails = req.body
    const plainTextPassword =  req.body.password

    if(!UserDetails){
        return  res.status(500).json({
            error:"invalid  and or empty user details"
        })
    }
    else{
        const hashedPassword = await HashPassword(plainTextPassword)
        console.log(hashedPassword)
        
    }

}


export {CreateUser}