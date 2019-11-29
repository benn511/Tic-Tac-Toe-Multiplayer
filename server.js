const { User, Highscore, Streak } = require('./models');

const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const bodyParser = require('body-parser');
var hbs = require('express-handlebars');
const Sequelize = require('sequelize');

app = express();
app.set('port', 3002);

//start server
server = app.listen(app.get('port'), function () {
  console.log("Server started...")
});

//setup socket.io
var io = require('socket.io')(server);

// setup body parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// set up session (in-memory storage by default)
app.use(session({ secret: "mysupersecret" }));

// setup handlebars and the view engine for res.render calls
// (more standard to use an extension like 'hbs' rather than
//  'html', but the Universiry server doesn't like other extensions)
app.set('view engine', 'html');
app.engine('html', hbs({
  extname: 'html',
  defaultView: 'default',
  layoutsDir: __dirname + '/views/layouts/',
  partialsDir: __dirname + '/views/partials/',
  helpers: {
    if_eq: function (arg1, arg2, options) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    },
  }
}));

// setup static file service
app.use(express.static(path.join(__dirname, 'static')));

//room counter
let rooms = 0;

app.use(express.static('.'));

app.get('/', (req, res) => {
  res.redirect('/login');
});


//setup game session
io.on('connection', (socket) => {
  // Create a new game room and notify the creator of game.
  socket.on('createGame', (data) => {
    socket.join(`room-${++rooms}`);
    socket.emit('newGame', { name: data.name, room: `room-${rooms}` });
  });

  // Connect the Player 2 to the room he requested. Show error if room full.
  socket.on('joinGame', function (data) {
    var room = io.nsps['/'].adapter.rooms[data.room];
    if (room && room.length === 1) {
      socket.join(data.room);
      socket.broadcast.to(data.room).emit('player1', {});
      socket.emit('player2', { name: data.name, room: data.room })
    } else {
      socket.emit('err', { message: 'Sorry, The room is full!' });
    }
  });

  //Handle the turn played by either player and notify the other.
  socket.on('playTurn', (data) => {
    socket.broadcast.to(data.room).emit('turnPlayed', {
      tile: data.tile,
      room: data.room
    });
  });

  // Notify the players about the winner.
  socket.on('gameEnded', (data) => {
    socket.broadcast.to(data.room).emit('gameEnd', data);

    //if game ties update db
    if (data.tie) {
      let p1_id;
      let p2_id;
      //get P1 user id from users table
      User.findOne({
        where: { username: data.p1 }
      }).then(user => {
        p1_id = user.id;
      });

      //get P2 user id from users table
      User.findOne({
        where: { username: data.p2 }
      }).then(user => {
        p2_id = user.id;
      });

      //get P1 stats from Streaks table
      Streak.findOne({
        where: { userid: p1_id }
      }).then(stats => {

      });

      //get P2 stats from Streaks table
      Streak.findOne({
        where: { userid: p2_id }
      }).then(stats => {

      });

      //update P1 streak table with appropriate stats
      Streak.update(/*{ total_games: req.body.text }, */{ where: { userid: p1_id } }).then(

      );

      //update P2 streak table with appropriate stats
      Streak.update(/*{ last_name: req.body.text }, */{ where: { userid: p2_id } }).then(

      );
    }

    //if not a tie update db
    else {
      let winner_id;
      let loser_id;

      //get winner user id from users table
      User.findOne({
        where: { username: data.winner }
      }).then(user => {
        winner_id = user.id;
      });

      //get loser user id from users table
      User.findOne({
        where: { username: data.loser }
      }).then(user => {
        loser_id = user.id;
      });

      //get winner stats from Streaks table
      Streak.findOne({
        where: { userid: winner_id }
      }).then(stats => {

      });

      //get loser stats from Streaks table
      Streak.findOne({
        where: { userid: loser_id }
      }).then(stats => {

      });

      //update winner streak table with appropriate stats
      Streak.update(/*{ total_games: req.body.text }, */{ where: { userid: winner_id } }).then(

      );

      //update loser streak table with appropriate stats
      Streak.update(/*{ last_name: req.body.text }, */{ where: { userid: loser_id } }).then(

      );
    }
  });
});


