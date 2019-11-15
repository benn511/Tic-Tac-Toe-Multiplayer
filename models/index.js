// this file makes the database connection, collects all the models
// and sets the associations
// other files can use this for database access by requiring it and
// assigning the exports

// assuming that this file (index.js) is in a subdirectory called models:
  //const models = require('./models');

// or (using deconstruction):
//  const { Person, PhoneNumber, Address, PersonAddress } = require('./models');

'use strict';

// database connection
const Sequelize = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'users.sqlite'
});

// import models
const User = sequelize.import("./users.js");
const Highscore = sequelize.import("./Highscores.js");

// associations
User.hasMany(Highscore, {foreignKey: "username_id", as: "username_id"});
Highscore.belongsTo(User, {foreignKey: "username_id"});

module.exports = {
  User, Highscore
};
