// models/CabBooking.js

import mongoose from 'mongoose';

const cabBookingSchema = new mongoose.Schema({
    name: String,
    source: String,
    destination: String,
    date: Date,
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver' // Reference the Driver model
    }
});

const CabBooking = mongoose.model('CabBooking', cabBookingSchema);

export default CabBooking;
