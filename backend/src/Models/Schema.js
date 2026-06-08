import mongoose, { mongo } from 'mongoose'

// user model which all created users will follow 
const UserSchema = new mongoose.Schema(
    {
        name: {type:String,required:true},
        surname : {type:String, required:true},                              
        role:{type:String,requored:true},
        department:{type:String,required:true},
        password :{type:String,required:true}
    },{
        timestamps:true
    }
)

const UsersModel =  mongoose.model('ClockIn/Users',UserSchema)

export default UsersModel