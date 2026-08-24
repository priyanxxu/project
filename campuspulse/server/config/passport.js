import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import User from '../models/User.js';

function hasOAuthConfig(...keys) {
  return keys.every(key => Boolean(process.env[key]?.trim()));
}

const callbackUrl = (envName, fallback) => process.env[envName]?.trim() || fallback;

async function findOrCreateOAuthUser({ provider, providerId, name, email, avatar }) {
  if (!providerId) throw new Error(`${provider} did not provide a user id`);

  let user = await User.findOne({ provider, providerId });
  if (user) return user;

  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error(`${provider} did not provide an email address. Please use email/password registration.`);
  }

  user = await User.findOne({ email: normalizedEmail });

  if (user) {
    // Link the provider to the existing account instead of creating a duplicate.
    user.provider = provider;
    user.providerId = providerId;
    if (!user.avatar && avatar) user.avatar = avatar;
    await user.save();
    return user;
  }

  return User.create({
    name: name?.trim() || 'CampusPulse User',
    email: normalizedEmail,
    password: null,
    role: 'student',
    provider,
    providerId,
    avatar: avatar || ''
  });
}

export function configurePassport() {
  if (hasOAuthConfig('GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET')) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: callbackUrl('GOOGLE_CALLBACK_URL', 'http://localhost:5000/api/auth/google/callback')
    }, async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const user = await findOrCreateOAuthUser({
          provider: 'google',
          providerId: profile.id,
          name: profile.displayName,
          email,
          avatar: profile.photos?.[0]?.value
        });
        done(null, user);
      } catch (error) {
        done(error);
      }
    }));
  }

  if (hasOAuthConfig('GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET')) {
    passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: callbackUrl('GITHUB_CALLBACK_URL', 'http://localhost:5000/api/auth/github/callback')
    }, async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value || profile._json?.email;
        const user = await findOrCreateOAuthUser({
          provider: 'github',
          providerId: profile.id,
          name: profile.displayName || profile.username,
          email,
          avatar: profile.photos?.[0]?.value
        });
        done(null, user);
      } catch (error) {
        done(error);
      }
    }));
  }

  if (hasOAuthConfig('FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET')) {
    passport.use(new FacebookStrategy({
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: callbackUrl('FACEBOOK_CALLBACK_URL', 'http://localhost:5000/api/auth/facebook/callback'),
      profileFields: ['id', 'displayName', 'email', 'picture.type(large)']
    }, async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const user = await findOrCreateOAuthUser({
          provider: 'facebook',
          providerId: profile.id,
          name: profile.displayName,
          email,
          avatar: profile.photos?.[0]?.value
        });
        done(null, user);
      } catch (error) {
        done(error);
      }
    }));
  }

  return passport;
}
