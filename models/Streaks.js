/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Streaks', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      primaryKey: true
    },
    win_streak: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    lose_streak: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    total_games: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    total_wins: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    total_loses: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'Streaks',
    timestamps: false
  });
};
