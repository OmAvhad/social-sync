const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const cors = require("cors");
const path = require('path');

require('dotenv').config();

const app = express();
app.use(cors())
app.use(session({
    secret: 'your-secret-key', // Replace 'your-secret-key' with a random string used to sign the session ID cookie
    resave: false,
    saveUninitialized: false
}));
app.use(express.static(path.join(__dirname, 'public')));
const port = 3000;

// Connect to MongoDB Atlas
const mongoURI = process.env.MONGODB_URI;

mongoose
	.connect(mongoURI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => {
		console.log("Connected to MongoDB Atlas");
	})
	.catch((error) => {
		console.error("Error connecting to MongoDB Atlas:", error);
	});

// Middleware
app.use(express.json());

// Routes
const mainRouter = require('./routes/routes');
app.use('/', mainRouter);

app.get('/fb', (req, res) => {
	res.sendFile('test.html');
});	

// Start the server
const PORT = process.env.PORT || port;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});