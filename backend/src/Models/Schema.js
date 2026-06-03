import mongoose, { mongo } from 'mongoose'

// user model which all created users will follow 
const UserSchema = new mongoose.Schema(
    {
        name: {type:String,required:true},
        surename : {type:String, required:true},
        password :{type:String,required:true}
    }
)

const UsersModel =  mongoose.model('User',UserSchema)

export default UsersModel