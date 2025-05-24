// Script to modify the transactions table to add default values for required fields
const mysql = require('mysql2/promise');
const config = require('./config/database');

(async () => {
  try {
    console.log('Connecting to database...');
    const connection = await mysql.createConnection(config.database);
    
    console.log('Connected! Attempting to modify transactions table...');
    
    // Try to add default values for required fields
    try {
      console.log('Adding default value for amount field...');
      await connection.query(`
        ALTER TABLE transactions 
        MODIFY amount DECIMAL(10,2) NOT NULL DEFAULT 0
      `);
      console.log('Successfully added default for amount field');
    } catch (error) {
      console.error('Failed to modify amount field:', error.message);
    }
    
    // Try to add default values for createdAt and updatedAt
    try {
      console.log('Adding default value for createdAt field...');
      await connection.query(`
        ALTER TABLE transactions 
        MODIFY createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      `);
      console.log('Successfully added default for createdAt field');
    } catch (error) {
      console.error('Failed to modify createdAt field:', error.message);
    }
    
    try {
      console.log('Adding default value for updatedAt field...');
      await connection.query(`
        ALTER TABLE transactions 
        MODIFY updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      `);
      console.log('Successfully added default for updatedAt field');
    } catch (error) {
      console.error('Failed to modify updatedAt field:', error.message);
    }
    
    console.log('Database modifications complete');
    
    // Now let's try a direct insert to test
    try {
      console.log('Testing a transaction insert...');
      
      const result = await connection.query(`
        INSERT INTO transactions 
        (user_id, transaction_type, amount_involved, acct_balance, time_stamp, trans_date, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        1, // user_id
        'ticket_purchase', // transaction_type
        100, // amount_involved
        1000, // acct_balance
        Date.now(), // time_stamp
        '1-1-2023', // trans_date
        'pending' // status
      ]);
      
      console.log('Test transaction insert successful!', result[0].insertId);
    } catch (error) {
      console.error('Test transaction insert failed:', error.message);
      console.error('SQL:', error.sql);
    }
    
    await connection.end();
    console.log('Connection closed');
  } catch (error) {
    console.error('Database connection or operation failed:', error);
  }
})(); 