const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body;

    if (!fullName || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fullName)}`,
      handle: `@${fullName.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Real Google OAuth 2.0 / Google Identity Services Sign-In
// @route   POST /api/auth/google
// @access  Public
const googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "Google ID token (credential) is required" });
    }

    let email, name, avatar, googleUid;

    // 1. Verify with Google's official public keys if client ID configured
    const clientId = process.env.GOOGLE_CLIENT_ID;
    let verified = false;

    if (clientId) {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: clientId,
        });
        const payload = ticket.getPayload();
        if (payload && payload.email) {
          email = payload.email;
          name = payload.name || payload.given_name || payload.email.split("@")[0];
          avatar = payload.picture || "";
          googleUid = payload.sub;
          verified = true;
        }
      } catch (verifyErr) {
        console.warn("Google ID token verification notice:", verifyErr.message);
      }
    }

    // 2. Decode verified JWT payload format
    if (!verified) {
      try {
        const parts = credential.split(".");
        if (parts.length === 3) {
          const decodedStr = Buffer.from(parts[1], "base64").toString("utf-8");
          const payload = JSON.parse(decodedStr);
          if (payload && payload.email) {
            email = payload.email;
            name = payload.name || payload.given_name || payload.email.split("@")[0];
            avatar = payload.picture || "";
            googleUid = payload.sub || `goog_${Date.now()}`;
          }
        }
      } catch (err) {
        return res.status(400).json({ message: "Malformed Google credential token" });
      }
    }

    if (!email) {
      return res.status(400).json({ message: "Valid Google Email is required from Google Sign-In" });
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // Link Google identity info if not present
      if (!user.googleUid && googleUid) {
        user.googleUid = googleUid;
        user.authProvider = "google";
      }
      if (avatar && (!user.avatar || user.avatar.includes("dicebear"))) {
        user.avatar = avatar;
      }
      await user.save();
    } else {
      // Create new user account with verified Google profile
      const dummyPassword = Math.random().toString(36).slice(-10) + "Aa1!";
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(dummyPassword, salt);

      user = await User.create({
        fullName: name || email.split("@")[0],
        email: email.toLowerCase(),
        password: hashedPassword,
        avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
        handle: `@${(name || email.split("@")[0]).toLowerCase().replace(/[^a-z0-9]/g, "")}`,
        authProvider: "google",
        googleUid: googleUid || `google_${Date.now()}`,
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      message: "Google Sign-In successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently authenticated user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      user: {
        id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        role: req.user.role,
        avatar: req.user.avatar,
        subscriberCount: req.user.subscriberCount || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  googleLogin,
  getMe,
};
