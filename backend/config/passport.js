import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

export default function(passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback',
        passReqToCallback: true, // Allows us to pass the request object to the callback
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          // The `req.user` object is populated by our JWT middleware if the user is already logged in.
          // We use this to link the Google account to an existing user.
          const loggedInUser = req.user;

          if (loggedInUser) {
            // If user is already logged in, link the Google account
            const user = await User.findById(loggedInUser.id);
            if (!user) {
              return done(null, false, { message: 'User not found.' });
            }

            user.googleId = profile.id;
            user.googleAccessToken = accessToken;
            // Note: The refresh token is only sent on the first authorization
            if (refreshToken) {
                user.googleRefreshToken = refreshToken;
            }
            await user.save();
            return done(null, user);

          } else {
             // This flow is for if a user is logging in/signing up directly with Google,
             // which is outside the scope of this sprint's goal (connecting an existing account).
             // We will handle this in a future sprint if needed.
             return done(null, false, { message: 'Please log in first to connect your account.' });
          }
        } catch (err) {
          console.error(err);
          return done(err, false);
        }
      }
    )
  );
}