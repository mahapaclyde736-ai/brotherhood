import bcrypt from 'bcrypt'

async function HashPassword(password){
    const HashedPassword = await bcrypt.hash(password,10)
    console.log("calling hash")
    return HashPassword
}

export default HashPassword