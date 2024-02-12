const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    mail: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

const User = require('./User');
const houseSchema = new mongoose.Schema({
    bathrooms: {
        type: Number,
        required: true,
    },
    bedrooms: {
        type: Number,
        required: true,
    },
    discountedPrice: {
        type: String,
        required: function () {
            return this.offer === true;
        },
    },
    furnished: {
        type: Boolean,
        required: true,
    },
    geoLocation: {
        lat: {
            type: Number,
            required: true,
        },
        lng: {
            type: Number,
            required: true,
        },
    },
    imageUrls: {
        type: [String],
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    offer: {
        type: Boolean,
        required: true,
    },
    parking: {
        type: Boolean,
        required: true,
    },
    regularPrice: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    type: {
        type: String,
        required: true,
    },
    userRef: {
        type: String,
        required: true,
    },
});

const Listing = mongoose.model('Listing', houseSchema);

module.exports = Listing;
