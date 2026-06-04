import mongoose, { mongo } from "mongoose";

function DatabaseCon(){
    // connection string goes here
    mongoose.connect("mongodb://127.0.0.1:27017/Clockin")
    console.log("database connected successfully")
}

function Connection(){
    try{
      return  DatabaseCon()
}
catch(error){
     return  console.log(error,"database connection failed something went wrong")
}

}

export default Connection