const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true, // Removes whitespace from both ends of a string
    minlength: 3 // Minimum length of the username
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true, // Converts email to lowercase
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'] // Email validation regex
  },
  password: {
    type: String,
    required: true,
    minlength: 6 // Minimum length of the password
  },
  roles: {
    type: [String], // Array of strings for different roles (e.g., 'user', 'admin', 'editor')
    default: ['user'] // Default role for new users
  },
  createdAt: {
    type: Date,
    default: Date.now // Timestamp of user creation
  },
  updatedAt: {
    type: Date,
    default: Date.now // Timestamp of last update
  }
});

// Pre-save hook to update the 'updatedAt' field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;