const { Order, Company, Warehouse, User } = require('../models');
const geocodingService = require('../services/geocoding.service');
const { Sequelize } = require('sequelize');
const crypto = require('crypto');

class OrderController {
    static async getOrders(req, res) {
        try {
            const { companyId, roleId, userId } = req.user;

            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;
            
            let whereClause = {};
            
            if (roleId === 1) {
                // Admin sees all
                whereClause = {};
            } else if (roleId === 4) {
                // Driver sees only assigned orders
                whereClause = { driver_id: userId };
            } else {
                // Manager/Employee see company orders
                whereClause = { company_id: companyId };
            }
            
            const { count, rows: orders } = await Order.findAndCountAll({
                where: whereClause,
                include: [
                    { model: Company, as: 'company', attributes: ['id', 'name'] },
                    { model: Warehouse, as: 'warehouse', attributes: ['id', 'name', 'address', 'latitude', 'longitude'] },
                    { model: User, as: 'driver', attributes: ['id', 'name', 'email'] },
                    { model: User, as: 'creator', attributes: ['id', 'name'] }
                ],
                order: [['created_at', 'DESC']],
                limit,
                offset
            });

            return res.json({
                success: true,
                data: orders,
                pagination: {
                    total: count,
                    page,
                    limit,
                    totalPages: Math.ceil(count / limit)
                }
            });
        } catch (error) {
            console.error('Get orders error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to get orders',
                error: error.message
            });
        }
    }

    static async createOrder(req, res) {
        try {
            const { 
                order_number, 
                delivery_address, 
                driver_id,
                estimated_delivery,
                notes
            } = req.body;
            
            const { companyId, userId, roleId, warehouseId } = req.user;

            // Employee must have a warehouse assigned
            if (roleId === 3 && !warehouseId) {
                return res.status(400).json({
                    success: false,
                    message: 'Your account must be assigned to a warehouse to create orders'
                });
            }

            if (!order_number || !delivery_address) {
                return res.status(400).json({
                    success: false,
                    message: 'Order number and delivery address are required'
                });
            }

            // Geocode delivery address to get coordinates
            let delivery_lat = null;
            let delivery_lng = null;
            
            try {
                const geoResult = await geocodingService.addressToLatLng(delivery_address);
                delivery_lat = geoResult.lat;
                delivery_lng = geoResult.lng;
            } catch (geoError) {
                console.warn('Geocoding failed for delivery address:', delivery_address, geoError.message);
                // Continue without coordinates
            }

            const order = await Order.create({
                order_number,
                company_id: companyId,
                warehouse_id: warehouseId, // Use user's warehouse
                delivery_address,
                delivery_lat,
                delivery_lng,
                driver_id,
                created_by: userId,
                estimated_delivery,
                notes,
                status: driver_id ? 'assigned' : 'pending'
            });

            return res.status(201).json({
                success: true,
                message: 'Order created successfully',
                data: order
            });
        } catch (error) {
            console.error('Create order error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to create order',
                error: error.message
            });
        }
    }

    static async updateOrder(req, res) {
        try {
            const { id } = req.params;
            const { 
                order_number, 
                delivery_address,
                estimated_delivery,
                notes,
                status,
                warehouse_id,
                driver_id
            } = req.body;

            const order = await Order.findByPk(id);
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            const updates = {
                order_number: order_number || order.order_number,
                delivery_address: delivery_address || order.delivery_address,
                estimated_delivery: estimated_delivery !== undefined ? estimated_delivery : order.estimated_delivery,
                notes: notes !== undefined ? notes : order.notes,
                status: status || order.status
            };

            // Update warehouse_id if provided
            if (warehouse_id !== undefined) {
                updates.warehouse_id = warehouse_id;
            }

            // Update driver_id if provided
            if (driver_id !== undefined) {
                updates.driver_id = driver_id;
            }

            // If delivery address is being updated, geocode the new address
            if (delivery_address && delivery_address !== order.delivery_address) {
                try {
                    const geoResult = await geocodingService.addressToLatLng(delivery_address);
                    updates.delivery_lat = geoResult.lat;
                    updates.delivery_lng = geoResult.lng;
                } catch (geoError) {
                    console.warn('Geocoding failed for delivery address:', delivery_address, geoError.message);
                    // Keep existing coordinates if geocoding fails
                }
            }

            await order.update(updates);

            return res.json({
                success: true,
                message: 'Order updated successfully',
                data: order
            });
        } catch (error) {
            console.error('Update order error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update order',
                error: error.message
            });
        }
    }

    static async assignDriver(req, res) {
        try {
            const { id } = req.params;
            const { driver_id } = req.body;

            const order = await Order.findByPk(id);
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            await order.update({
                driver_id,
                status: 'assigned'
            });

            return res.json({
                success: true,
                message: 'Driver assigned successfully',
                data: order
            });
        } catch (error) {
            console.error('Assign driver error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to assign driver',
                error: error.message
            });
        }
    }

    static async updateOrderStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const order = await Order.findByPk(id);
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            const updates = { status };
            if (status === 'delivered') {
                updates.actual_delivery = new Date();
            }

            await order.update(updates);

            return res.json({
                success: true,
                message: 'Order status updated successfully',
                data: order
            });
        } catch (error) {
            console.error('Update order status error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update order status',
                error: error.message
            });
        }
    }

    static async deleteOrder(req, res) {
        try {
            const { id } = req.params;

            const order = await Order.findByPk(id);
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            await order.destroy();

            return res.json({
                success: true,
                message: 'Order deleted successfully'
            });
        } catch (error) {
            console.error('Delete order error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to delete order',
                error: error.message
            });
        }
    }

    static async startDelivery(req, res) {
        try {
            const { orderIds } = req.body;
            const driverId = req.user.userId;

            if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Order IDs are required'
                });
            }

            // Verify all orders belong to this driver and are in correct status
            const orders = await Order.findAll({
                where: {
                    id: orderIds,
                    driver_id: driverId,
                    status: ['assigned', 'in_transit']
                },
                include: [
                    {
                        model: Warehouse,
                        as: 'warehouse',
                        attributes: ['name', 'address', 'latitude', 'longitude']
                    }
                ]
            });

            if (orders.length !== orderIds.length) {
                return res.status(400).json({
                    success: false,
                    message: 'Some orders are not assigned to you or not in correct status'
                });
            }

            // Generate delivery group information
            const deliveryGroupId = crypto.randomUUID();
            
            // Find the next delivery number for this driver
            const maxGroup = await Order.findOne({
                where: { driver_id: driverId },
                attributes: [[require('sequelize').fn('MAX', require('sequelize').col('delivery_group_name')), 'maxGroup']]
            });
            
            let deliveryNumber = 1;
            if (maxGroup && maxGroup.dataValues.maxGroup) {
                const match = maxGroup.dataValues.maxGroup.match(/Delivery (\d+)/);
                if (match) {
                    deliveryNumber = parseInt(match[1]) + 1;
                }
            }
            
            const deliveryGroupName = `Delivery ${deliveryNumber}`;

            // Update all orders to in_transit status and assign delivery group
            await Order.update(
                { 
                    status: 'in_transit',
                    delivery_group_id: deliveryGroupId,
                    delivery_group_name: deliveryGroupName
                },
                { where: { id: orderIds } }
            );

            // Prepare waypoints for routing - only include orders with valid coordinates
            const waypoints = orders
                .filter(order => {
                    const hasCoords = order.delivery_lat != null && order.delivery_lng != null;
                    if (!hasCoords) {
                        console.warn(`Order ${order.id} missing coordinates, skipping from route`);
                    }
                    return hasCoords;
                })
                .map(order => ({
                    orderId: order.id, // Add orderId for tracking
                    id: order.id,
                    orderNumber: order.order_number,
                    lat: parseFloat(order.delivery_lat),
                    lng: parseFloat(order.delivery_lng),
                    address: order.delivery_address,
                    type: 'delivery'
                }));

            // Add warehouse as starting point if it has valid coordinates
            if (orders[0] && orders[0].warehouse) {
                const warehouse = orders[0].warehouse;
                if (warehouse.latitude != null && warehouse.longitude != null) {
                    waypoints.unshift({
                        id: 'warehouse',
                        name: warehouse.name,
                        lat: parseFloat(warehouse.latitude),
                        lng: parseFloat(warehouse.longitude),
                        address: warehouse.address,
                        type: 'warehouse'
                    });
                } else {
                    console.warn('Warehouse missing coordinates, starting from first delivery point');
                }
            }

            return res.json({
                success: true,
                message: `Started delivery for ${orderIds.length} orders`,
                data: {
                    orderIds,
                    status: 'in_transit',
                    deliveryGroupId,
                    deliveryGroupName,
                    waypoints: waypoints,
                    waypointCount: waypoints.length
                }
            });
        } catch (error) {
            console.error('Start delivery error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to start delivery',
                error: error.message
            });
        }
    }

    static async getMyOrdersGrouped(req, res) {
        try {
            const { userId } = req.user;

            // Pagination parameters
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            // First, get all orders for the driver
            const allOrders = await Order.findAll({
                where: { 
                    driver_id: userId,
                    status: { [Sequelize.Op.ne]: 'cancelled' }
                },
                include: [
                    { model: Company, as: 'company', attributes: ['id', 'name'] },
                    { model: Warehouse, as: 'warehouse', attributes: ['id', 'name', 'address', 'latitude', 'longitude'] },
                    { model: User, as: 'driver', attributes: ['id', 'name', 'email'] },
                    { model: User, as: 'creator', attributes: ['id', 'name'] }
                ],
                order: [['created_at', 'DESC']]
            });

            // Separate grouped and ungrouped orders
            const grouped = {};
            const ungrouped = [];

            allOrders.forEach(order => {
                if (order.delivery_group_id && order.delivery_group_name) {
                    if (!grouped[order.delivery_group_id]) {
                        grouped[order.delivery_group_id] = {
                            id: order.delivery_group_id,
                            name: order.delivery_group_name,
                            orders: []
                        };
                    }
                    grouped[order.delivery_group_id].orders.push(order);
                } else {
                    ungrouped.push(order);
                }
            });

            // Convert grouped object to array and sort by delivery number (descending)
            const groupArray = Object.values(grouped).sort((a, b) => {
                const aMatch = a.name.match(/Delivery (\d+)/);
                const bMatch = b.name.match(/Delivery (\d+)/);
                if (aMatch && bMatch) {
                    return parseInt(bMatch[1]) - parseInt(aMatch[1]); // Descending
                }
                return b.name.localeCompare(a.name);
            });

            // Calculate total items (groups + ungrouped orders)
            const totalItems = groupArray.length + ungrouped.length;
            const totalPages = Math.ceil(totalItems / limit);

            // Paginate: Take groups and ungrouped orders together
            const allItems = [...groupArray, ...ungrouped];
            const paginatedItems = allItems.slice(offset, offset + limit);

            // Expand groups back to orders for the paginated items
            const paginatedOrders = [];
            paginatedItems.forEach(item => {
                if (item.orders) {
                    // It's a group
                    paginatedOrders.push(...item.orders);
                } else {
                    // It's an ungrouped order
                    paginatedOrders.push(item);
                }
            });

            return res.json({
                success: true,
                data: paginatedOrders,
                pagination: {
                    total: totalItems,
                    page,
                    limit,
                    totalPages,
                    groupCount: groupArray.length,
                    ungroupedCount: ungrouped.length
                }
            });
        } catch (error) {
            console.error('Get my orders grouped error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to get orders',
                error: error.message
            });
        }
    }
}

module.exports = OrderController;
