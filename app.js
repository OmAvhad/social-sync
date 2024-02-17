const express = require('express');
const mongoose = require('mongoose');
const cors = require("cors")
require('dotenv').config();

const app = express();
app.use(cors())

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

// Start the server
const PORT = process.env.PORT || port;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});