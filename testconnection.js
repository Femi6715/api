const mongoose = require('mongoose');

const mongoURI = process.env.MONGO_URI || 
  'mongodb+srv://admin:62221085@padi.rfdah5x.mongodb.net/padi?retryWrites=true&w=majority&appName=padi';

mongoose.set('debug', true); // Enable Mongoose debug mode

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  tls: true,
  // tlsAllowInvalidCertificates: true, // Uncomment for testing only
})
.then(() => {
  console.log('MongoDB connected');
  process.exit(0);
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});
