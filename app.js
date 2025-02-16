const express = require('express')
const cors = require("cors")
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const app = express()
app.use(express.json())
app.use(cors())

let db = null
const dbPath = path.join(__dirname, 'crudapplication.db')

const initlizDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is running in http://localhost:3000')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initlizDBAndServer()


app.post('/register', async (request, response) => {
    const {username, password} = request.body
    if (password.length < 5) {
      const error_msg = 'Password is too short'
      response.status(400)
      response.send({error_msg})
    } else {
      const hashPassword = await bcrypt.hash(password, 10)
      const getQueryDetails = `
          SELECT * FROM user WHERE username = '${username}'
          `
      const dbUser = await db.get(getQueryDetails)
      if (dbUser === undefined) {
        const createUserDetails = `
              INSERT INTO user (username, password)
              VALUES (
                  '${username}',
                  '${hashPassword}'
              )
              `
        await db.run(createUserDetails)
        const success = 'User created successfully'
        response.status(200)
        response.send({success})
      } else {
        const error_msg = 'User already exists'
        response.status(400)
        response.send({error_msg})
      }
    }
  });

  app.get("/", async (request, response) => {
    const getQueryDetails = `
          SELECT * FROM user 
          `
      const dbUser = await db.all(getQueryDetails)
      response.send(dbUser)
  })

  app.post("/login", async (request, response) => {
    const {username, password} = request.body
    const getQueryDetails = `
          SELECT * FROM user WHERE username = '${username}'
          `
      const dbUser = await db.get(getQueryDetails)
      if (dbUser === undefined){
        const error_msg = "invalid user"
        response.status(400)
        response.send({error_msg})
      }else {
        const comparePassword = await bcrypt.compare(password, dbUser.password)
        if (comparePassword){
          const payload = {
            username: username,
          };
          const jwt_token = jwt.sign(payload, "MY_SECRET_TOKEN");
          response.status(200)
          response.send({ jwt_token });
        }else {
          const error_msg = "invaild password"
          response.status(400)
          response.send({error_msg})
        }
      }
  })

  app.put('/change-password', async (request, response) => {
    const {username, oldPassword, newPassword} = request.body
    if (newPassword.length < 5 || oldPassword.length < 5) {
      const error_msg = 'Password is too short'
      response.status(400)
      response.send({error_msg})
    } else {
      const getQueryDetails = `
      SELECT * FROM user WHERE username = '${username}'
      `
      const dbUser = await db.get(getQueryDetails)
      if (dbUser === undefined) {
        const error_msg = 'Invalid user'
        response.status(400)
        response.send({error_msg})
      } else {
        const comparePassword = await bcrypt.compare(oldPassword, dbUser.password)
        if (comparePassword === true) {
          const hashPassword = await bcrypt.hash(newPassword, 10)
          const updatePasswordDetails = `
          UPDATE user 
          SET 
          password = '${hashPassword}'
          `
          await db.run(updatePasswordDetails)
          const success = 'Password updated'
          response.status(200)
          response.send({success})
        } else {
          const error_msg = 'Invalid current password'
          response.status(400)
          response.send({error_msg})
        }
      }
    }
  })



  module.export = app