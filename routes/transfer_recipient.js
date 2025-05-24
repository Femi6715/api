const mongoose = require('mongoose');

mongoose.set('useFindAndModify', false);

// user schema
const transferRecipientSchema = mongoose.Schema({
  user_id: {
    type: String,
    required: true
  },
  acct_name: {
    type: String,
    required: true
  },
  acct_num: {
    type: Number,
    required: true
  },
  bank_code: {
    type: String,
    required: true
  },
  recipient_code: {
    type: String,
    required: true
  }
});

const transferRecipient = (module.exports = mongoose.model(
  'transferRecipient',
  transferRecipientSchema
));

module.exports.addNewRecipient = (newRecipient, callback) => {
  newRecipient.save(callback);
};

module.exports.findRecipientByUserId = function(user_id, callback) {
  const query = { user_id: user_id };
  transferRecipient.countDocuments(query, callback);
};

module.exports.fetchRecipientByUserId = function(user_id, callback) {
  const query = { user_id: user_id };
  transferRecipient.findOne(query, callback);
};

module.exports.updateRecipient = function(updatedData, callback) {
  transferRecipient
    .findOneAndUpdate(
      {
        user_id: updatedData.user_id
      },
      {
        $set: {
          acct_name: updatedData.acct_name,
          acct_num: updatedData.acct_num,
          bank_code: updatedData.bank_code,
          recipient_code: updatedData.recipient_code
        }
      },
      {
        new: true
      }
    )
    .then(result => {
      callback(result);
    });
};
