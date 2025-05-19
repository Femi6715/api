const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const config = require('./config/database');

async function createDemoUser() {
    try {
        // Create connection
        const connection = await mysql.createConnection(config.database);
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Demo@123', salt);
        
        // Insert user
        const [result] = await connection.execute(
            `INSERT INTO users (
                surname, firstname, lastname, state, email, 
                mobile_no, username, password, main_balance, bonus
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'Demo',
                'User',
                'Test',
                'Active',
                'demo@example.com',
                '08012345678',
                'demouser',
                hashedPassword,
                1000.00,
                100.00
            ]
        );
        
        console.log('Demo user created successfully');
        await connection.end();
    } catch (error) {
        console.error('Error creating demo user:', error);
    }
}

createDemoUser();