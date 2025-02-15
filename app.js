const express = require('express')
const cors = require("cors")
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
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
      response.status(400)
      response.send('Password is too short')
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
        response.status(200)
        response.send('User created successfully')
      } else {
        response.status(400)
        response.send('User already exists')
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
        response.send("invalid user")
      }else {
        const comparePassword = await bcrypt.compare(password, dbUser.password)
        if (comparePassword){
          response.send("login Success")
        }else {
          response.send("invaild password")
        }
      }
  })



  module.export = app