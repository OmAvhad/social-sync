const express = require('express');
const router = express.Router();

const Auth = require('../controllers/auth');
const Handle = require('../controllers/handle');

router.post('/signup', Auth.Signup);
router.post('/login', Auth.Login);

router.get('/generate-yt-auth/:id', Handle.generateYTAuthURL);
router.get('/yt/callback', Handle.ytCallBack);

module.exports = router;