
const HandleConfig = require('../models/handleConfigModel');
const { authorizationUrl, getToken, setOAuth, createOAuth } = require('../utils/googleClient');
const { createYoutubeClient, channelList, playlistList, playlistItemsList } = require('../utils/youtube');
const User = require('../models/userModel');
require('dotenv').config();

// Generate URL for youtube authentication
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

// Callback function for youtube authentication
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
                return res.status(400).json({ message: "User not found", userId: userId });
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
    
    const client = await createOAuth(handle.accessToken, handle.refreshToken);
    const youtube = await createYoutubeClient(client);
    const channels = await channelList(youtube);
    const playlists = await playlistList(youtube, channels.data.items[0].id);
    // const playlistItems = await playlistItemsList(youtube, playlists.data.items[0].id);

    return res.status(200).json({ data: playlistItems.data.items });
}

const uploadVideoToYoutube = async (path, description) => {
    try{
        const handle = await HandleConfig.findOne({ userId: "65d0bab01024462089dedceb", serviceName: "youtube" });
        if (!handle) {
            return res.status(400).json({ message: "Youtube not connected" });
        }

        const client = await createOAuth(handle.accessToken, handle.refreshToken);
        const youtube = await createYoutubeClient(client);
        const channels = await channelList(youtube);
        const video = {
            snippet: {
                title: "Test Video",
                description: description,
                tags: ["test", "video"],
                categoryId: "22",
            },
            status: {
                privacyStatus: "public"
            }
        }
        const videoPath = path;
        const videoUpload = await youtube.videos.insert(
            {
                part: "snippet,status",
                requestBody: video,
                media: {
                    body: require("fs").createReadStream(videoPath)
                }
            }
        );
        console.log("Uploaded to Youtube");
        return "video uploaded";
    } catch (error) {
        console.log("error", error);
        return error.message;
    }
}

// Reterive all handles(social media accounts) of a user 
const handles = async (req, res) => {
    const user = req.user;
    const handle = await HandleConfig.find({ userId: user }).select('_id serviceName');
    return res.status(200).json({ data: handle });
}

// }

module.exports = { 
    generateYTAuthURL, 
    ytCallBack, 
    getYT, 
    handles,
    uploadVideoToYoutube
};