app.use(cors({
  origin: "https://lambent-malabi-419196.netlify.app",
  credentials: true
}));

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
app.use(cors());

// ✅ Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ Serve static files (HTML, CSS, JS, images, videos)
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Serve video with correct MIME type for Brave / Chrome
app.get("/video.mp4", (req, res) => {
  const videoPath = path.join(__dirname, "public", "video.mp4");
  if (!fs.existsSync(videoPath)) {
    return res.status(404).send("Video not found");
  }

  // Force correct content type so Brave doesn't download it
  res.setHeader("Content-Type", "video/mp4");
  res.setHeader("Accept-Ranges", "bytes");
  res.sendFile(videoPath);
});

// ✅ Session setup
app.use(session({
  secret: 'debugit-secret-key',
  resave: false,
  saveUninitialized: false,
}));

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// ✅ Define user schema
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
});
const User = mongoose.model('User', userSchema);

// ✅ Middleware to protect pages
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login.html');
  }
  next();
}

// ✅ SIGNUP ROUTE
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.send('⚠️ User already exists! <a href="/index.html">Login here</a>');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ username, email, password: hashedPassword });
  await newUser.save();

  console.log(`✅ New user created: ${username}`);
  res.redirect('/index.html');
});

// ✅ LOGIN ROUTE
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.send('❌ User not found');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.send('❌ Incorrect password');

  req.session.userId = user._id;
  req.session.username = user.username;

  console.log(`✅ ${user.username} logged in`);
  res.redirect('/home.html');
});

// ✅ Logout route
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login.html');
});

// ✅ Protect index.html
app.get('/index.html', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ✅ Default route
app.get('/', (req, res) => {
  if (req.session.userId) {
    res.redirect('/index.html');
  } else {
    res.redirect('/login.html');
  }
});

// ✅ Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 DEBUGIT running at http://localhost:${PORT}`)
);
