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
const { gemini, imagetToCaption } = require('./utils/utils');
const axios = require('axios');
const { uploadVideoToYoutube } = require('./controllers/handle');

require('dotenv').config();
const cloudinary = require('cloudinary').v2;

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

const uploadtoFbVideo = async(url, description)=> {
	// use the graph-video api to upload the video
	let config = {
		method: 'post',
		maxBodyLength: Infinity,
		url: `https://graph-video.facebook.com/v19.0/269151736285799/videos?access_token=${process.env.FACEBOOK_ACCESS_TOKEN}&description=${description}&file_url=${url}`,
	};
	await axios.request(config)
		.then((response) => {
			console.log('Uploaded to FB');
			return response.data;
		})
		.catch((error) => {
			console.log(error);
			return error;
		}
	);
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

const uploadVideoToInsta = async (url, description) => {
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

const getFBPhotos = async () => {
    try {
        const post_ids = await new Promise((resolve, reject) => {
            // Get all Post IDs
            FB.api(
                '/269151736285799/feed',
                'GET',
                { "fields": "message" },
                (response) => {
                    if (response.error) {
                        console.log('error occurred: ');
                        console.log(response.error);
                        reject(response.error);
                    } else {
                        resolve(response.data);
                    }
                }
            );
        });

        const posts = await Promise.all(post_ids.map(async (post) => {
            try {
                const postResponse = await new Promise((resolve, reject) => {
                    // Get post details
                    FB.api(
                        `/${post.id}`,
                        'GET',
                        { "fields": "attachments, likes.summary(true), comments.summary(true)" },
                        (response) => {
                            if (response.error) {
                                console.log('error occurred: ');
                                console.log(response.error);
                                reject(response.error);
                            } else {
                                resolve(response);
                            }
                        }
                    );
                });
				// add a new field to the postResponse object
				postResponse.description = post?.message || "";
				postResponse.created_at = post?.created_time || "";
				console.log(postResponse);
                return postResponse;
            } catch (error) {
                return null;
            }
        }));

        return posts.filter(post => post !== null);
    } catch (error) {
        throw error;
    }
}

const getFBVideos = async () => {
	let video_ids = [];
	let config = {
		method: 'get',
		maxBodyLength: Infinity,
		url: `https://graph-video.facebook.com/v19.0/269151736285799/videos?access_token=${process.env.FACEBOOK_ACCESS_TOKEN}`,
	};
	  
	await axios.request(config)
	.then((response) => {
		video_ids = response.data.data;
	})
	.catch((error) => {
		console.log(error);
	});
	// call the graph-video api to get the video details the endpoint is /{video-id}?fields=source
	let videos = [];
	await Promise.all(video_ids.map(async (video) => {
		let config = {
			method: 'get',
			maxBodyLength: Infinity,
			url: `https://graph-video.facebook.com/v19.0/${video.id}?fields=source,likes.summary(true),comments.summary(true)&access_token=${process.env.FACEBOOK_ACCESS_TOKEN}`,
		};
		await axios.request(config)
		.then((response) => {
			videos.push(response.data);
		})
		.catch((error) => {
			console.log(error);
		});
	}));
	return videos;
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

app.post('/upload/video', upload.single('video'), async (req, res) => {
	try {
		const { description } = req.body;
		if (!req.file) {
			return res.status(400).json({ error: "Video file not provided" });
		}
		const video = req.file;
		// upload to cloudinary
		let url = '';
		await cloudinary.uploader.upload(video.path,
			{
				resource_type: "video",
			},
			async (error, result) => {
			if (error) {
				console.error("Cloud error", error);
				return res.status(500).json(error);
			}
			console.log(result);
			url = result.secure_url;
			// upload to facebook
			await uploadtoFbVideo(url, description);
			await uploadVideoToYoutube(video.path, description);
			// upload to instagram
			// await uploadToInstagram(url, description);

			return res.status(200).json({ message: "Video uploaded successfully", video: result });
		});
	} catch (error) {
		console.error(error);
		res.status(500).json(error);
	}
});

app.get('/fb-posts', async (req, res) => {
	try {
		const posts = await getFBPhotos();
		return res.status(200).json(posts);
	} catch {
		return res.status(500).json({ error: "Error getting Facebook posts" });
	}
});

app.get('/fb-videos', async (req, res) => {
	try {
		const posts = await getFBVideos();
		return res.status(200).json(posts);
	} catch {
		return res.status(500).json({ error: "Error getting Facebook videos" });
	}
});


// generate caption
app.post('/generate-caption', upload.single('image'),async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({ error: "Image file not provided" });
		}
		const image = req.file;
		// upload to cloudinary
		let url = '';
		await cloudinary.uploader.upload(image.path, async (error, result) => {
			if (error) {
				console.error(error);
				return res.status(500).json(error);
			}
			console.log(result);
			url = result.secure_url;
			// generate caption
			const caption = await imagetToCaption(url);
			return res.status(200).json({ caption });
		})
	} catch (error) {
		console.error(error);
		return res.status(500).json(error);
	}
});




// Connect to Instagram
const username = 'mpr_123456';
const password = 'abc@123';

// Start the server
const PORT = process.env.PORT || port;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});