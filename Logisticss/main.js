    import express from 'express';
    import bodyParser from 'body-parser';
    import mongoose from 'mongoose';
    import nodemailer from 'nodemailer';
    import path from 'path';
    import crypto from 'crypto';
    import bcrypt from 'bcrypt';
    import User from './models/userSchema.js';
    import Driver from './models/driverSchema.js';
    import CabBooking from './models/CabBooking.js';
    import jwt from 'jsonwebtoken';
    import { v4 as uuidv4 } from 'uuid';
    import session from 'express-session';




    const app = express();


    app.use(session({
        secret: 'your_secret_key',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false } // Set true in production (HTTPS)
    }));
    app.use(express.json())
    app.use(express.static('public'));
    app.use(bodyParser.urlencoded({ extended: true }));

    (async () => {
        try {
            await mongoose.connect("mongodb://localhost:27017/todo");
            console.log("Connected to MongoDB");
        } catch (error) {
            console.error("Error connecting to MongoDB:", error);
        }
    })();


    app.set('views', './views');



    app.set('view engine', 'ejs');

    app.get('/', (req, res) => {
        console.log("Home Page");
        res.render('Home');
    });

    app.get('/searching-driver', (req, res) => {
        res.render('searching-driver');
    });

    app.get('/about', (req, res) => {
        console.log("Info Page");
        res.render('Info');
    });

    app.get('/records', (req, res) => {
        const user = req.session.user; // Fetch from session
        if (!user || !user.uuid) {
            return res.status(400).send('User UUID not found');
        }
        res.render('records-ride', { uuid: user.uuid });
    });


    app.get('/acceptedride', (req, res) => {
        console.log("Accept Page");
        res.render('Acceptedride');
    });

    app.get('/login', (req, res) => {
        console.log("Login Page");
        res.render('Login');
    });

    app.get('/contact', (req, res) => {
        console.log("Contact Page");
        res.render('Contact');
    });

    app.get('/signup', (req, res) => {
        console.log("Signup Page");
        res.render('Signup', { error: null });
    });

    app.get('/recordinfo', (req, res) => {
        console.log("Record driver Page");
        res.render('Records-rides', { error: null });
    });

    app.get('/profile', (req, res) => {
        const user = req.session.user; // Fetch from session
        if (!user || !user.uuid) {
            return res.status(400).send('User UUID not found');
        }
        res.render('profile', { username: user.username, uuid: user.uuid });
    });

    app.get('/driverlogin', (req, res) => {
        console.log("DriverLogin Page");
        res.render('DriverLogin',{ error: null });
    });

    app.get('//booking-confirmation', (req, res) => {
        console.log("DriverLogin Page");
        res.render('booking-confirmation',{ error: null });
    });

    app.get('/driversignup', (req, res) => {
        console.log("DriverSignup Page");
        res.render('DriverSignup', { error: null }); // Pass error as null initially
    });

    app.get('/driverprofile', (req, res) => {
        console.log("Driver Page");
        res.render('Driverprofile');
    });

    app.get('/driverRecord', (req, res) => {
        console.log("Driver Record");
        res.render('driverRecord');
    });

    app.get('/Booking', (req, res) => {
        console.log("Booking Page");
        res.render('Booking'); // Pass error as null initially
    });

    // Signup route
    app.post("/signup", async (req, res) => {
        const { uname, psw } = req.body;

        try {
            if (!uname || !psw) {
                return res.status(400).send('Username and password are required.');
            }

            // Check if the user already exists
            const existingUser = await User.findOne({ uname });
            if (existingUser) {
                return res.status(400).send('User already exists. Please choose a different username.');
            }

            // Hash the password using bcrypt
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(psw, saltRounds);

            // Generate UUID for the new user
            const userUUID = uuidv4();

            // Create a new user with UUID
            const newUser = new User({
                uname,
                pwd: hashedPassword,
                uuid: userUUID // Add the UUID field
            });

            // Save the new user to the database
            await newUser.save();

            // Redirect or render login page after signup
            res.render('Login');
        } catch (error) {
            console.error('Error signing up user:', error);
            res.status(500).send('Error signing up user');
        }
    });



    app.post("/login", async (req, res) => {
        const { username, pwd } = req.body;
        try {
            const user = await User.findOne({ uname: username });

            if (!user) {
                return res.status(404).send('User not found');
            }

            const validPassword = await bcrypt.compare(pwd, user.pwd);
            if (!validPassword) {
                return res.status(401).send('Invalid password');
            }

            // Store user details in the session
            req.session.user = { uuid: user.uuid, username: user.uname };

            // Redirect to profile page
            res.render('Profile', { username: user.uname, uuid: user.uuid });
        } catch (error) {
            console.error('Error logging in:', error);
            res.status(500).send('Error logging in');
        }
    });

    function wapas(){
        var i=1;
    }    

  app.post('/api/send-otp', async (req, res) => {
    const { rideId } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate OTP
    const uniqueId = uuidv4(); // Generate a new UUID

    try {
        console.log("Generated OTP:", otp);
        
        // Check if the booking exists
        const booking = await CabBooking.findById(rideId);
        
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Ride not found' });
        }

        // Update the booking with the generated OTP and UUID if it doesn't have one
        const result = await CabBooking.findByIdAndUpdate(rideId, { otp, uuid: uniqueId }, { new: true });
        
        console.log("Database update result:", result);

        res.status(200).json({ success: true, otp, uuid: uniqueId }); // Return the OTP and UUID
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ success: false, message: 'Error generating OTP' });
    }
});

