const { DataTypes } = require('sequelize');
const sequelize = require('./index');
const User = require('./user');

const Game = sequelize.define('Game', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    mobile_no: {
        type: DataTypes.STRING,
        allowNull: false
    },
    game_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    ticket_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    time_stamp: {
        type: DataTypes.DATE,
        allowNull: false
    },
    stake_amt: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    draw_time: {
        type: DataTypes.TIME,
        allowNull: false
    },
    draw_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    potential_winning: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    ticket_status: {
        type: DataTypes.ENUM('pending', 'won', 'lost'),
        allowNull: false,
        defaultValue: 'pending'
    },
    jackpot: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    timestamps: true
});

Game.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Game, { foreignKey: 'user_id' });

module.exports = Game; 