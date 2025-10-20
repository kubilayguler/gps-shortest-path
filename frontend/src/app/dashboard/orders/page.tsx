'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLoading } from '@/contexts/LoadingContext';
import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiDelete, apiPut } from '@/utils/api';

interface Order {
    id: string;
    order_number: string;
    delivery_address: string;
    status: 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'cancelled';
    estimated_delivery: string | null;
    actual_delivery: string | null;
    notes: string;
    company_id: string;
    warehouse_id: string;
    driver_id: string | null;
    warehouse?: {
        name: string;
    };
    driver?: {
        name: string;
    };
    creator?: {
        name: string;
    };
}

interface Driver {
    id: string;
    name: string;
}

interface Warehouse {
    id: string;
    name: string;
    address: string;
}

export default function OrdersPage() {
    const { user } = useAuth();
    const { isLoading, setLoading } = useLoading();
    const [orders, setOrders] = useState<Order[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showStatusConfirmModal, setShowStatusConfirmModal] = useState(false);
    const [pendingStatusChange, setPendingStatusChange] = useState<{ oldStatus: string, newStatus: string } | null>(null);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [assigningOrder, setAssigningOrder] = useState<Order | null>(null);
    const [selectedDriver, setSelectedDriver] = useState('');

    const [formData, setFormData] = useState({
        order_number: '',
        delivery_address: '',
        estimated_delivery: '',
        notes: '',
        warehouse_id: '',
        status: 'pending' as Order['status']
    });

    // pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => {
        fetchOrders();
        if (user?.role && user.role <= 3) {
            fetchDrivers();
            // Only Manager (role 2) and Admin (role 1) can fetch warehouse list
            if (user.role <= 2) {
                fetchWarehouses();
            }
        }
    }, [currentPage, itemsPerPage]);

    // Employee için warehouse'ı otomatik ayarla
    useEffect(() => {
        if (user?.role === 3 && user?.warehouse?.id) {
            setFormData(prev => ({
                ...prev,
                warehouse_id: user.warehouse!.id
            }));
        }
    }, [user]);

    useEffect(() => {
        if (formData.status === 'pending' || formData.status === 'cancelled') {
            setSelectedDriver(''); // Reset driver selection
        }
    }, [formData.status]);




    const fetchOrders = async () => {
        try {
            setLoading(true);
            const data = await apiGet(`/orders?page=${currentPage}&limit=${itemsPerPage}`);
            if (data.success) {
                setOrders(data.data);
                if (data.pagination) {
                    setTotalItems(data.pagination.total);
                    setTotalPages(data.pagination.totalPages);
                }
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDrivers = async () => {
        try {
            const data = await apiGet('/users/drivers');
            if (data.success) {
                setDrivers(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch drivers:', error);
        }
    };

    const fetchWarehouses = async () => {
        try {
            const data = await apiGet('/warehouses');
            if (data.success) {
                setWarehouses(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch warehouses:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editingOrder && formData.status !== editingOrder.status) {
            setPendingStatusChange({
                oldStatus: editingOrder.status,
                newStatus: formData.status
            });
            setShowStatusConfirmModal(true);
            return;
        }

        await submitOrder();
    };

    const submitOrder = async () => {
        try {
            const method = editingOrder ? 'PUT' : 'POST';

            const requestData = {
                ...formData,
                driver_id: (formData.status === 'pending' || formData.status === 'cancelled')
                    ? null
                    : selectedDriver || null
            };

            const data = editingOrder
                ? await apiPut(`/orders/${editingOrder.id}`, requestData)
                : await apiPost('/orders', requestData);

            if (data.success) {
                fetchOrders();
                handleCloseModal();
            } else {
                alert(data.message || 'Failed to save order');
            }
        } catch (error) {
            console.error('Failed to save order:', error);
            alert('Failed to save order');
        }
    };

    const handleStatusConfirm = async () => {
        setShowStatusConfirmModal(false);
        setPendingStatusChange(null);
        await submitOrder();
    };

    const handleStatusCancel = () => {
        setShowStatusConfirmModal(false);
        setPendingStatusChange(null);
        if (editingOrder) {
            setFormData({ ...formData, status: editingOrder.status });
        }
    };

    const handleAssignDriver = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assigningOrder) return;

        try {
            const data = await apiPost(`/orders/${assigningOrder.id}/assign`, {
                driver_id: selectedDriver
            });

            if (data.success) {
                fetchOrders();
                setShowAssignModal(false);
                setAssigningOrder(null);
                setSelectedDriver('');
            } else {
                alert(data.message || 'Failed to assign driver');
            }
        } catch (error) {
            console.error('Failed to assign driver:', error);
            alert('Failed to assign driver');
        }
    };

    const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
        try {
            const data = await apiPut(`/orders/${orderId}/status`, {
                status: newStatus
            });

            if (data.success) {
                fetchOrders();
            } else {
                alert(data.message || 'Failed to update status');
            }
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Failed to update status');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this order?')) return;

        try {
            const data = await apiDelete(`/orders/${id}`);

            if (data.success) {
                fetchOrders();
            } else {
                alert(data.message || 'Failed to delete order');
            }
        } catch (error) {
            console.error('Failed to delete order:', error);
            alert('Failed to delete order');
        }
    };

    const handleEdit = (order: Order) => {
        setEditingOrder(order);
        setFormData({
            order_number: order.order_number,
            delivery_address: order.delivery_address,
            estimated_delivery: order.estimated_delivery ? order.estimated_delivery.split('T')[0] : '',
            notes: order.notes || '',
            warehouse_id: order.warehouse_id || '',
            status: order.status
        });

        if (order.status === 'pending' || order.status === 'cancelled') {
            setSelectedDriver('');
        } else {
            setSelectedDriver(order.driver_id || '');
        }

        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingOrder(null);
        setSelectedDriver('');
        setFormData({
            order_number: '',
            delivery_address: '',
            estimated_delivery: '',
            notes: '',
            warehouse_id: '',
            status: 'pending'
        });
    };

    const getStatusColor = (status: Order['status']) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            assigned: 'bg-blue-100 text-blue-800',
            in_transit: 'bg-purple-100 text-purple-800',
            delivered: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    if (isLoading) {
        return null; // loading overlay will show globally
    }


    return (
        <div className="p-8">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
                    <p className="text-gray-600 mt-1">Manage delivery orders</p>
                </div>

                {user?.role && user.role <= 3 && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        + Create Order
                    </button>
                )}
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Order #
                            </th>
                            <th className="px-6 w-1/3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Delivery Address
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Warehouse
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Driver
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {orders.map((order) => (
                            <tr key={order.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
                                    <div className="text-sm text-gray-500">
                                        {order.estimated_delivery && new Date(order.estimated_delivery).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900">{order.delivery_address}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {order.warehouse?.name || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {order.driver?.name || (
                                        <span className="text-red-600">Unassigned</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 uppercase inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                        {order.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                    {user?.role && user.role <= 3 && (
                                        <>
                                            <button
                                                onClick={() => handleEdit(order)}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                Edit
                                            </button>
                                            {!order.driver_id && (
                                                <button
                                                    onClick={() => {
                                                        setAssigningOrder(order);
                                                        setShowAssignModal(true);
                                                    }}
                                                    className="text-green-600 hover:text-green-900"
                                                >
                                                    Assign
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(order.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination Controls */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-700">Show</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                        </select>
                        <span className="text-sm text-gray-700">
                            entries (Total: {totalItems})
                        </span>
                    </div>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                        >
                            Previous
                        </button>

                        <span className="text-sm text-gray-700">
                            Page {currentPage} of {totalPages}
                        </span>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6">
                            {editingOrder ? 'Edit Order' : 'Create Order'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Order Number *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.order_number}
                                        onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                {/* Warehouse Selection - Manager/Admin can select, Employee sees info */}
                                {user?.role && user.role <= 2 ? (
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Warehouse *
                                        </label>
                                        <select
                                            required
                                            value={formData.warehouse_id}
                                            onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">-- Select a warehouse --</option>
                                            {warehouses.map((warehouse) => (
                                                <option key={warehouse.id} value={warehouse.id}>
                                                    {warehouse.name} - {warehouse.address}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : user?.warehouse && (
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Warehouse
                                        </label>
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                            <p className="text-blue-800">
                                                <span className="font-semibold">{user.warehouse.name}</span>
                                                <span className="text-sm text-blue-600 ml-2">({user.warehouse.address})</span>
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {formData.status !== 'pending' && formData.status !== 'cancelled' && (
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Select Driver
                                        </label>
                                        <select
                                            required={true}
                                            value={selectedDriver}
                                            onChange={(e) => setSelectedDriver(e.target.value)}
                                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500`}
                                        >
                                            <option className='text-gray-500 bg-gray-300 ' value="">
                                                -- Select a driver --
                                            </option>
                                            {drivers.map((driver) => (
                                                <option key={driver.id} value={driver.id}>
                                                    {driver.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Delivery Address *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.delivery_address}
                                        onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Estimated Delivery Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.estimated_delivery}
                                        onChange={(e) => setFormData({ ...formData, estimated_delivery: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                {editingOrder && (
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Order Status
                                        </label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value as Order['status'] })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="pending"> Pending</option>
                                            <option value="assigned"> Assigned</option>
                                            <option value="in_transit"> In Transit</option>
                                            <option value="delivered"> Delivered</option>
                                            <option value="cancelled"> Cancelled</option>
                                        </select>
                                        {formData.status !== editingOrder.status && (
                                            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                                                <p className="text-sm text-amber-700 flex items-center">
                                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                    Status will be changed from "{editingOrder.status.replace('_', ' ')}" to "{formData.status.replace('_', ' ')}"
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Notes
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    {editingOrder ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div >
            )
            }

            {/* Assign Driver Modal */}
            {
                showAssignModal && assigningOrder && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-8 max-w-md w-full">
                            <h2 className="text-2xl font-bold mb-6">Assign Driver</h2>
                            <p className="text-gray-600 mb-4">
                                Order: <strong>{assigningOrder.order_number}</strong>
                            </p>
                            <form onSubmit={handleAssignDriver}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Driver *
                                    </label>
                                    <select
                                        required
                                        value={selectedDriver}
                                        onChange={(e) => setSelectedDriver(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Choose a driver</option>
                                        {drivers.map((driver) => (
                                            <option key={driver.id} value={driver.id}>
                                                {driver.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAssignModal(false);
                                            setAssigningOrder(null);
                                            setSelectedDriver('');
                                        }}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Assign
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Status Change Confirmation Modal */}
            {
                showStatusConfirmModal && pendingStatusChange && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mr-3">
                                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Confirm Status Change</h3>
                            </div>

                            <div className="mb-6">
                                <p className="text-gray-600 mb-3">
                                    Are you sure you want to change the order status?
                                </p>
                                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-500">Current Status:</span>
                                        <span className="text-sm font-semibold text-gray-900 capitalize flex items-center">
                                            {pendingStatusChange.oldStatus.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-center">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                        </svg>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-500">New Status:</span>
                                        <span className="text-sm font-semibold text-blue-600 capitalize flex items-center">
                                            {pendingStatusChange.newStatus.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    This action will update the order status permanently.
                                </p>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={handleStatusCancel}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleStatusConfirm}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Confirm Change
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
