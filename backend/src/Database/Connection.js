import mongoose, { mongo } from "mongoose";

function DatabaseCon(){
    // connection string goes here
    mongoose.connection()
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