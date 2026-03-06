// ✅ Load environment variables first
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '.env') });
console.log("🧩 DEBUG: MONGO_URI =", process.env.MONGO_URI);

// ✅ Import required modules
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');
const cors = require('cors');

const app = express();

// 🔹 CORS for Netlify frontend
app.use(cors({
  origin: "https://debugit12.netlify.app",
  credentials: true
}));

// 🔹 Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));


// ⭐ Serve static files with required headers for Godot Web
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  }
}));


// 🔹 Serve video file
app.get("/video.mp4", (req, res) => {

  const videoPath = path.join(__dirname, "public", "video.mp4");

  if (!fs.existsSync(videoPath)) {
    return res.status(404).send("Video not found");
  }

  res.setHeader("Content-Type", "video/mp4");
  res.setHeader("Accept-Ranges", "bytes");

  res.sendFile(videoPath);
});


// 🔹 Session setup
app.use(session({
  secret: 'debugit-secret-key',
  resave: false,
  saveUninitialized: false,
}));


// 🔹 Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));


// 🔹 User schema
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
});

const User = mongoose.model('User', userSchema);


// 🔹 Login protection
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('https://debugit12.netlify.app/index.html');
  }
  next();
}


// 🔹 SIGNUP
app.post('/signup', async (req, res) => {

  const { username, email, password } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res.send('⚠️ User already exists! <a href="https://debugit12.netlify.app/index.html">Login here</a>');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    username,
    email,
    password: hashedPassword
  });

  await newUser.save();

  console.log(`✅ New user created: ${username}`);

  res.redirect('https://debugit12.netlify.app/index.html');
});


// 🔹 LOGIN
app.post('/login', async (req, res) => {

  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.send('❌ User not found');
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.send('❌ Incorrect password');
  }

  req.session.userId = user._id;
  req.session.username = user.username;

  console.log(`✅ ${user.username} logged in`);

  res.redirect('https://debugit12.netlify.app/home.html');
});


// 🔹 LOGOUT
app.get('/logout', (req, res) => {

  req.session.destroy();

  res.redirect('https://debugit12.netlify.app/index.html');
});


// 🔹 Default route
app.get('/', (req, res) => {

  if (req.session.userId) {
    res.redirect('https://debugit12.netlify.app/home.html');
  } else {
    res.redirect('https://debugit12.netlify.app/index.html');
  }

});


// 🔹 Start server (required for Render)
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 DEBUGIT running on port ${PORT}`);
});