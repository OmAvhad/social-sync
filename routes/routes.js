const express = require('express');
const router = express.Router();
const { userMiddleware } = require('../middleware/middleware');

const Auth = require('../controllers/auth');
const Handle = require('../controllers/handle');

router.post('/signup', Auth.Signup);
router.post('/login', Auth.Login);

router.get('/generate-yt-auth', userMiddleware, Handle.generateYTAuthURL);
router.get('/yt/callback', Handle.ytCallBack);
router.get('/yt', userMiddleware, Handle.getYT);

module.exports = router;
// https://a5ff-103-137-94-215.ngrok-free.app/generate-yt-auth/65d0bab01024462089dedceb