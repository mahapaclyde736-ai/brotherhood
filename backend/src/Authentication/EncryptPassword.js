import bcrypt from 'bcrypt'

async function HashPassword(password){
    const HashedPassword = await bcrypt.hash(password,10)
    return HashPassword
}

export default HashPassword