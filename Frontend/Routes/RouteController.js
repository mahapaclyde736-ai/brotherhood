import express from 'express'
import UsersModel from '../Models/User.js'
import HashPassword from '../Authentication/EncryptPassword.js'

const router = express.Router()

router.post('/users', CreateUser)
router.put('/users/:id', UpdateUserByID)
router.delete('/users/:id', DeleteUserById)
router.delete('/users', DeleteAllUsers)

async function CreateUser(req, res) {
  const userDetails = req.body
  if (!userDetails || Object.keys(userDetails).length === 0) {
    return res.status(400).json({ error: 'User details are required.' })
  }

  const { password, email } = userDetails
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' })
  }

  try {
    const hashedPassword = await HashPassword(password)
    const user = await UsersModel.create({ ...userDetails, password: hashedPassword })

    return res.status(201).json({ message: 'User created successfully', userId: user._id })
  } catch (err) {
    if (err.code === 11000 || err.codeName === 'DuplicateKey') {
      return res.status(409).json({ error: 'Email already exists.' })
    }

    return res.status(500).json({ error: 'Failed to create user.', details: err.message })
  }
}

async function UpdateUserByID(req, res) {
  const userId = req.params.id
  const updates = req.body

  if (!updates || Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No update data provided.' })
  }

  try {
    const user = await UsersModel.findById(userId).exec()
    if (!user) {
      return res.status(404).json({ message: 'User does not exist.' })
    }

    if (updates.password) {
      updates.password = await HashPassword(updates.password)
    }

    delete updates._id

    Object.keys(updates).forEach((key) => {
      user[key] = updates[key]
    })

    await user.save()
    return res.status(200).json({ message: 'User updated successfully.' })
  } catch (err) {
    return res.status(500).json({ message: 'Update failed.', error: err.message })
  }
}

async function DeleteUserById(req, res) {
  try {
    const userId = req.params.id
    const deletedUser = await UsersModel.findByIdAndDelete(userId).exec()

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found.' })
    }

    return res.status(200).json({ message: 'User deleted successfully.' })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete user.', details: err.message })
  }
}

async function DeleteAllUsers(req, res) {
  try {
    await UsersModel.deleteMany({})
    return res.status(200).json({ message: 'All users deleted successfully.' })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete users.', details: err.message })
  }
}

export { CreateUser, UpdateUserByID, DeleteUserById, DeleteAllUsers }
export default router
