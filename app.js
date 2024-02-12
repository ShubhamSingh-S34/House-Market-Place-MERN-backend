require('dotenv').config();
const express = require('express');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose')
const mongoDbUrl = process.env.MONGO_URL;
const cors = require('cors');
const JWT_SECRET = process.env.JWT_SECRET;
const cookieParser = require('cookie-parser');
// Define a route
const Listing = require('./models/Listing');
const User = require('./models/User');


app.use(cors({ origin: '*' }));
app.use(bodyParser.json());
app.use(cookieParser());


mongoose.connect(mongoDbUrl, { useNewUrlParser: true, useUnifiedTopology: true }).then((result) => {
    console.log('CONNECTED TO MONGODB .....');
}).catch((err) => {
    console.log('ERROR WHILE CONNECTING TO MONGODB-------->', err);
});




app.get('/', (req, res) => {
    res.send('Hello, Express!');
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// GET ALL LISTINGS 
app.get('/api/listings', async (req, res) => {
    try {
        var allListings = await Listing.find();
        console.log(allListings);
        res.status(200).json(allListings);
    }
    catch (e) {
        console.log('ERROR WHILE GETTING ALL LISTING ... FILE NAME: index.js ------> ', e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

// GET ALL LISTINGS FOR SELL
app.get('/api/listings/category/:categoryName', async (req, res) => {
    try {
        const categoryName = req.params.categoryName;
        var allListings = await Listing.find({ type: categoryName });
        console.log(allListings);
        res.status(200).json(allListings);
    }
    catch (e) {
        console.log('ERROR WHILE GETTING ALL LISTING ... FILE NAME: index.js ------> ', e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})


// GET A LISTING 
app.get('/api/listings/:listingId', async (req, res) => {
    try {
        const listingId = req.params.listingId;
        var listing = await Listing.findById(listingId);
        console.log("This is the listing -----> ", listing);
        res.status(200).json(listing);
    }
    catch (e) {
        console.log('ERROR WHILE GETTING ALL LISTING ... FILE NAME: index.js ------> ', e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

//GET ALL OFFERS LISTINGS
app.get('/api/offer-listings', async (req, res) => {
    try {
        const offerListings = await Listing.find({ offer: true });
        res.status(200).json(offerListings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GETTING ALL USER LISTINGS
app.get('/api/user/:userId/listings', async (req, res) => {
    try {
        const userId = req.params.userId;
        const userListings = await Listing.find({ userRef: userId });
        console.log(userListings);
        res.status(200).json(userListings);
    }
    catch (e) {
        console.log('ERROR WHILE GETTING LISTING FROM A USER  ... FILE NAME: index.js ------> ', e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

// GET 5 LATEST LISTING FOR CARD SLIDER
app.get('/api/latest-listings', async (req, res) => {
    try {
        const latestListings = await Listing.find().sort({ createdAt: -1 }).limit(5);
        res.status(200).json(latestListings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//DELETING A LISTING
app.delete('/api/listings/:listingId', async (req, res) => {
    try {
        const listingId = req.params.listingId;
        const deletedListing = await Listing.findByIdAndDelete(listingId);
        if (deletedListing) {
            res.status(200).json({ message: 'Listing deleted successfully', data: deletedListing });
        }
        else {
            res.status(404).json({ error: 'Listing not found' });
        }
    }
    catch (e) {
        console.log('ERROR WHILE DELETING THE LISTING ------> ', e);
    }
})

//CREATE A LISTING
app.post('/api/listings', async (req, res) => {
    try {
        // Extract data from the request body
        const formData = req.body;

        // Create a new listing using the Listing model
        const newListing = new Listing({
            ...formData,
            timestamp: new Date(),
        });

        // Save the listing to the database
        await newListing.save();

        // Send a success response
        res.status(201).json({ message: 'Listing created successfully', data: newListing });
    } catch (error) {
        // Handle errors
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// REGISTER A USER
app.post('/api/user/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        // Check if the user already exists
        const userExist = await User.findOne({ email });
        if (userExist) {
            return res.status(400).json({ error: 'User already exists.' });
        }
        // Generate a unique user ID
        const userId = uuidv4();

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save user details
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        // Create a JWT token
        const token = jwt.sign({ userRef: newUser._id, email, name }, JWT_SECRET, { expiresIn: '1h' });
        res.cookie('jwt', token, { httpOnly: true });
        // Return the token to the client
        res.json({ token });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET USER DETAILS
app.get('/api/user/signup/getdetails', async (req, res) => {
    try {
        console.log(req.cookies);
        const cookie = req.cookies.jwt;
        console.log(cookie);
        const decodedToken = jwt.verify(cookie, JWT_SECRET);
        console.log(decodedToken);
        res.send({});
    }
    catch (e) {
        console.log('OOPS ERROR IN API /api/user/signup/getdetails -------> ', e);
        res.send({});
    }
});

// SIGNING IN A USER
app.post('/api/user/signin', async (req, res) => {
    try {
        console.log('INSIDE FUNCTION');
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Compare the provided password with the hashed password in the database
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Incorrect password' });
        }

        // Generate a JWT token for the user
        const token = jwt.sign({ userRef: user._id, email }, JWT_SECRET, { expiresIn: '1h' });

        // Respond with the token
        res.status(200).json({ token });
    } catch (error) {
        console.error('Error during sign-in:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET DETAILS FROM jwt web token
app.post('/api/user/getdetails', async (req, res) => {
    try {
        const { token } = req.body;
        console.log("TOKEN IS THIS ", token);
        const decodedToken = jwt.verify(token, JWT_SECRET);
        const userRef = decodedToken.userRef;
        const user = await User.findById(userRef);
        console.log(user);

        if (user) {
            //NOW GET DATA FROM LIISTINGS USING USERREF
            const listings = await Listing.find({ userRef });
            console.log(listings);
            res.status(200).json({ name: user.name, email: user.email, userRef: user._id, listings });
        }
        else {
            res.status(201).json({ error: 'User not exist.' });
        }
    }
    catch (e) {
        console.log('OOPS ERRRO IN API /api/user/getdetails -----> ', e);
        res.status(201).send("User not found");
    }
})


// CHANGES TO DO ARE IN ->

// pages/ContactPage.js










// {
//     "bathrooms": 1,
//     "bedrooms": 1,
//     "discountedPrice": "10999999",
//     "furnished": false,
//     "geoLocation": { "lat": 88.415518, "lng": 22.661829 },
//     "imageUrls": [
//       "https://firebasestorage.googleapis.com/v0/b/house-market-place-de9bc.appspot.com/o/images%2FTeuy4Np1WiTSDy72SBWdNJpR2Tr2-1.png-dffdcb11-b432-4fcd-9800-1049840176f9?alt=media&token=718cc075-35db-4dcd-bbec-40690f971bbf",
//       "https://firebasestorage.googleapis.com/v0/b/house-market-place-de9bc.appspot.com/o/images%2FTeuy4Np1WiTSDy72SBWdNJpR2Tr2-2.png-45ad8720-96bc-4919-b103-8096dcc0ab6a?alt=media&token=daa89ad4-c897-470f-8ab8-918517cd2225",
//       "https://firebasestorage.googleapis.com/v0/b/house-market-place-de9bc.appspot.com/o/images%2FTeuy4Np1WiTSDy72SBWdNJpR2Tr2-3.png-4ed9b312-2c0b-4144-a6e2-17e94b233cd9?alt=media&token=e2f37c8f-138a-4b92-bf72-1975a10f917e"
//     ],
//     "latitude": 0,
//     "location": "167 NS Road Rajakatra kolkata 700007",
//     "longitude": 0,
//     "name": "House for sell i",
//     "offer": true,
//     "parking": false,
//     "regularPrice": "159999999",
//     "timestamp": { "_methodName": "serverTimestamp" },
//     "type": "sell",
//     "userRef": "Teuy4Np1WiTSDy72SBWdNJpR2Tr2"
//   }