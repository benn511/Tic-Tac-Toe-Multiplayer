const { User, Highscore, Streaks } = require('./models');

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

const http = require('http').Server(app);

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

app.get('/game', function (req, res) {
  res.render('game_pg.html');
});

let port = 5000;

http.listen(port, function () {
  console.log(`Tic-tac-toe game server running on port ${port}`);
});


const io = require('socket.io')(http);

var players = {},
  unmatched;

function joinGame(socket) {

  // Add the player to our object of players
  players[socket.id] = {

      // The opponent will either be the socket that is
      // currently unmatched, or it will be null if no
      // players are unmatched
      opponent: unmatched,

      // The symbol will become 'O' if the player is unmatched
      symbol: 'X',

      // The socket that is associated with this player
      socket: socket
  };

  // Every other player is marked as 'unmatched', which means
  // there is no another player to pair them with yet. As soon
  // as the next socket joins, the unmatched player is paired with
  // the new socket and the unmatched variable is set back to null
  if (unmatched) {
      players[socket.id].symbol = 'O';
      players[unmatched].opponent = socket.id;
      unmatched = null;
  } else {
      unmatched = socket.id;
  }
}

// Returns the opponent socket
function getOpponent(socket) {
  if (!players[socket.id].opponent) {
      return;
  }
  return players[
      players[socket.id].opponent
  ].socket;
}

io.on('connection', function (socket) {
  console.log("Connection established...", socket.id);
  joinGame(socket);

  // Once the socket has an opponent, we can begin the game
  if (getOpponent(socket)) {
      socket.emit('game.begin', {
          symbol: players[socket.id].symbol
      });
      getOpponent(socket).emit('game.begin', {
          symbol: players[getOpponent(socket).id].symbol
      });
  }

  // Listens for a move to be made and emits an event to both
  // players after the move is completed
  socket.on('make.move', function (data) {
      if (!getOpponent(socket)) {
          return;
      }
      console.log("Move made by : ", data);
      socket.emit('move.made', data);
      getOpponent(socket).emit('move.made', data);
  });

  // Emit an event to the opponent when the player leaves
  socket.on('disconnect', function () {
      if (getOpponent(socket)) {
          getOpponent(socket).emit('opponent.left');
      }
  });
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
    let _username = "";
    Highscore.findAll().then(_highscore => {
      User.findByPk(_highscore.username_id).then(user => {
        //_username = user.username;
      });
      if (_highscore) {
        res.render('home', { user: req.session.user, highscores: _highscore })
      }
      else {
        // Highscore table is empty...
        res.redirect("/home");
      }
    });
  }
  else {
    res.redirect("/login");
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

app.get("/setup", (req, res) => {
  //if user isnt logged in redirect to login page
  if (!req.session.user) {
    res.redirect('/login');
  }
  else {
    res.render("opponent_setup");
  }
});

//gets user profile_pg need to set up game pg to click on user name
//to display user profile
app.get('/profile_pg/:id', function (req, res, next) {
  users.findByPk(req.params.id).then(i => {
    i.getStreaks().then(r => {
      res.render('profile_pg', { user: i, streaks: r })
    })
  })
});

app.get('/logout', (req, res) => {
  // remove user from session
  delete req.session.user;
  res.redirect('/login');
});

var server = app.listen(app.get('port'), function () {
  console.log("Server started...")
});