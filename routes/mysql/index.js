const { Sequelize } = require('sequelize');
const config = require('../../config/database');

// Add console.log to debug the configuration
console.log('Database config:', {
    database: config.database.database,
    user: config.database.user,
    host: config.database.host
});

const sequelize = new Sequelize(
    config.database.database,
    config.database.user,
    config.database.password,
    {
        host: config.database.host,
        dialect: 'mysql',
        pool: config.database.pool,
        logging: false // Set to console.log to see SQL queries
    }
);

// Test the connection
sequelize.authenticate()
    .then(() => console.log('Database connection established successfully.'))
    .catch(err => console.error('Unable to connect to the database:', err));

module.exports = sequelize; 