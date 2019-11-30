/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Streaks', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    win_streak: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: '0'
    },
    total_games: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: '0'
    },
    total_wins: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: '0'
    },  
    total_ties: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: '0'
    }
  }, {
    tableName: 'Streaks',
    timestamps: false
  });
};
