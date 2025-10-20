const express = require('express');
const router = express.Router();
const UserController = require('../controller/user.controller');
const { authMiddleware, requireRole } = require('../middleware/auth');

/**
 * POST /api/users/register
 * Register new user (Admin/Manager only)
 */
router.post('/register', authMiddleware, requireRole([1, 2]), UserController.register);

/**
 * GET /api/users
 * Get all users with optional role filter (Admin/Manager)
 */
router.get('/', authMiddleware, requireRole([1, 2]), UserController.getAllUsers);

/**
 * GET /api/users/drivers
 * Get all drivers (Admin/Manager/Employee)
 */
router.get('/drivers', authMiddleware, requireRole([1, 2, 3]), UserController.getDrivers);

/**
 * GET /api/users/profile
 * Get current user profile (protected)
 */
router.get('/profile', authMiddleware, UserController.getProfile);

/**
 * GET /api/users/:id
 * Get user by ID (Admin/Manager)
 */
router.get('/:id', authMiddleware, requireRole([1, 2]), UserController.getUserById);

/**
 * PUT /api/users/:id
 * Update user (Admin/Manager)
 */
router.put('/:id', authMiddleware, requireRole([1, 2]), UserController.updateUser);

/**
 * DELETE /api/users/:id
 * Delete user (Admin/Manager)
 */
router.delete('/:id', authMiddleware, requireRole([1, 2]), UserController.deleteUser);

module.exports = router;