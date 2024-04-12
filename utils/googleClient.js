const { google } = require('googleapis');
require('dotenv').config();
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'openid',
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/youtube.force-ssl',
    'https://www.googleapis.com/auth/youtube.upload',
];

const authorizationUrl = oauth2Client.generateAuthUrl({
  scope: scopes,
  access_type: 'offline',
  include_granted_scopes: true
});

const getToken = async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  console.log("tokens", tokens);
  return tokens;
}

const setOAuth = async (tokens) => {
  try {
    oauth2Client.setCredentials(tokens);
    return oauth2Client;
  } catch (error) {
    console.log("error", error);
    throw error;
  }
}

// Create OAuth2 client
const createOAuth = async (accessToken, refreshToken) => {
  const oauth2Client = await setOAuth({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      access_token: accessToken,
      refresh_token: refreshToken,
  });
  return oauth2Client;
}

module.exports = { authorizationUrl, getToken, setOAuth, createOAuth };