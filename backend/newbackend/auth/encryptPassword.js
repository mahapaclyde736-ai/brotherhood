import bcrypt from 'bcryptjs'
import process from 'node:process'

const DEFAULT_ROUNDS = 12

export default async function HashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string')
  }

  const rounds = Number(process.env.BCRYPT_ROUNDS) || DEFAULT_ROUNDS
  const hashedPassword = await bcrypt.hash(password, rounds)
  return hashedPassword
}

export async function verifyPassword(plain, hash) {
  if (!plain || !hash) return false
  return await bcrypt.compare(plain, hash)
}
