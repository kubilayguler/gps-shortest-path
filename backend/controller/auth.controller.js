const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { JWT_SECRET } = require('../middleware/auth');
const { User, Role, Company, Warehouse } = require('../models');

// Role-based menu access
const ROLE_MENUS = {
    1: [ // Admin
        { id: 'dashboard', name: 'Dashboard', path: '/dashboard', icon: 'home' },
        { id: 'companies', name: 'Companies', path: '/dashboard/companies', icon: 'building' },
        { id: 'warehouses', name: 'Warehouses', path: '/dashboard/warehouses', icon: 'warehouse' },
        { id: 'users', name: 'All Users', path: '/dashboard/users', icon: 'users' },
        { id: 'orders', name: 'All Orders', path: '/dashboard/orders', icon: 'package' },
    ],
    2: [ // Manager
        { id: 'dashboard', name: 'Dashboard', path: '/dashboard', icon: 'home' },
        { id: 'warehouses', name: 'Warehouses', path: '/dashboard/warehouses', icon: 'warehouse' },
        { id: 'employees', name: 'Employees', path: '/dashboard/employees', icon: 'users' },
        { id: 'drivers', name: 'Drivers', path: '/dashboard/drivers', icon: 'truck' },
        { id: 'orders', name: 'Orders', path: '/dashboard/orders', icon: 'package' },
    ],
    3: [ // Employee
        { id: 'dashboard', name: 'Dashboard', path: '/dashboard', icon: 'home' },
        { id: 'orders', name: 'Orders', path: '/dashboard/orders', icon: 'package' },
    ],
    4: [ // Driver
        { id: 'dashboard', name: 'Dashboard', path: '/dashboard', icon: 'home' },
        { id: 'my-orders', name: 'My Orders', path: '/dashboard/my-orders', icon: 'package' },
        { id: 'routing', name: 'GPS Routing', path: '/dashboard/routing', icon: 'map' }
    ]
};

class AuthController {

    static async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }

            const user = await User.findOne({
                where: { email, is_active: true },
                include: [
                    { model: Role, as: 'role' },
                    { model: Company, as: 'company' },
                    { model: Warehouse, as: 'warehouse' }
                ]
            });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            const isValidPassword = await bcrypt.compare(password, user.password);

            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            await user.update({ last_login: new Date() });

            const token = jwt.sign(
                {
                    userId: user.id,
                    email: user.email,
                    roleId: user.role_id,
                    companyId: user.company_id,
                    warehouseId: user.warehouse_id
                },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            // Set HttpOnly cookie
            res.cookie('accessToken', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', // HTTPS only in production
                sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // 'lax' for localhost
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            return res.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role_id,
                        roleName: user.role?.name,
                        warehouse_id: user.warehouse_id,
                        warehouse: user.warehouse ? {
                            id: user.warehouse.id,
                            name: user.warehouse.name,
                            address: user.warehouse.address
                        } : null,
                        company: user.company ? {
                            id: user.company.id,
                            name: user.company.name
                        } : null
                    }
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({
                success: false,
                message: 'Login failed',
                error: error.message
            });
        }
    }


    static async getMe(req, res) {
        try {
            const user = await User.findByPk(req.user.userId, {
                include: [
                    { model: Role, as: 'role' },
                    { model: Company, as: 'company' },
                    { model: Warehouse, as: 'warehouse' }
                ]
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            return res.json({
                success: true,
                data: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role_id,
                    roleName: user.role?.name,
                    warehouse_id: user.warehouse_id,
                    warehouse: user.warehouse ? {
                        id: user.warehouse.id,
                        name: user.warehouse.name,
                        address: user.warehouse.address
                    } : null,
                    company: user.company ? {
                        id: user.company.id,
                        name: user.company.name
                    } : null
                }
            });

        } catch (error) {
            console.error('Get user error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to get user',
                error: error.message
            });
        }
    }

    static async getMenu(req, res) {
        try {
            const user = await User.findByPk(req.user.userId, {
                include: [{ model: Role, as: 'role' }]
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const menu = ROLE_MENUS[user.role_id] || [];

            return res.json({
                success: true,
                data: {
                    menu: menu
                }
            });

        } catch (error) {
            console.error('Get menu error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to get menu',
                error: error.message
            });
        }
    }


    static async logout(req, res) {
        try {
            res.clearCookie('accessToken', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });

            return res.json({
                success: true,
                message: 'Logged out successfully'
            });

        } catch (error) {
            console.error('Logout error:', error);
            return res.status(500).json({
                success: false,
                message: 'Logout failed',
                error: error.message
            });
        }
    }
}

module.exports = AuthController;
