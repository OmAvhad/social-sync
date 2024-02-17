const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const { sendEmail } = require('../utils/utils');

const Signup = async (req, res) => {
  const { name, email, password } = req.body;
  console.log(req.body);
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please fill all fields' });
  }
  try {
    const user = await User.findOne
      ({ email });
    if (user) { 
      return res.status(400).json({ message: 'User already exists' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    sendEmail(email, 'Welcome to Social Sync', 'Thank you for signing up');
    res.json({ message: 'User created' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

const Login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Please fill all fields' });
  }
  try {
    const user = await User
      .findOne({ email })
      .select('+password');
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }
    if (!await bcrypt.compare(password, user.password)) {
      return res.status(400).json({ message: 'Invalid password' });
    }
    user.password = undefined;
    res.json({ user });
  }
  catch (err) {
    res.status(500).json({ message: err.message });
  }
}

exports.Signup = Signup
exports.Login = Login