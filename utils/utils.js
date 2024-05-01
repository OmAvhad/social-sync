const nodemailer = require("nodemailer");
const axios = require("axios");
const fs = require("fs");	
require("dotenv").config();

const geminiAPIKey = process.env.GEMINI_API_KEY;

const sendEmail = async (email, subject, message, resumeBuffer) => {
	return new Promise((resolve, reject) => {
		let transporter = nodemailer.createTransport({
			service: "gmail",
			auth: {
				user: "omkhandu2017@gmail.com",
				pass: process.env.NODEMAILER_PWD,
			},
		});

		const mailOptions = {
			from: "Social Sync <socialsync@gmail.com>",
			to: [email, "omavhad22@gmail.com"],
			subject: `${subject}`,
			text: `${message}`,
			attachments: [],
		};

		// Check if resumeBuffer is provided and not empty
		// if (resumeBuffer && resumeBuffer.length > 0) {
		// 	mailOptions.attachments.push({
		// 		filename: "resume.pdf",
		// 		content: resumeBuffer,
		// 		encoding: "base64",
		// 	});
		// }

		transporter.sendMail(mailOptions, (error, info) => {
			if (error) {
				console.log(error);
				reject({ status: 400, message: "Email not sent" });
			} else {
				resolve({ status: 200, message: "Email sent successfully" });
			}
		});
	});
};


const gemini = async (myText, myFunction) => {
	const response = await axios.post(
		'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
		{
            'contents': {
                'role': 'user',
                'parts': {
                'text': myText
                }
            },
            'tools': [
                {
                'function_declarations': [
                    myFunction
                ]
                }
            ]
            },
            {
            params: {
                'key': geminiAPIKey
            },
            headers: {
                'Content-Type': 'application/json'
            }
		}
	);
	const args = response.data.candidates[0].content.parts[0].functionCall.args;
	return args;
}

// gemini function to send image to gemini and generate caption
const imagetToCaption = async (imageURL) => {
	const imageData = await axios.get(imageURL, { responseType: 'arraybuffer' }).then(response => Buffer.from(response.data, 'binary').toString('base64'));

	const response = await axios.post(
		'https://generativelanguage.googleapis.com/v1/models/gemini-pro-vision:generateContent',
		{
			'contents': {
				'role': 'user',
				'parts': [
					{
						'text': 'Genearate a caption for the given image. It should have some emojis, hashtags and should be catchy, engaging.'
					},
					{
						'inlineData': {
							mimeType: 'image/jpeg',
							data: imageData
						}
					}
				]
			},
			},
			{
			params: {
				'key': geminiAPIKey
			},
			headers: {
				'Content-Type': 'application/json'
			}
		}
	);
	const caption = response.data.candidates[0].content.parts[0].text;
	return caption;
}

exports.sendEmail = sendEmail
exports.gemini = gemini
exports.imagetToCaption = imagetToCaption