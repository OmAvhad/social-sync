const User = require('../models/userModel');

const userMiddleware = async (req, res, next) => {
    try {
        // Get the user ID from the query parameter
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        console.log("userId", userId);
        // Perform a database query to check if the user exists
        const user = await User.findById(userId);
        
        if (user) {
            // If user exists, set a property on the request object
            req.user = user;
        } else {
            // If user does not exist, you can handle the error or return a response
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Call next() to pass control to the next middleware function in the stack
        next();
    } catch (error) {
        // If an error occurs during database query or middleware execution, handle it
        console.error('Error in user middleware:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.userMiddleware = userMiddleware;