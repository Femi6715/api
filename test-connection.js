const mysql = require('mysql2/promise');
const config = require('./config/database');

async function testConnection() {
  try {
    console.log('Attempting to connect to MySQL with config:', {
      host: config.database.host,
      user: config.database.user,
      database: config.database.database
    });
    
    const pool = mysql.createPool(config.database);
    const connection = await pool.getConnection();
    
    console.log('Connection successful!');
    
    // Test query on transactions table
    const [rows] = await connection.query('SHOW TABLES');
    console.log('Tables in database:', rows);
    
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('Connection error:', error);
    process.exit(1);
  }
}

testConnection(); 