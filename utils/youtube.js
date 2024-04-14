const { google } = require('googleapis');

// Create Youtube client
const createYoutubeClient = async (oauth2Client) => {
    const youtube = google.youtube({
        version: 'v3',
        auth: oauth2Client
    });

    return youtube;
}

const channelList = async (youtube) => {
    const channels = await youtube.channels.list({
        part: 'snippet,contentDetails,statistics',
        mine: true
    });

    return channels;
}

const playlistList = async (youtube) => {
    const playlists = await youtube.playlists.list({
        part: 'snippet',
        mine: true
    });

    return playlists;
}

const playlistItemsList = async (youtube, playlistId) => {
    const playlistItems = await youtube.playlistItems.list({
        part: 'snippet',
        playlistId: playlistId
    });

    return playlistItems;
}

// Upload photo to Youtube
 

module.exports = { 
    createYoutubeClient,
    channelList,
    playlistList,
    playlistItemsList
};