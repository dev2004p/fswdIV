const express = require('express');
const path = require("path");
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const app = express();

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Connect to MongoDB
mongoose.connect('mongodb+srv://dev2004patel:huZeZAJtgXhhNyIZ@cluster0.grpntfd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Define User schema
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    expenses: [{
        date: Date,
        description: String,
        quantity: Number,
        amount: Number,
        totalAmount: Number
    }]
});


// Create User model
const User = mongoose.model('User', userSchema);

app.get("/aboutus", (req, res) => {
    res.sendFile(path.join(__dirname, 'aboutus.html'));
});

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
        res.redirect('/login');
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});



// Handle login page
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});
app.get("/home", (req, res) => {
    res.sendFile(path.join(__dirname, 'home.html'));
});

// Handle login form submission
// Handle login form submission
app.post("/auth/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find user in database
        const user = await User.findOne({ username });

        if (!user || user.password !== password) {
            return res.status(400).send("Invalid username or password");
        }

        // Set session user
        req.session.user = { username };

        // Fetch user's expenses from MongoDB
        const userExpenses = user.expenses;

        // Redirect to home page upon successful login
        res.redirect('/home');
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

app.get('/home/profile', async (req, res) => {
    // Check if user is logged in
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const username = req.session.user.username;

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).send("User not found");
        }

        // Render home page with user's expenses
        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/home", async (req, res) => {
    const { date, description, quantity, amount, totalAmount } = req.body;

    // Check if user is logged in
    if (!req.session.user) {
        return res.status(401).send("Unauthorized");
    }

    const username = req.session.user.username;

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).send("User not found");
        }
        const totalAmount = quantity * amount;


        // Add expense to the user's profile
        user.expenses.push({ date, description, quantity, amount , totalAmount });
        await user.save();

        // Redirect to home page or send success response
        res.sendFile(path.join(__dirname, 'home.html'));
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});





app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login'); 
});
// Add a route to handle DELETE requests for deleting expenses
app.delete("/deleteExpense", async (req, res) => {
    const { expenseId } = req.body;
    const username = req.session.user.username;

    try {
        // Find the user
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).send("User not found");
        }

        // Remove the expense from the user's expenses array
        user.expenses = user.expenses.filter(expense => expense._id.toString() !== expenseId);
        await user.save();

        res.status(200).send("Expense deleted successfully");
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

