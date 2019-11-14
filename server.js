// import the models
const { user,highscore} = require('./models');
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
var hbs = require( 'express-handlebars');
var session = require('express-session');
var cookieParser = require('cookie-parser');
app = express();
app.set('port', 3002);
app.use(session({secret: "This is a big long secret lama string."}));

app.use(express.static(path.join(__dirname, 'static')))
// setup handlebars and the view engine for res.render calls
// (more standard to use an extension like 'hbs' rather than
//  'html', but the Universiry server doesn't like other extensions)
app.set('view engine', 'html');
app.engine( 'html', hbs( {
  extname: 'html',
  defaultView: 'default',
  layoutsDir: __dirname + '/views/layouts/',
  partialsDir: __dirname + '/views/partials/'
}));


// the bodyParser module automatically parses incoming POST data
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

  

  /*/get show highscore of users
  app.get('/home', function(req, res, next) {
    users.findAll().then(i =>{
      i.gethighscore().then(h=>{
        res.render('home', {user:i, highscore:r})
      })
    })
  });*/

app.get("/index", (req,res) =>{
    res.render("login_register");
  } )

  app.post("/lr",(req,res)=>{
      //get form data

      //check for rrors
      var errors = []
     

        //register new user
     // if statement for register button pressed
     if(req.body.reg_btn != null)
     {

      //blank username
      if(req.body.username.trim().length == 0){
          errors.push({msg:'username cant be blank'})
      }
      //short password
      if(req.body.pw.trim().length <= 4) {
          errors.push({msg: "password short"});
      }
      /*duplicate query search dtabase
      if(req.query.username === req.body.username){
        errors.push({msg:'username already exist'})
      }*/
      
      //if error, back to Lr page
      if(errors.length > 0)
      {
          res.render("login_register", {errors:errors,
            propagate_username: req.body.username.trim()
          });
          
          return;
      }
    

     /*/bcrypt to hash pw and save new user
     //also add new user to session
      bcrypt.hash(req.body.pw,10,(err, hash) =>{
        if(err){
          return res.send("err")
        
        }else{
          users.create({
          
            username: req.body.username,
            password_hash: hash
         
          })
   
        
         req.session.username = users;
         req.session.password_hash = hash;
          res.render('home')
      
    }

    })*/
  }
  
//login button pressed
     if(req.body.login_btn != null){

     // app.get("/lr", (req,res) => {

        if(req.body.username.trim().length == 0){
          errors.push({msg:'username cant be blank'})
      }
      //short password
      if(req.body.pw.trim().length <= 4) {
          errors.push({msg: "password short"});
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
      if(errors.length > 0)
      {
          res.render("login_register", {errors:errors,
            propagate_username: req.body.username.trim()
          });
          
          return;
      }
     
   
     }

     res.render("home")


      })
  
  var server = app.listen(app.get('port'), function() {
	console.log("Server started...")
});