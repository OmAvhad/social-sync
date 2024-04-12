const express = require('express');
const router = express.Router();
const { userMiddleware } = require('../middleware/middleware');

const Auth = require('../controllers/auth');
const Handle = require('../controllers/handle');

// Auth Routes
router.post('/signup', Auth.Signup);
router.post('/login', Auth.Login);

// Handle Routes
router.get('/handles', userMiddleware, Handle.handles);


// Youtube Routes
router.get('/generate-yt-auth', userMiddleware, Handle.generateYTAuthURL);
router.get('/yt/callback', Handle.ytCallBack);
router.get('/yt', userMiddleware, Handle.getYT);

module.exports = router;