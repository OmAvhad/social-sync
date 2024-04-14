const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const { get } = require("request-promise");
const cors = require("cors");
const path = require('path');
const { IgApiClient } = require('instagram-private-api');
const multer = require('multer');
const ig = new IgApiClient();
const fs = require('fs');

require('dotenv').config();
const cloudinary = require('cloudinary').v2;
// const { v2 } = require('cloudinary');
          
cloudinary.config({ 
  cloud_name: 'dxah0hqjk', 
  api_key: '191772646316441', 
  api_secret: 'eVPhZnp9eyEFWPtsfD2LkbupLLI' 
});

const app = express();
app.use(cors())
app.use(session({
    secret: 'your-secret-key', // Replace 'your-secret-key' with a random string used to sign the session ID cookie
    resave: false,
    saveUninitialized: false
}));
const port = 4000;

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'uploads/'); // Store uploaded files in the 'uploads' directory
	},
	filename: function (req, file, cb) {
		cb(null, Date.now() + '-' + file.originalname); // Append timestamp to file name to make it unique
	}
});

const upload = multer({ storage: storage });

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
app.use('/uploads', express.static('uploads'));

// Routes
const mainRouter = require('./routes/routes');
app.use('/', mainRouter);


var FB = require('fb');
const { pathToFileURL } = require('url');

FB.setAccessToken(process.env.FACEBOOK_ACCESS_TOKEN);

const uploadtoFb = async(url, description)=> {
	
    console.log("ppp",url);
    FB.api(`/61558529695873/photos`, 'POST', 
    {
        // 'source': fs.createReadStream("PATH_TO_THE_LOCAL_FILE"),
            "url":`${url}`,
    
        'caption': `${description}`,
        // 'alt_text_custom': 'Ceci est une alt description',
        //'tag': [{'x':, 'y', 'tag_uid, tag_text'}]
        // 'published': false ==> IF YOU WANT TO PUBLISH LATER
        // 'scheduled_publish_time' ==> DATE OF THE PUBLICATION
    }, 
    function (response) {
    
        if (response.error) {
            console.log('error occurred: ')
            console.log(response.error)
        } else {
            console.log('Uploaded to FB');
            // Step 2 : publish media
        }
    });
}

const uploadtoInsta = async(url, description)=> {
	try {
		const mediaBuffer = await get({
			url: url,
			encoding: null,
		});
		const data = await ig.publish.photo({
			file: mediaBuffer,
			caption: description,
		});
		console.log("Uploaded to Instagram");
		return data;
	} catch (error) {
		console.log(error);
	}
};

app.post("/connect-instagram", async (req, res) => {
	const { username, password } = req.body;
	ig.state.generateDevice(username);
	try {
	  const data = await ig.account.login(username, password);
	  res.send(data);
	} catch (error) {
	  console.log(error);
	  res.status(500).json(error);
	}
  });

app.post("/upload-instagram", async (req, res) => {
	const { url, caption } = req.body;
	try {
		const mediaBuffer = await get({
			url: url,
			encoding: null,
		  });
		const data = await ig.publish.photo({
			file: mediaBuffer,
			caption: caption,
		});

		res.send(data);
	} catch (error) {
	  console.log(error);
	  res.status(500).json(error);
	}
  });

app.post("/upload-video", async (req, res) => {
	const { url, caption } = req.body;
	try {
		const response = await fetch(url); // Download the video using fetch
		if (!response.ok) {
			throw new Error(`Failed to fetch video from URL: ${url}`);
		}

		const videoBuffer = await response.arrayBuffer();
		const data = await ig.publish.video({
			video: videoBuffer,
			caption: caption,
		});
		res.send(data);
	} catch (error) {
	  console.log(error);
	  res.status(500).json(error);
	}
  });

app.post('/upload', upload.single('image'), async (req, res) => {
	try {
		
		const { description } = req.body;
		if (!req.file) {
			return res.status(400).json({ error: "Image file not provided" });
		}
		const image = req.file;
		console.log(image, typeof(image));
		// upload to cloudinary
		let url = '';
		await cloudinary.uploader.upload(image.path, async (error, result) => {
			if (error) {
				console.error(error);
				return res.status(500).json(error);
			}
			console.log(result);
			url = result.secure_url;
			// upload to facebook
			await uploadtoFb(url, description);
			// upload to instagram
			await uploadtoInsta(url, description, image.Buffer);

			return res.status(200).json({ message: "Image uploaded successfully", image: result });
		});
	} catch (error) {
		console.error(error);
		res.status(500).json(error);
	}
    
});

const username = 'mpr_123456';
const password = 'abc@123';

(async () => {
  try {
    await ig.state.generateDevice(username);
    await ig.account.login(username, password);
    console.log('Connected to Instagram successfully.');
  } catch (error) {
    console.error('Failed to connect to Instagram:', error);
  }
})();

// Start the server
const PORT = process.env.PORT || port;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});