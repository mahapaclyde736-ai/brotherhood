// import user model/schema 
// we call this function so that it acts as a template of sorts

import UsersModel from "../Models/Schema.js"

// when working with databases dont make an odinary functiuon use a asyncronas function because your function waits for a response from the database which doesnt take that much time depeding on the content of the databse and the quality of codr
async function  CreateUser(req,res) {
    console.log("my job is to make users")
}


export {CreateUser}