app.post('/api/validate-otp', async (req, res) => {
    const { uuid, otp } = req.body; // Get uuid and otp from the request body

    // Check if uuid is provided
    if (!uuid) {
        return res.status(400).json({ success: false, message: 'UUID is required' });
    }

    try {
        // Find the booking by uuid
        const ride = await CabBooking.findOne({ uuid }); // Use findOne with uuid

        console.log("Fetched Ride for validation:", ride); // Log fetched ride

        if (ride) {
            console.log("Ride OTP from DB:", ride.otp);
            console.log("User input OTP:", otp);

            if (ride.otp === otp) {
                // Update status to ongoing and clear the OTP
                const updatedRide = await CabBooking.findOneAndUpdate(
                    { status: 'ongoing', otp: null }, // Set status to ongoing and clear OTP
                    { new: true } // Return the updated document
                );

                console.log("Updated Ride:", updatedRide); // Log the updated ride

                res.status(200).json({ success: true, message: 'Ride started successfully!', ride: updatedRide });
            } else {
                console.log("Invalid OTP detected");
                res.status(400).json({ success: false, message: 'Invalid OTP' });
            }
        } else {
            res.status(404).json({ success: false, message: 'Ride not found' });
        }
    } catch (error) {
        console.error('Error validating OTP:', error);
        res.status(500).json({ success: false, message: 'Error validating OTP' });
    }
});

    app.get('/ride-info', async (req, res) => {
        try {
            const bookings = await CabBooking.find();
            res.render('ride-info', { bookings: bookings });
        } catch (error) {
            console.error('Error fetching bookings:', error);
            res.status(500).send('Error fetching bookings');
        }
    });

    app.post('/search-riderss', async (req, res) => {
        console.log(`Received request body: ${JSON.stringify(req.body)}`); // Log the received body
        const { startLocation } = req.body; 
        console.log(`Received startLocation: ${startLocation}`); // Log the received location

        try {
            const bookings = await CabBooking.find({ start: startLocation, status: 'upcoming' });
            console.log(`Fetched bookings: ${JSON.stringify(bookings)}`);
            res.json(bookings);
        } catch (error) {
            console.error(error);
            res.status(500).send('Server error');
        }
    });

    app.get('/api/rides', async (req, res) => {
        const { uuid } = req.query; // Get uuid from query parameters

        try {
            const rides = await CabBooking.find({ uuid: uuid }); // Fetch rides for this user only
            res.json(rides);
        } catch (error) {
            console.error('Error fetching rides:', error);
            res.status(500).send('Error fetching rides.');
        }
    });

    const authenticateDriver = (req, res, next) => {
        const token = req.headers.authorization?.split(' ')[1]; // Get token from the Authorization header

        if (!token) {
            return res.status(401).json({ message: 'Unauthorized access, token missing' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify and decode the token
            req.user = decoded; // Attach the decoded user data to req.user
            next(); // Proceed to the next middleware
        } catch (error) {
            return res.status(403).json({ message: 'Invalid token' });
        }
    };

    app.post("/accept-riderr", async (req, res) => {
        const { bookingId } = req.body;

        try {
            // Update the booking status to "ongoing"
            const updatedBooking = await CabBooking.findByIdAndUpdate(bookingId, { status: 'ongoing' }, { new: true });

            if (!updatedBooking) {
                return res.status(404).json({ success: false, message: 'Ride not found' });
            }

            res.json({ success: true, message: 'Ride accepted and status updated to ongoing' });
        } catch (error) {
            console.error('Error accepting ride:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    });



    app.post("/book-cab", async (req, res) => {
        const { name, city, source, destination, weight, vtype, date, cost } = req.body;
        const user = req.session.user; // Assuming you're using sessions

        // Debugging: log session and user data
        console.log('Session data:', req.session);
        console.log('User:', user);

        if (!user || !user.uuid) {
            return res.status(400).send('User is not authenticated or uuid is missing.');
        }

        try {
            const cabBooking = new CabBooking({
                name,
                city,
                source,
                destination,
                weight,
                vtype,
                date: new Date(date),
                cost,
                uuid: user.uuid // Now safely accessing uuid
            });
            await cabBooking.save();
            res.redirect('/profile');
        } catch (error) {
            console.error('Error saving booking:', error);
            res.status(500).send('Error saving booking. Please try again.');
        }
    });




    app.get('/booking-confirmation/:bookingId', async (req, res) => {
        try {
            const { bookingId } = req.params;
            const booking = await CabBooking.findById(bookingId);
            console.log('Booking details:', booking); // Add this line for debugging
            res.render('booking-confirmation', { booking: booking });
        } catch (error) {
            console.error('Error rendering booking confirmation:', error);
            res.status(500).send('Error rendering booking confirmation');
        }
    });


    app.get('/booking-confirmation/:bookingId', async (req, res) => {
        try {
            const { bookingId } = req.params;
            const booking = await CabBooking.findById(bookingId);
            res.render('booking-confirmation', { booking: booking });
        } catch (error) {
            console.error('Error rendering booking confirmation:', error);
            res.status(500).send('Error rendering booking confirmation');
        }
    });

    app.post("/accept-ride", async (req, res) => {
        const { bookingId, driverId } = req.body;

        try {
            // Update the driver's availability status to false
            await Driver.findByIdAndUpdate(driverId, { available: false });

            // Update the booking with the driver's information
            await CabBooking.findByIdAndUpdate(bookingId, { driverId });

            // Redirect to the booking confirmation page
            res.redirect('/booking-confirmation/' + bookingId);
        } catch (error) {
            console.error('Error accepting ride:', error);
            res.status(500).send('Error accepting ride');
        }
    });

    app.get('/acceptedride/:id', async (req, res) => {
        try {
            const {id} = req.params;
            const booking = await CabBooking.findById(id);
            res.render('Acceptedride', { booking: booking });
        } catch (error) {
            console.error('Error rendering Acceptedride:', error);
            res.status(500).send('Error rendering Acceptedride');
        }
    });

    // Middleware for logging requests
    app.use((req, res, next) => {
        console.log("Received request body:", req.body);
        next();
    });

    app.post("/driverlogin", async (req, res) => {
        const { duname, dpwd } = req.body;

        try {
            // Find the driver in the database
            const driver = await Driver.findOne({ duname });

            // If driver does not exist
            if (!driver) {
                return res.status(404).send('Driver not found');
            }

            // Trim and normalize whitespace in the submitted password
            const submittedPassword = dpwd.trim();

            // Trim and normalize whitespace in the hashed password from the database
            const databasePassword = driver.dpwd.trim();

            // Log information for debugging
            console.log('Submitted password:', submittedPassword);
            console.log('Length of submitted password:', submittedPassword.length);
            console.log('Hashed password from database:', databasePassword);
            console.log('Length of hashed password from database:', databasePassword.length);
            console.log('Comparing passwords...');

            // Compare the passwords after converting both to the same format and encoding
            const validPassword = await bcrypt.compare(submittedPassword, databasePassword);

            // Log the result of the comparison
            console.log('Is password valid?', validPassword);

            // If passwords match
            if (validPassword) {
                console.log('Password is valid');
                
                // Update the driver's availability status to true
                await Driver.findByIdAndUpdate(driver._id, { available: true });

                // Render the Driverprofile page
                res.render('Driverprofile', { username: driver.duname });
            } else {
                console.log('Invalid password');
                res.status(401).send('Invalid password');
            }
        } catch (error) {
            console.error('Error logging in:', error);
            res.status(500).send('Error logging in');
        }
    });

    app.post("/driversignup", async (req, res) => {
        const { uname, psw } = req.body;

        try {
            if (!uname || !psw) {
                return res.status(400).send('Username and password are required.');
            }

            // Check if the driver already exists in the database
            const existingDriver = await Driver.findOne({ duname: uname });
            if (existingDriver) {
                return res.status(400).send('Driver already exists. Please choose a different username.');
            }

            // Hash the password using bcrypt
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(psw, saltRounds);

            // Create a new driver with hashed password
            const newDriver = new Driver({
                duname: uname,
                dpwd: hashedPassword
            });

            // Save the new driver to the database
            console.log("Saving new driver...");
            await newDriver.save();
            console.log("Driver registered successfully!");
            res.render('DriverLogin');
        } catch (error) {
            console.error('Error registering driver:', error);
            res.status(500).send('Error registering driver');
        }
    });

    app.use((req, res, next) => {
        console.log("Received request body:", req.body);
        next();
    });

    app.use((err, req, res, next) => {
        console.error('Error:', err);
        res.status(500).send(`Something broke! Error: ${err.message}`);
    });

    const PORT = 8001;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
