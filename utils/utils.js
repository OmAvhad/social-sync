const nodemailer = require("nodemailer");
const axios = require("axios");
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

exports.sendEmail = sendEmail
exports.gemini = gemini

// Example function for Gemini
// const goalFunction = {
// 	'name': 'categorize_goal',
// 	'description': 'find the goal from the given description, find attributes such as title, amount, end_date, etc.',
// 	'parameters': {
// 		'type': 'object',
// 		'properties': {
// 				'title': {
// 					'type': 'string',
// 					'description': 'Title of the goal such as car, flat, world tour for example: Car, Falt, World Tour'
// 				},
// 				'amount': {
// 					'type': 'number',
// 					'description': 'How much money will be required to achieve the goal. Consider it to be in INR. Give in Number format For example: 40000, 5000. If not found then return 200000.'
// 				},
// 				'end_date': {
// 					'type': 'string',
// 					'description': 'The date by which the goal should be achieved, give in ISO format For example: 2022-12-31, 2023-01-01. If not found then give todays date.'
// 				}
// 		},
// 		'required': [
// 			'title',
// 			'amount',
// 			'end_date'
// 		]
// 	}
// }