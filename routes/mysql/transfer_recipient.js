const { DataTypes } = require('sequelize');
const sequelize = require('./index');
const User = require('./user');

const TransferRecipient = sequelize.define('TransferRecipient', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    recipient_code: {
        type: DataTypes.STRING,
        allowNull: false
    },
    bank_code: {
        type: DataTypes.STRING,
        allowNull: false
    },
    account_number: {
        type: DataTypes.STRING,
        allowNull: false
    },
    account_name: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    timestamps: true
});

TransferRecipient.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(TransferRecipient, { foreignKey: 'user_id' });

module.exports = TransferRecipient; 