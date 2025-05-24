const { DataTypes } = require('sequelize');
const sequelize = require('./index');
const User = require('./user');
const Game = require('./game');

const WinningTicket = sequelize.define('WinningTicket', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    game_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    amount_won: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    draw_date: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    timestamps: true
});

WinningTicket.belongsTo(User, { foreignKey: 'user_id' });
WinningTicket.belongsTo(Game, { foreignKey: 'game_id' });

module.exports = WinningTicket; 