const mongoose = require('mongoose');
const { type } = require('os');

const handleConfigSchema = new mongoose.Schema({
    serviceName: {  // youtube, instagram, facebook, twitter
        type: String,
        required: true,
        unique: true
    },
    clientId: {
        type: String
    },
    clientSecret: {
        type: String
    },
    accessToken: {
        type: String
    },
    refreshToken: {
        type: String
    },
    userId: { // user id from the user model
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

module.exports = mongoose.model('HandleConfig', handleConfigSchema);