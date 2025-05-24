const mongoose = require('mongoose');
const config = require('../config/database');

const categoriesSchema = mongoose.Schema({
    day: {
        type: String,
        required: true
    },
    category: [
        {
            game_id: String,
            amt_to_stake: Number,
            potential_returns: Number
        }
    ]
});

const Category = module.exports = mongoose.model('Categories', categoriesSchema);

module.exports.fetchCategories = function(callback){
    Category.find(callback);
}