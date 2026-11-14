const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "GOOGLE_CLIENT_ID_PLACEHOLDER",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "GOOGLE_CLIENT_SECRET_PLACEHOLDER",
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        "http://localhost:5000/api/user/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        const name = profile.displayName || "Google User";

        // 1. Check if user already exists by googleId
        let user = await User.findOne({ googleId });
        if (user) {
          return done(null, user);
        }

        // 2. Check if user registered previously with the same email
        if (email) {
          user = await User.findOne({ email });
          if (user) {
            user.googleId = googleId;
            await user.save();
            return done(null, user);
          }
        }

        // 3. If new user, create an account
        user = await User.create({
          googleId,
          name,
          email,
        });

        return done(null, user);
      } catch (error) {
        console.error("Error during Google OAuth authentication:", error);
        return done(error, null);
      }
    }
  )
);

module.exports = passport;
