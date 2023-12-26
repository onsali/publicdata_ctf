//import modules
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;
const path = require('path');
const session = require('express-session');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

//init sqlite db
const db = new sqlite3.Database('./mydb.sqlite', (err) => {
  if (err) {
    console.error(err.message);
  } else {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT,
        password TEXT,
        is_admin BOOLEAN
      )
    `);

    //insert admin user
    db.get('SELECT * FROM users WHERE is_admin = 1', (err, row) => {
      if (!row) {
        const adminUser = {
          name: 'admin',
          email: 'admin@pennington.edu',
          password: 'flag{sup3rUs3R}', //no hashing
          is_admin: true
        };

        db.run(`
          INSERT OR IGNORE INTO users (name, email, password, is_admin)
          VALUES (?, ?, ?, ?)
        `, [adminUser.name, adminUser.email, adminUser.password, adminUser.is_admin], (err) => {
          if (err) {
            console.error(err.message);
          } else {
            console.log('Admin user ensured in the database');
          }
        });
      }
    });

    console.log('Connected to the SQLite database.');
  }
});

//array to store valid flags
const validFlags = [
  'flag{b4byst3Ps}',
  'flag{sup3rUs3R}',
  'flag{d4taisb3aut1ful}',
  'flag{1nt3l}',
  'flag{wh0am1}'
];

//middleware setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/public/files', express.static(path.join(__dirname, 'public', 'files')));

//session
app.use(session({
  secret: 'your_secret_key', //hardcoded
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } 
}));

//routes

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/validate-flag', (req, res) => {
  const submittedFlag = req.query.flag;
  console.log('Submitted Flag:', submittedFlag);

  if (validFlags.includes(submittedFlag)) {
    res.status(200).send('Flag is correct!');
  } else {
    console.log('Incorrect flag. Please try again.');
    res.status(400).send('Incorrect flag. Please try again.');
  }
});

//user registration
app.post('/users', (req, res) => {
  const { name, email, password } = req.body;
  const query = `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`;

  db.run(query, [name, email, password], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.redirect('/files');
  });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const query = `SELECT * FROM users WHERE email = ? AND password = ?`;

  db.get(query, [email, password], (err, user) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send('Error on the server.');
    }

    if (user) {
      req.session.email = user.email;
      req.session.userId = user.id;
      req.session.is_admin = user.is_admin;

      if (user.is_admin) {
        res.redirect('/private');
      } else {
        res.redirect('/files');
      }
    } else {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Login Failed</title>
          <link rel="stylesheet" href="/styles.css">
        </head>
        <body>
          <p>Invalid username or password. <a href="/login.html">Try again</a></p>
        </body>
        </html>
      `);
    }
  });
});

//search function containing sqli
app.get('/users/search', (req, res) => {
  res.set({
    'Cache-Control': 'no-store',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  const searchQuery = req.query.query;
  let sql;

  if (searchQuery === "' or 1=1") {
    sql = `SELECT * FROM users`;
  } else {
    sql = `SELECT name, email FROM users WHERE name LIKE '%${searchQuery}%'`;
  }

  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).send('Error occurred: ' + err.message);
      return;
    }
    res.json(rows);
  });
});

//serve files
app.get('/files', (req, res) => {
  if (!req.session.email) {
    return res.redirect('/login.html');
  }

  const baseDirectory = req.session.is_admin ? 'private' : 'public/files';
  const directoryPath = path.join(__dirname, baseDirectory);

  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      return res.status(500).send('Unable to scan directory: ' + err);
    }

    let fileListHtml = files.map(file => `<li><a href="/${baseDirectory}/${file}">${file}</a></li>`).join('');
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Files</title>
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body>
        <ul>${fileListHtml}</ul>
      </body>
      </html>
    `);
  });
});

//serve private files
app.get('/private', (req, res) => {
  if (!req.session.email || !req.session.is_admin) {
    return res.status(403).send('Access Denied');
  }

  const directoryPath = path.join(__dirname, 'private');

  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      return res.status(500).send('Unable to scan directory: ' + err);
    }

    let fileListHtml = files.map(file => `<li><a href="/private/${file}">${file}</a></li>`).join('');
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Files</title>
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body>
        <ul>${fileListHtml}</ul>
      </body>
      </html>
    `);
  });
});

//serve private files statically
app.use('/private', express.static(path.join(__dirname, 'private')));

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
