const sequelize = require('../models/mysql');
const User = require('../models/mysql/user');
const Game = require('../models/mysql/game');
const Transaction = require('../models/mysql/transaction');
const WinningTicket = require('../models/mysql/winning_ticket');
const GameCategory = require('../models/mysql/game_category');
const TransferRecipient = require('../models/mysql/transfer_recipient');

async function initDatabase() {
    try {
        // Disable foreign key checks
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');

        // Sync all models with database
        await sequelize.sync({ force: true }); // This will drop and recreate all tables

        // Re-enable foreign key checks
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');

        console.log('Database synchronized successfully');

        // Create admin user
        await User.create({
            surname: 'Admin',
            firstname: 'User',
            gender: 'Male',
            dob: '1990-01-01',
            state: 'Lagos',
            email: 'admin@example.com',
            mobile_no: '08012345678',
            username: 'admin',
            password: 'admin123',
            main_balance: 0.00,
            bonus: 0.00
        });

        // Create game categories
        await GameCategory.bulkCreate([
            { name: 'Daily Draw', description: 'Daily lottery draw' },
            { name: 'Weekly Draw', description: 'Weekly lottery draw' },
            { name: 'Monthly Draw', description: 'Monthly lottery draw' }
        ]);

        console.log('Initial data created successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
    } finally {
        // Make sure to re-enable foreign key checks even if there's an error
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
        process.exit();
    }
}

initDatabase(); 