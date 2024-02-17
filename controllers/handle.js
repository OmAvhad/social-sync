const { get } = require('http');
const HandleConfig = require('../models/handleConfigModel');
const { authorizationUrl, getToken } = require('../utils/googleClient');
const User = require('../models/userModel');

// Youtube
const generateYTAuthURL = async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);
    const handle = await HandleConfig.findOne({ userId: user, serviceName: "youtube" });
    if (!handle) {
        await HandleConfig.create({ userId: user, serviceName: "youtube" });
    }

    req.session.userId = id;
    res.json({ authorizationUrl });
}

const ytCallBack = async (req, res) => {
    const userId = req.session.userId;
    const { code } = req.query;

    try {
        let { tokens } = await getToken(code);
        console.log("tokens", tokens);
        // oauth2Client.setCredentials(tokens);
        try {
            const user = await User.findById(userId);
            if (!user) {
                return res.status(400).json({ message: "User not found" });
            }
            console.log("tokens", tokens);
            await HandleConfig.create(
                {
                serviceName: "youtube",
                clientId: tokens.client_id,
                clientSecret: tokens.client_secret,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                userId: user
            });
        } catch (error) {
            res.status(400).json(error.message);
        }
        res.status(200).json({ message: "Authentication Successfull" });
    } catch (e) {
        res.status(500).json(e.message);
    }
}

exports.generateYTAuthURL = generateYTAuthURL;
exports.ytCallBack = ytCallBack;