const mysql = require('mysql2/promise');

const dbConfig = {
  host: '27gi4.h.filess.io',
  port: 3307,
  user: 'Padilotto_wordrushof',
  password: 'd030caf65b4e0827f462ebbca5a2aaeff45bf969',
  database: 'Padilotto_wordrushof'
};

async function setupDatabase() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database');

    // Create tickets table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticket_id VARCHAR(50) NOT NULL UNIQUE,
        user_id INT NOT NULL,
        game_id VARCHAR(50) NOT NULL,
        mobile_no VARCHAR(20) NOT NULL,
        stake_amt DECIMAL(10,2) NOT NULL,
        potential_winning DECIMAL(10,2) NOT NULL,
        time_stamp BIGINT NOT NULL,
        draw_time VARCHAR(20) NOT NULL,
        draw_date VARCHAR(20) NOT NULL,
        ticket_status VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        INDEX idx_user_id (user_id),
        INDEX idx_game_id (game_id),
        INDEX idx_ticket_id (ticket_id),
        INDEX idx_draw_date (draw_date)
      )
    `);
    console.log('Tickets table created successfully');

    await connection.end();
    console.log('Database setup completed');
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

setupDatabase(); 