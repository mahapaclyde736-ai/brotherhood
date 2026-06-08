import bcrypt from 'bcrypt'

function HashPassword(password){
    const HashedPassword = bcrypt.hash(password,10)
    console.log("hasg function running")
    return HashedPassword
}

export default HashPassword