const { Company, Warehouse, User, Order } = require('../models');
const geocodingService = require('../services/geocoding.service');

class CompanyController {

    static async getAllCompanies(req, res) {
        try {
            // Pagination parameters
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            const { count, rows: companies } = await Company.findAndCountAll({
                include: [
                    { 
                        model: Warehouse, 
                        as: 'warehouses',
                        attributes: ['id', 'name', 'address']
                    },
                    {
                        model: User,
                        as: 'users',
                        attributes: ['id', 'name', 'email', 'role_id']
                    }
                ],
                order: [['created_at', 'DESC']],
                limit,
                offset
            });

            return res.json({
                success: true,
                data: companies,
                pagination: {
                    total: count,
                    page,
                    limit,
                    totalPages: Math.ceil(count / limit)
                }
            });

        } catch (error) {
            console.error('Get companies error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to get companies',
                error: error.message
            });
        }
    }

    static async getCompany(req, res) {
        try {
            const { id } = req.params;

            const company = await Company.findByPk(id, {
                include: [
                    { model: Warehouse, as: 'warehouses' },
                    { model: User, as: 'users', attributes: ['id', 'name', 'email', 'role_id'] },
                    { model: Order, as: 'orders' }
                ]
            });

            if (!company) {
                return res.status(404).json({
                    success: false,
                    message: 'Company not found'
                });
            }

            return res.json({
                success: true,
                data: company
            });

        } catch (error) {
            console.error('Get company error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to get company',
                error: error.message
            });
        }
    }

    static async createCompany(req, res) {
        try {
            const { name, address, phone, email } = req.body;

            // Validation
            if (!name || !address) {
                return res.status(400).json({
                    success: false,
                    message: 'Name and address are required'
                });
            }

            // Geocode address to get coordinates
            let latitude = null;
            let longitude = null;
            
            try {
                const geoResult = await geocodingService.addressToLatLng(address);
                latitude = geoResult.lat;
                longitude = geoResult.lng;
            } catch (geoError) {
                console.warn('Geocoding failed for address:', address, geoError.message);
                // Continue without coordinates - we'll allow creation even if geocoding fails
            }

            // Create company
            const company = await Company.create({
                name,
                address,
                phone,
                email,
                latitude,
                longitude,
                status: 'active'
            });

            return res.status(201).json({
                success: true,
                message: 'Company created successfully',
                data: company
            });

        } catch (error) {
            console.error('Create company error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to create company',
                error: error.message
            });
        }
    }

    static async updateCompany(req, res) {
        try {
            const { id } = req.params;
            const { name, address, phone, email, status } = req.body;

            const company = await Company.findByPk(id);

            if (!company) {
                return res.status(404).json({
                    success: false,
                    message: 'Company not found'
                });
            }

            // If address is being updated, geocode the new address
            let latitude = company.latitude;
            let longitude = company.longitude;
            
            if (address && address !== company.address) {
                try {
                    const geoResult = await geocodingService.addressToLatLng(address);
                    latitude = geoResult.lat;
                    longitude = geoResult.lng;
                } catch (geoError) {
                    console.warn('Geocoding failed for address:', address, geoError.message);
                    // Keep existing coordinates if geocoding fails
                }
            }

            // Update company
            await company.update({
                name: name || company.name,
                address: address || company.address,
                phone: phone !== undefined ? phone : company.phone,
                email: email !== undefined ? email : company.email,
                latitude,
                longitude,
                status: status || company.status
            });

            return res.json({
                success: true,
                message: 'Company updated successfully',
                data: company
            });

        } catch (error) {
            console.error('Update company error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update company',
                error: error.message
            });
        }
    }

    static async deleteCompany(req, res) {
        try {
            const { id } = req.params;

            const company = await Company.findByPk(id);

            if (!company) {
                return res.status(404).json({
                    success: false,
                    message: 'Company not found'
                });
            }

            // Soft delete
            await company.destroy();

            return res.json({
                success: true,
                message: 'Company deleted successfully'
            });

        } catch (error) {
            console.error('Delete company error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to delete company',
                error: error.message
            });
        }
    }

    static async getCompanyStats(req, res) {
        try {
            const { id } = req.params;

            const company = await Company.findByPk(id, {
                include: [
                    { model: Warehouse, as: 'warehouses' },
                    { model: User, as: 'users' },
                    { model: Order, as: 'orders' }
                ]
            });

            if (!company) {
                return res.status(404).json({
                    success: false,
                    message: 'Company not found'
                });
            }

            const stats = {
                totalWarehouses: company.warehouses.length,
                totalUsers: company.users.length,
                totalOrders: company.orders.length,
                pendingOrders: company.orders.filter(o => o.status === 'pending').length,
                inTransitOrders: company.orders.filter(o => o.status === 'in_transit').length,
                deliveredOrders: company.orders.filter(o => o.status === 'delivered').length
            };

            return res.json({
                success: true,
                data: stats
            });

        } catch (error) {
            console.error('Get company stats error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to get company statistics',
                error: error.message
            });
        }
    }
}

module.exports = CompanyController;
