const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Role, Company, Warehouse } = require('../models');

// role definitions
const ROLES = {
    ADMIN: 1,
    MANAGER: 2,
    EMPLOYEE: 3,
    DRIVER: 4
};

class UserController {

    static async register(req, res) {
        try {
            const { name, email, password, phone, role_id, company_id, warehouse_id } = req.body;

            if (!name || !email || !password || !role_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Name, email, password and role are required'
                });
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Please enter a valid email address'
                });
            }

            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 6 characters'
                });
            }

            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User with this email already exists'
                });
            }

            const currentUser = await User.findByPk(req.user.userId);

            if (currentUser.role_id === ROLES.MANAGER && 
                (role_id === ROLES.ADMIN || role_id === ROLES.MANAGER)) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions to create this role'
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = await User.create({
                name,
                email,
                password: hashedPassword,
                phone,
                role_id,
                company_id: company_id || currentUser.company_id,
                warehouse_id: warehouse_id || null
            });

            return res.status(201).json({
                success: true,
                message: 'User created successfully',
                data: {
                    id: newUser.id,
                    name: newUser.name,
                    email: newUser.email,
                    role: newUser.role_id
                }
            });

        } catch (error) {
            console.error('Register error:', error);
            return res.status(500).json({
                success: false,
                message: 'Registration failed',
                error: error.message
            });
        }
    }


    static async getAllUsers(req, res) {
        try {
            const { role } = req.query;
            const currentUser = await User.findByPk(req.user.userId);

            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            const whereClause = {};
            
            // if Manager, only show users from same company and lower roles
            if (currentUser.role_id === ROLES.MANAGER) {
                whereClause.company_id = currentUser.company_id;
                
                if (role) {
                    const requestedRole = parseInt(role);
                    // Manager can only see Employee (3) and Driver (4)
                    if (requestedRole === ROLES.EMPLOYEE || requestedRole === ROLES.DRIVER) {
                        whereClause.role_id = requestedRole;
                    } else {
                        return res.status(403).json({
                            success: false,
                            message: 'Access denied to this role'
                        });
                    }
                } else {
                    // Show all employees and drivers
                    whereClause.role_id = { [require('sequelize').Op.in]: [ROLES.EMPLOYEE, ROLES.DRIVER] };
                }
            } else if (role) {
                // Admin can filter by any role
                whereClause.role_id = parseInt(role);
            }

            const { count, rows: users } = await User.findAndCountAll({
                where: whereClause,
                include: [
                    { model: Role, as: 'role' },
                    { model: Company, as: 'company' },
                    { model: Warehouse, as: 'warehouse' }
                ],
                order: [['created_at', 'DESC']],
                limit,
                offset
            });

            return res.json({
                success: true,
                data: users,
                pagination: {
                    total: count,
                    page,
                    limit,
                    totalPages: Math.ceil(count / limit)
                }
            });

        } catch (error) {
            console.error('Get all users error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to get users',
                error: error.message
            });
        }
    }


    static async getDrivers(req, res) {
        try {
            const currentUser = await User.findByPk(req.user.userId);

            const whereClause = {
                role_id: ROLES.DRIVER
            };

            // If Manager or Employee, only show drivers from same company
            if (currentUser.role_id === ROLES.MANAGER || currentUser.role_id === ROLES.EMPLOYEE) {
                whereClause.company_id = currentUser.company_id;
            }

            const drivers = await User.findAll({
                where: whereClause,
                include: [
                    { model: Role, as: 'role' },
                    { model: Company, as: 'company' },
                    { model: Warehouse, as: 'warehouse' }
                ],
                order: [['created_at', 'DESC']]
            });

            return res.json({
                success: true,
                data: drivers
            });

        } catch (error) {
            console.error('Get drivers error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to get drivers',
                error: error.message
            });
        }
    }

    static async getUserById(req, res) {
        try {
            const { id } = req.params;
            const currentUser = await User.findByPk(req.user.userId);

            const user = await User.findByPk(id, {
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

            // If Manager, can only view users from same company
            if (currentUser.role_id === ROLES.MANAGER && user.company_id !== currentUser.company_id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            return res.json({
                success: true,
                data: user
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


    static async updateUser(req, res) {
        try {
            const { id } = req.params;
            const { name, email, phone, role_id, company_id, warehouse_id, is_active, password } = req.body;
            const currentUser = await User.findByPk(req.user.userId);

            const user = await User.findByPk(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // If Manager, can only update users from same company
            if (currentUser.role_id === ROLES.MANAGER && user.company_id !== currentUser.company_id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            // Manager can't promote to Admin or Manager
            if (currentUser.role_id === ROLES.MANAGER && role_id && 
                (role_id === ROLES.ADMIN || role_id === ROLES.MANAGER)) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions to set this role'
                });
            }

            const updateData = {};
            if (name) updateData.name = name;
            if (email) updateData.email = email;
            if (phone) updateData.phone = phone;
            if (role_id) updateData.role_id = role_id;
            if (company_id && currentUser.role_id === ROLES.ADMIN) updateData.company_id = company_id;
            if (warehouse_id !== undefined) updateData.warehouse_id = warehouse_id || null;
            if (typeof is_active !== 'undefined') updateData.is_active = is_active;
            if (password) {
                updateData.password = await bcrypt.hash(password, 10);
            }

            await user.update(updateData);

            return res.json({
                success: true,
                message: 'User updated successfully',
                data: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role_id
                }
            });

        } catch (error) {
            console.error('Update user error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update user',
                error: error.message
            });
        }
    }


    static async deleteUser(req, res) {
        try {
            const { id } = req.params;
            const currentUser = await User.findByPk(req.user.userId);

            const user = await User.findByPk(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // If Manager, can only delete users from same company
            if (currentUser.role_id === ROLES.MANAGER && user.company_id !== currentUser.company_id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            // Can't delete yourself
            if (user.id === currentUser.id) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete yourself'
                });
            }

            await user.destroy(); // Soft delete with paranoid

            return res.json({
                success: true,
                message: 'User deleted successfully'
            });

        } catch (error) {
            console.error('Delete user error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to delete user',
                error: error.message
            });
        }
    }

    static async getProfile(req, res) {
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
            console.error('Get profile error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to get user profile',
                error: error.message
            });
        }
    }
}

module.exports = UserController;