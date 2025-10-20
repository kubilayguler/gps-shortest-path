const { Warehouse, Company, Order } = require('../models');
const geocodingService = require('../services/geocoding.service');

class WarehouseController {
    static async getWarehouses(req, res) {
        try {
            const { companyId, roleId } = req.user;

            // pagination parameters
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;
            
            const whereClause = roleId === 1 ? {} : { company_id: companyId };
            
            const { count, rows: warehouses } = await Warehouse.findAndCountAll({
                where: whereClause,
                include: [
                    { model: Company, as: 'company', attributes: ['id', 'name'] }
                ],
                order: [['created_at', 'DESC']],
                limit,
                offset
            });

            return res.json({
                success: true,
                data: warehouses,
                pagination: {
                    total: count,
                    page,
                    limit,
                    totalPages: Math.ceil(count / limit)
                }
            });
        } catch (error) {
            console.error('Get warehouses error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to get warehouses',
                error: error.message
            });
        }
    }

    static async createWarehouse(req, res) {
        try {
            const { name, address, phone, company_id } = req.body;
            const { companyId, roleId } = req.user;

            if (!name || !address) {
                return res.status(400).json({
                    success: false,
                    message: 'Name and address are required'
                });
            }

            // geocode address to get coordinates
            let latitude = null;
            let longitude = null;
            
            try {
                const geoResult = await geocodingService.addressToLatLng(address);
                latitude = geoResult.lat;
                longitude = geoResult.lng;
            } catch (geoError) {
                console.warn('Geocoding failed for address:', address, geoError.message);
            }

            const warehouse = await Warehouse.create({
                name,
                address,
                latitude,
                longitude,
                phone,
                company_id: roleId === 1 ? company_id : companyId,
                status: 'active'
            });

            return res.status(201).json({
                success: true,
                message: 'Warehouse created successfully',
                data: warehouse
            });
        } catch (error) {
            console.error('Create warehouse error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to create warehouse',
                error: error.message
            });
        }
    }

    static async updateWarehouse(req, res) {
        try {
            const { id } = req.params;
            const { address } = req.body;
            const updates = { ...req.body };

            const warehouse = await Warehouse.findByPk(id);
            if (!warehouse) {
                return res.status(404).json({
                    success: false,
                    message: 'Warehouse not found'
                });
            }

            if (address && address !== warehouse.address) {
                try {
                    const geoResult = await geocodingService.addressToLatLng(address);
                    updates.latitude = geoResult.lat;
                    updates.longitude = geoResult.lng;
                } catch (geoError) {
                    console.warn('Geocoding failed for address:', address, geoError.message);
                }
            }

            await warehouse.update(updates);

            return res.json({
                success: true,
                message: 'Warehouse updated successfully',
                data: warehouse
            });
        } catch (error) {
            console.error('Update warehouse error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update warehouse',
                error: error.message
            });
        }
    }

    static async deleteWarehouse(req, res) {
        try {
            const { id } = req.params;

            const warehouse = await Warehouse.findByPk(id);
            if (!warehouse) {
                return res.status(404).json({
                    success: false,
                    message: 'Warehouse not found'
                });
            }

            await warehouse.destroy();

            return res.json({
                success: true,
                message: 'Warehouse deleted successfully'
            });
        } catch (error) {
            console.error('Delete warehouse error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to delete warehouse',
                error: error.message
            });
        }
    }
}

module.exports = WarehouseController;
