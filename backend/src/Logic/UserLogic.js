// import user model/schema 
// we call this function so that it acts as a template of sorts

import HashPassword from "../Authentication/EncryptPassword.js"
import UsersModel from "../Models/Schema.js"


// when working with databases dont make an odinary functiuon use a asyncronas function because your function waits for a response from the database which doesnt take that much time depeding on the content of the databse and the quality of codr
async function  CreateUser(req,res) {
    const UserDetails = req.body
    const plainTextPassword = req.body.password

    if(!UserDetails){
        return  res.status(500).json({
            error:"invalid  and or empty user details"
        })
    }
    else{
        const hashed_password = await HashPassword(plainTextPassword)
        const User =  await UsersModel.create({...UserDetails,password:hashed_password})

        if(!User){
            return res.status(400).json(
                {message:"i couldnt make it bro"}
            )
        }
        else{
            return res.status(200).json(
                {message:"user created successfully"}
            )
        }
    }

}

async function UpdateUserByID(req,res){
    try{
        const UserId = req.params.id
        console.log(UserId)
        const UserDetails =  await UsersModel.findById({_id:UserId})
        if(!UserDetails){
            return res.status(404).json({
                message:"user does not exist"
            })
        }
        else{
            const updates = UsersModel.UpdateUserByID({_id:UserId,UserDetails})
        }
    }
    catch(err){
        res.status(500).json({
            message:"it didnt work",
            error: err
        })
    }
}


async function DeleteUserById() {
    
}

async function DeleteAllUsers(req,res){
    try{
        await UsersModel.deleteMany()
        return res.status(200).json({
            message:"all users deleted successfully"
        })
    }
    catch(err){
        return res.status(500).json({
            error:"failed to delete users"
        })
    }
}


export {CreateUser,UpdateUserByID,DeleteAllUsers}