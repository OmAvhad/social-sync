const { get } = require('http');
const HandleConfig = require('../models/handleConfigModel');
const { authorizationUrl, getToken, setOAuth } = require('../utils/googleClient');
const User = require('../models/userModel');
const { google } = require('googleapis');
require('dotenv').config();
// https://a5ff-103-137-94-215.ngrok-free.app/generate-yt-auth/65d0bab01024462089dedceb

// Youtube
const generateYTAuthURL = async (req, res) => {
    const user = req.user;

    const handle = await HandleConfig.findOne({ userId: user, serviceName: "youtube" });
    if (!handle) {
        await HandleConfig.create({ userId: user, serviceName: "youtube" });
    }

    req.session.userId = user._id;
    console.log("authorizationUrl", authorizationUrl);
    return res.redirect(authorizationUrl);
}

const ytCallBack = async (req, res) => {
    const userId = req.session.userId;
    const { code } = req.query;
    console.log("YTTTTTTT");
    try {
        let tokens = await getToken(code);
        console.log("tokens", tokens);
        
        try {
            console.log("userId", userId);
            const user = await User.findById(userId);
            if (!user) {
                return res.status(400).json({ message: "User not found" });
            }
            console.log("tokens", tokens);
            await HandleConfig.findOneAndUpdate(
                { userId: user, serviceName: "youtube" },
                {
                serviceName: "youtube",
                clientId: tokens.client_id,
                clientSecret: tokens.client_secret,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                userId: user
            });
            const client = await setOAuth(tokens);
            console.log("client", client);
        } catch (error) {
            return res.status(400).json(error.message);
        }
        return res.status(200).json({ message: "Authentication Successfull" });
    } catch (e) {
        return res.status(500).json(e.message);
    }
}

const getYT = async (req, res) => {
    const user = req.user;
    const handle = await HandleConfig.findOne({ userId: user, serviceName: "youtube" });
    if (!handle) {
        return res.status(400).json({ message: "Youtube not connected" });
    }

    const oauth2Client = await setOAuth({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        access_token: handle.accessToken,
        refresh_token: handle.refreshToken,
    });

    const youtube = google.youtube({
        version: 'v3',
        auth: oauth2Client
    });

    // user's channels
    const channels = await youtube.channels.list({
        part: 'snippet,contentDetails,statistics',
        mine: true
    });

    const channel_id = channels.data.items[0].id;
    // user's playlists
    const playlists = await youtube.playlists.list({
        part: 'snippet',
        channelId: channel_id   
    });
    // user's videos
    const playListItems = await youtube.playlistItems.list({
        part: 'snippet',
        playlistId: playlists.data.items[0].id
    });
    console.log("response", playListItems.data);

    return res.status(200).json({ data: playListItems.data});
}

exports.generateYTAuthURL = generateYTAuthURL;
exports.ytCallBack = ytCallBack;
exports.getYT = getYT;