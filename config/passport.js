const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const mysql = require('mysql2/promise');
const config = require('../config/database');
const jwt = require('jsonwebtoken');

module.exports = function(passport) {
  let opts = {};
  // Support both 'JWT' and 'Bearer' schemes to be flexible
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
  opts.secretOrKey = config.secret;
  
  // Debug middleware to log all headers
  passport.use('jwt-debug', (req, res, next) => {
    console.log('Headers received:', req.headers);
    console.log('Auth header:', req.headers['authorization']);
    next();
  });
  
  passport.use(new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
      console.log('JWT authentication attempt:');
      console.log('JWT payload:', jwt_payload);
      
      if (!jwt_payload || !jwt_payload.data || !jwt_payload.data._id) {
        console.error('Invalid JWT payload structure');
        return done(null, false);
      }
      
      // Create a pool connection
      const pool = mysql.createPool(config.database);
      const connection = await pool.getConnection();
      
      // Query the database for the user by ID
      const [rows] = await connection.query(
        'SELECT * FROM users WHERE id = ?',
        [jwt_payload.data._id]
      );
      connection.release();
      
      if (rows.length > 0) {
        console.log('User authenticated successfully:', rows[0].username);
        return done(null, rows[0]);
      } else {
        console.log('User not found in database with ID:', jwt_payload.data._id);
        return done(null, false);
      }
    } catch (err) {
      console.error('Passport JWT strategy error:', err);
      return done(err, false);
    }
  }));
  
  // Custom token extraction function that supports both 'JWT' and 'Bearer' schemes
  const customExtractor = (req) => {
    let token = null;
    if (req.headers && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else if (authHeader.startsWith('JWT ')) {
        token = authHeader.substring(4);
      }
      console.log('Token extracted:', token ? token.substring(0, 10) + '...' : 'null');
    }
    return token;
  };
  
  // Express middleware to verify if the token is valid (for debugging)
  passport.verifyToken = (req, res, next) => {
    // Get auth header value
    const bearerHeader = req.headers['authorization'];
    
    if (typeof bearerHeader !== 'undefined') {
      console.log('Authorization header found:', bearerHeader);
      // Extract token using custom extractor
      const token = customExtractor(req);
      
      if (!token) {
        console.error('No token could be extracted from header');
        return res.status(403).json({ success: false, msg: 'Invalid authorization format' });
      }
      
      try {
        // Verify token
        const decoded = jwt.verify(token, config.secret);
        console.log('Token verified successfully:', decoded);
        req.token = token;
        next();
      } catch (err) {
        console.error('Token verification failed:', err.message);
        return res.status(403).json({ success: false, msg: 'Invalid token' });
      }
    } else {
      console.error('No authorization header found');
      return res.status(403).json({ success: false, msg: 'No token provided' });
    }
  };
};

