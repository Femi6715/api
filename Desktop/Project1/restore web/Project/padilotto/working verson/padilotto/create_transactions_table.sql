-- SQL script to create the transactions table

CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  amount_involved DECIMAL(10, 2) NOT NULL,
  transaction_type VARCHAR(20) NOT NULL,
  acct_balance DECIMAL(10, 2),
  time_stamp BIGINT NOT NULL,
  trans_date VARCHAR(20) NOT NULL,
  type VARCHAR(20),
  amount DECIMAL(10, 2),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for faster lookups
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_trans_date ON transactions(trans_date);
CREATE INDEX idx_transactions_type ON transactions(transaction_type); 