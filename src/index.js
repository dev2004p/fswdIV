const express = require('express');
const path = require("path");
const mongoose = require('mongoose');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/login', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Define User schema
const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

// Create User model
const User = mongoose.model('User', userSchema);

// Serve the signup page as the first page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'Signup.html'));
});

// Handle signup form submission
app.post("/auth/signup", async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if username already exists
        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.status(400).send("<h1>Username already exists</h1>");
        }

        // Save the new user
        await User.create({ username, password });

        // Redirect to home page upon successful signup
        res.sendFile(path.join(__dirname, 'home.html'));
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});


// Handle login page
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Handle login form submission
app.post("/auth/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find user in database
        const user = await User.findOne({ username });

        if (!user || user.password !== password) {
            return res.status(400).send("Invalid username or password");
        }

        // Redirect to home page upon successful login
        res.sendFile(path.join(__dirname, 'home.html'));
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

// Server setup
const port = 5001;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});