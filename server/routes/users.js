const express = require('express');
const router = express.Router();

const bcrypt = require('bcrypt');
const uuid = require('uuid');
const jwt = require('jsonwebtoken');
const schema = require('../js/validate');
const users = require('../db/users.json');


// Routes
router.get('/', (req, res) => {
  res.send(users);
});


router.post('/signup', async (req, res) => {
  // Validates the request body values
  const { error } = schema.signup.validate(req.body);
  if (error) {
    console.log(error.details[0].message);
    res.status(400).send(error.details[0].message);
    return;
  }

  const { firstName, lastName, username, email, password } = req.body;

  // Checks whether email already exist
  for (const u of users) {
    if (u.email === email) {
      console.log('Email already exist! ❌');
      res.status(400).send('Email already exist! ❌');
      return;
    }
  }

  const id = uuid.v4();
  const hashPassword = await bcrypt.hash(password, 10);

  // Adds to user to database
  const user = { id, firstName, lastName, username, email, password: hashPassword }
  users.push(user);

  const accessToken = jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
  res.send({ accessToken });
});


router.post('/login', async (req, res) => {
  // Validates the request body values
  const { error } = schema.login.validate(req.body);
  if (error) {
    console.log(error.details[0].message);
    res.status(400).send(error.details[0].message);
    return;
  }

  const { email, password } = req.body;

  // Gets the hashed password from database
  let id = '';
  let hashPassword = '';
  for (const user of users) {
    if (user.email === email) {
      id = user.id;
      hashPassword = user.password;
    }
  }

  // Checks whether user exist with the email
  if (id === '') {
    res.status(401).send('User does not exist with that email! ❌');
    return;
  }

  // Checks whether password is the same in database
  if (await bcrypt.compare(password, hashPassword)) {
    const accessToken = jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
    res.send({ accessToken });
  } else {
    res.status(401).send('Login information is incorrect! ❌');
  }
});


module.exports = router;
