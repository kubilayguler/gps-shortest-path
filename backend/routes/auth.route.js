const express = require('express');
const router = express.Router();
const AuthController = require('../controller/auth.controller');
const { authMiddleware } = require('../middleware/auth');

/**
 * POST /api/auth/login
 * Login endpoint
 */
router.post('/login', AuthController.login);

/**
 * POST /api/auth/logout
 * Logout endpoint (protected)
 */
router.post('/logout', authMiddleware, AuthController.logout);

/**
 * GET /api/auth/me
 * Get current user info (protected)
 */
router.get('/me', authMiddleware, AuthController.getMe);

/**
 * GET /api/auth/menu
 * Get menu items based on user role (protected)
 */
router.get('/menu', authMiddleware, AuthController.getMenu);

module.exports = router;