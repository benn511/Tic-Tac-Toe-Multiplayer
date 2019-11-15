const { User, Highscore } = require('./models');

const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const bodyParser = require('body-parser');
var hbs = require('express-handlebars');
const Sequelize = require('sequelize');

app = express();
app.set('port', 3002);

// setup body parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// set up session (in-memory storage by default)
app.use(session({ secret: "mysupersecret" }));

app.use(express.static(path.join(__dirname, 'static')))
// setup handlebars and the view engine for res.render calls
// (more standard to use an extension like 'hbs' rather than
//  'html', but the Universiry server doesn't like other extensions)
app.set('view engine', 'html');
app.engine('html', hbs({
  extname: 'html',
  defaultView: 'default',
  layoutsDir: __dirname + '/views/layouts/',
  partialsDir: __dirname + '/views/partials/'
}));

// setup static file service
app.use(express.static(path.join(__dirname, 'static')));


app.get("/index", (req, res) => {
  res.render("login");
});

app.post("/lr", (req, res) => {

  //register new user
  // if statement for register button pressed
  if (req.body.reg_btn != null) {
    //get the form data
    var _username = req.body.username;
    var _password = req.body.pw;

    //check for errors
    var errors = [];

    //blank username
    if (_username.trim().length == 0) {
      errors.push({ msg: "Usernames cannot be blank" });
    }

    //short password
    if (_password.trim().length < 4) {
      errors.push({ msg: "Password is too short" });
    }

    //check for duplicate
    User.findAndCountAll({
      where: { username: _username }
    }).then((result) => {
      if (result.rows != 0 && result.count > 0) {
        // Duplicate exists...
        errors.push({ msg: "Username already exists" });
      }
      //if error, back to LR page
      if (errors.length > 0) {
        res.render("login", {
          errors: errors,
          propogate_username: _username.trim()
        });
        return;
      }
      //otherwise, save new User

      //turn password into hash
      bcrypt.hash(_password, 10, (err, hash) => {
        //create new user in db
        User.create({
          username: _username,
          password_hash: hash,
          admin: 0
        });

        //save user and hash to session
        req.session.username = _username;
        req.session.password_hash = hash;

        //send home page
        res.render("home", { password: hash, username: _username });
      });
    });
  }


  //login button pressed
  if (req.body.login_btn != null) {

    // app.get("/lr", (req,res) => {

    if (req.body.username.trim().length == 0) {
      errors.push({ msg: 'username cant be blank' })
    }
    //short password
    if (req.body.pw.trim().length <= 4) {
      errors.push({ msg: "password short" });
    }
    ////////duplicate query search database here
    //if(...)



    /*/ the compare method takes the salt from the stored hash instead of generating
    //  a new one, so the resulting hash will match
    //compare user password in database
    User.findOne({
      where:{username:username}
    }).then(users =>{
      //checks password
    bcrypt.compare(users.password_hash,pw, (err,match) => {
      if (match) {
        res.render("home");
      } else {
        errors.push({msg: 'credentials invalid'})
      }
    })
  })*/

    //if error, back to Lr page
    if (errors.length > 0) {
      res.render("login", {
        errors: errors,
        propagate_username: req.body.username.trim()
      });

      return;
    }
  }
});



var server = app.listen(app.get('port'), function () {
  console.log("Server started...")
});