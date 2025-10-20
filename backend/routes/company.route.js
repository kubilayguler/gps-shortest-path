const express = require('express');
const router = express.Router();
const CompanyController = require('../controller/company.controller');
const { authMiddleware, requireRole } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Get all companies (Admin only)
router.get('/', requireRole([1]), CompanyController.getAllCompanies);

// Get single company
router.get('/:id', requireRole([1, 2]), CompanyController.getCompany);

// Get company statistics
router.get('/:id/stats', requireRole([1, 2]), CompanyController.getCompanyStats);

// Create company (Admin/Manager)
router.post('/', requireRole([1, 2]), CompanyController.createCompany);

// Update company
router.put('/:id', requireRole([1, 2]), CompanyController.updateCompany);

// Delete company (Admin only)
router.delete('/:id', requireRole([1]), CompanyController.deleteCompany);

module.exports = router;
