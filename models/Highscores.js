/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Highscores', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      primaryKey: true
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: '0'
    },
    date: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    username_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'Highscores',
    timestamps: false
  });
};
