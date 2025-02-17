const express = require('express')
const cors = require("cors")
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { request } = require('http')
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
    const {username, email, password} = request.body
    if (password.length < 5) {
      const error_msg = 'Password is too short'
      response.status(400)
      response.send({error_msg})
    } else {
      const hashPassword = await bcrypt.hash(password, 10)
      const getQueryDetails = `
          SELECT * FROM user WHERE email = '${email}'
          `
      const dbUser = await db.get(getQueryDetails)
      if (dbUser === undefined) {
        const created_at = new Date()
        const createUserDetails = `
              INSERT INTO user (username, email, password, created_at)
              VALUES (
                  '${username}',
                  '${email}',
                  '${hashPassword}',
                  '${created_at}'
              )
              `
        await db.run(createUserDetails)
        const success = 'User created successfully'
        response.status(200)
        response.send({success})
      } else {
        const error_msg = 'email already exists'
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
    const {email, password} = request.body
    const getQueryDetails = `
          SELECT * FROM user WHERE email = '${email}'
          `
      const dbUser = await db.get(getQueryDetails)
      if (dbUser === undefined){
        const error_msg = "invalid email"
        response.status(400)
        response.send({error_msg})
      }else {
        const comparePassword = await bcrypt.compare(password, dbUser.password)
        if (comparePassword){
          const payload = {
            email: email,
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
    const {email, oldPassword, newPassword} = request.body
    if (newPassword.length < 5 || oldPassword.length < 5) {
      const error_msg = 'Password is too short(<5)'
      response.status(400)
      response.send({error_msg})
    } else {
      const getQueryDetails = `
      SELECT * FROM user WHERE email = '${email}'
      `
      const dbUser = await db.get(getQueryDetails)
      if (dbUser === undefined) {
        const error_msg = 'Invalid email'
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
          WHERE id = ${dbUser.id}
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

  app.delete("/delete", async (request, response) => {
    const {email, password} = request.body
    const getQueryDetails = `
      SELECT * FROM user WHERE email = '${email}'
    `
    const dbUser = await db.get(getQueryDetails)
    if (dbUser !== undefined){
      const comparePassword = await bcrypt.compare(password, dbUser.password)
      if (comparePassword){
        const getDetails = `
          DELETE FROM user WHERE id = ${dbUser.id}
        `
        await db.run(getDetails)
        const success = "user deleted successfully"
        response.status(200)
        response.send({success})
      }else {
        const error_msg = "invalid password"
        response.status(400)
        response.send({error_msg})
      }
    }else {
      const error_msg = "user notfound"
      response.status(400)
      response.send({error_msg})
    }
    
  })

  app.get("/note", async (request, response) => {
    const getDetails = `
      SELECT * FROM notes
    `
    const dbUser = await db.all(getDetails)
    response.status(200)
    response.send(dbUser)
  })

  app.post("/add", async (request, response) => {
    const {title, content, category} = request.body
    const createUserDetails = `
    INSERT INTO notes (title, content, category, created_at, updated_at)
    VALUES (
        '${title}',
        '${content}',
        '${category}',
        '${new Date()}',
        '${new Date()}'
    )
    `
    await db.run(createUserDetails)
    const success = 'Add successfully'
    response.status(200)
    response.send({success})
  })

  app.delete("/note/delete", async (request, response) => {
    const {id} = request.body
    const getDetails = `
      DELETE FROM notes WHERE id = ${id}
    `
    await db.run(getDetails)
    const success = "id deleted successfully"
    response.status(200)
    response.send({success})

  })

  app.put("/save", async (request, response) => {
    const {id, title, content, category} = request.body
    const updatePasswordDetails = `
    UPDATE notes
    SET 
    title = '${title}',
    content = '${content}',
    category = '${category}',
    updated_at = '${new Date()}'
    WHERE id = ${id}
    `
    await db.run(updatePasswordDetails)
    const success = 'updated successfully'
    response.status(200)
    response.send({success})
  })



  module.export = app