app.get('/setup', function (req, res) {
  //if user isnt logged in redirect to login page
  if (!req.session.user) {
    res.redirect('/login');
  }
  else {
    let _username = req.session.user.username;
    res.render('game_pg', { Username: _username });
  }
});


app.get('/login', (req, res) => {
  if (req.session.user) {
    res.redirect('/home');
  }
  else {
    res.render("login_register");
  }
});


app.get('/home', (req, res) => {
  if (req.session.user) {
    Highscore.findAll().then(highscores => {

      let userids = [];//Used to query User db
      let hs = [];//Used to merge users and hs table into one array

      highscores.forEach(element => {
        userids.push(element["username_id"]);
        hs.push({ score: element["score"], date: element["date"] });
      });

      User.findAll({
        where: {
          id: userids//Find only the users that are on the highscore db
          //score: score > 5000? filter by values
        }
      }).then(_username => {

        //Merge highscores and users into one
        for (let index = 0; index < hs.length; index++) {
          hs[index]["username"] = _username[index]["username"];
        }

        if (_username && highscores) {
          res.render('home', { User: hs })
        }
        else {
          // Highscore table is empty...
          res.redirect("/home");
        }
      })
    });
  }
  else {
    res.redirect("/login");
  }
});


app.get('/profile_pg', (req, res) => {
  if (req.session.user) {
    let _user = req.session.user;
    res.render('profile_pg', { User: _user })
  }
  else {
    res.redirect('/login');
  }
});


app.post("/lr", (req, res) => {

  //login button pressed
  if (req.body.login_btn != null) {
    //get the form data
    var _username = req.body.username;
    var _password = req.body.pw;

    //check for errors
    var errors = [];

    if (_username.trim().length == 0) {
      errors.push({ msg: 'Username is empty' })
    }
    //short password
    if (_password.trim().length == 0) {
      errors.push({ msg: "Password is empty" });
    }

    //the compare method takes the salt from the stored hash instead of generating
    //a new one, so the resulting hash will match
    //compare user password in database

    User.findOne({
      where: { username: _username.trim() }
    }).then(user => {
      if (user) {
        //checks password
        bcrypt.compare(_password, user.password_hash, (err, match) => {
          if (match) {
            req.session.user = user;
            //redirectt to home route
            res.redirect("/home");
            return;
          } else {
            errors.push({ msg: 'Invalid Credentials' });
            res.render("login_register", {
              errors: errors,
              propogate_username: _username.trim()
            });
            return;
          }
        });
      }
      else {
        // User doesn't exists...
        errors.push({ msg: "Username doesn't exists" });
      }
      //if error, back to lr page
      if (errors.length > 0) {
        res.render("login_register", {
          errors: errors,
          propagate_username: _username.trim()
        });
        return;
      }
    });
  }

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
    User.findOne({
      where: { username: _username }
    }).then((user) => {
      if (user) {
        // User already exists...
        errors.push({ msg: "Username already exists" });
      }
      //if error, back to LR page
      if (errors.length > 0) {
        res.render("login_register", {
          errors: errors,
          propogate_username: _username.trim()
        });
        return;
      }

      ////otherwise, save new User
      //turn password into hash
      bcrypt.hash(_password, 10, (err, hash) => {
        //create new user in db
        User.create({
          username: _username,
          password_hash: hash,
          admin: 0
        });

        //save user to session
        req.session.user = user;

        //redirectt to home route
        res.redirect("/home");
        return;
      });
    });
  }
});


app.get('/logout', (req, res) => {
  // remove user from session
  delete req.session.user;
  res.redirect('/login');
});
