const { DataTypes } = require('sequelize');
const sequelize = require('./index');
const User = require('./user');

const Transaction = sequelize.define('Transaction', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    transaction_type: {
        type: DataTypes.ENUM('deposit', 'withdrawal', 'winning', 'ticket_purchase'),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed'),
        allowNull: false,
        defaultValue: 'pending'
    },
    reference: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    timestamps: true
});

Transaction.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Transaction, { foreignKey: 'user_id' });

module.exports = Transaction; 