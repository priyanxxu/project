import { Router } from 'express';
import passport from 'passport';
import { login, logout, me, oauthCallback, oauthFailure, oauthStart, register } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, me);
router.post('/logout', logout);

router.get('/google', oauthStart('google'), passport.authenticate('google', { session: false, scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/api/auth/google/failure' }), oauthCallback('google'));
router.get('/google/failure', oauthFailure('google'));

router.get('/github', oauthStart('github'), passport.authenticate('github', { session: false, scope: ['user:email'] }));
router.get('/github/callback', passport.authenticate('github', { session: false, failureRedirect: '/api/auth/github/failure' }), oauthCallback('github'));
router.get('/github/failure', oauthFailure('github'));

router.get('/facebook', oauthStart('facebook'), passport.authenticate('facebook', { session: false, scope: ['email'] }));
router.get('/facebook/callback', passport.authenticate('facebook', { session: false, failureRedirect: '/api/auth/facebook/failure' }), oauthCallback('facebook'));
router.get('/facebook/failure', oauthFailure('facebook'));

export default router;
