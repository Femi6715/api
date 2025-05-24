const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const passport = require('passport');
const mongoose = require('mongoose');
const config = require('./config/database');
const cron = require("node-cron");
const moment = require("moment");
const helmet = require("helmet");

const AdminUser = require('./models/admin');

require('./config/passport');
// const { ObjectID } = require('mongodb');
const MongoClient = require('mongodb').MongoClient;
//connecting to database
mongoose.connect(config.database, { useNewUrlParser: true });
const { ObjectID } = require('mongodb');

//test out connection and log status to console.
mongoose.connection.on('connected', () => {
    console.log('connected to the database ' + config.database);
});

//Check for database connection error
mongoose.connection.on('error', (err) => {
    console.log('Database Error' + err);
})

const app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

const port = process.env.PORT || 8080;

app.use(cors());

app.use(helmet());

// body parse middleware
app.use(bodyParser.json());

//passport middleware
app.use(passport.initialize());
app.use(passport.session());

let newAdminUser = new AdminUser({
    firstname: 'Test',
    lastname: 'Admin',
    email: 'test@simplelott0.ng',
    mobile_no: '080000000',
    username: 'testadmin',
    password: 'admintest123'
})

AdminUser.addAdminUser(newAdminUser, (err, adminUser) => {
    if (err) {
        console.log('Admin Registration Failed');
    } else {
        console.log("Admin Registration Successfull");
    }
});

console.log('execute');