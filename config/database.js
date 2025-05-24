module.exports = {
    database: {
        host: process.env.DB_HOST || '27gi4.h.filess.io',
        user: process.env.DB_USER || 'Padilotto_wordrushof',
        password: process.env.DB_PASSWORD || 'd030caf65b4e0827f462ebbca5a2aaeff45bf969',
        database: process.env.DB_NAME || 'Padilotto_wordrushof',
        port: process.env.DB_PORT || 3307,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    },
    secret: process.env.JWT_SECRET || "padilotto_secure_jwt_secret_2024"
}