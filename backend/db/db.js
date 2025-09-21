const mongoose = require('mongoose');

// User Profile Schema for Geo-based Professional Networking App
const userProfileSchema = new mongoose.Schema(
	{
		firstName: {
			type: String,
			required: true,
			trim: true,
			maxLength: 50
		},
		lastName: {
			type: String,
			required: true,
			trim: true,
			maxLength: 50
		},
		linkedinUrl: {
			type: String,
			required: true,
			unique: true,
			validate: {
				validator: function (v) {
					return /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/.test(v);
				},
				message: 'Please provide a valid LinkedIn profile URL'
			}
		},
		bio: {
			type: String,
			required: true,
			maxLength: 500,
			trim: true
		},
		headshotImage: {
			type: String,
			required: true,
			validate: {
				validator: function (v) {
					return /\.(jpg|jpeg|png|gif|webp)$/i.test(v);
				},
				message: 'Headshot must be a valid image file (jpg, jpeg, png, gif, webp)'
			}
		}
	},
	{
		timestamps: true
	}
);

// Create and export the model
const UserProfile = mongoose.model('UserProfile', userProfileSchema);

module.exports = UserProfile;
