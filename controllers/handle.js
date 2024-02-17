const { get } = require('http');
const HandleConfig = require('../models/handleConfigModel');
const { authorizationUrl, getToken } = require('../utils/googleClient');
const User = require('../models/userModel');
const handleConfigModel = require('../models/handleConfigModel');

// Youtube
const generateYTAuthURL = async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);
    const handle = await HandleConfig.create({ userId: user, serviceName: "youtube" });
    // put the id in the session
    req.session.userId = id;
    res.json({ authorizationUrl });
}

const ytCallBack = async (req, res) => {
    const userId = req.session.userId;

    try{
        const user = await User.findById(userId);
    } catch (e) {
        res.status(400).json(e.message);
    }

    const { code } = req.query;

    try {
        let { tokens } = await getToken(code);
        // oauth2Client.setCredentials(tokens);
        try {
            console.log("tokens", tokens);
            await HandleConfig.findOneAndUpdate(
                { serviceName: "youtube", userId: userId },
                {
                serviceName: "youtube",
                clientId: tokens.client_id,
                clientSecret: tokens.client_secret,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                userId: user
            });
            // fs.writeFileSync("creds.json", JSON.stringify(tokens));
            // authed = true;
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