const { get } = require('http');
const HandleConfig = require('../models/handleConfigModel');
const { authorizationUrl, getToken } = require('../utils/googleClient');

const generateYTAuthURL = async (req, res) => {
    res.json({ authorizationUrl });
}

const ytCallBack = async (req, res) => {
    const { code } = req.query;
    try {
        let { tokens } = await getToken(code);
        // oauth2Client.setCredentials(tokens);
        try {
            console.log("tokens", tokens);
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