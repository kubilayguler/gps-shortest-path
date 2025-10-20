'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLoading } from '@/contexts/LoadingContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost, apiPatch } from '@/utils/api';

interface Order {
    id: string;
    order_number: string;
    delivery_address: string;
    delivery_lat: number;
    delivery_lng: number;
    status: 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'cancelled';
    estimated_delivery: string | null;
    actual_delivery: string | null;
    notes: string;
    delivery_group_id: string | null;
    delivery_group_name: string | null;
    warehouse?: {
        name: string;
        address: string;
        latitude: number;
        longitude: number;
    };
}

export default function MyOrdersPage() {
    const { user } = useAuth();
    const { isLoading, setLoading } = useLoading();
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [selectAll, setSelectAll] = useState(false);
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
    const router = useRouter();

    // pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => {
        fetchMyOrders();
    }, [currentPage, itemsPerPage]);

    // if selectedOrders change, update selectAll
    useEffect(() => {
        const availableOrders = orders.filter(order =>
            order.status === 'assigned' || order.status === 'in_transit'
        );
        setSelectAll(availableOrders.length > 0 && selectedOrders.length === availableOrders.length);
    }, [selectedOrders, orders]);

    const fetchMyOrders = async () => {
        try {
            setLoading(true);
            const data = await apiGet(`/orders/my-orders-grouped?page=${currentPage}&limit=${itemsPerPage}`);
            if (data.success) {
                setOrders(data.data);
                if (data.pagination) {
                    setTotalItems(data.pagination.total);
                    setTotalPages(data.pagination.totalPages);
                }
            }
        } catch (error) {
            console.error('Failed to fetch my orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (checked: boolean) => {
        setSelectAll(checked);
        if (checked) {
            const availableOrders = orders.filter(order =>
                order.status === 'assigned' || order.status === 'in_transit'
            );
            setSelectedOrders(availableOrders.map(order => order.id));
        } else {
            setSelectedOrders([]);
        }
    };

    const handleSelectOrder = (orderId: string, checked: boolean) => {
        if (checked) {
            setSelectedOrders(prev => [...prev, orderId]);
        } else {
            setSelectedOrders(prev => prev.filter(id => id !== orderId));
            setSelectAll(false);
        }
    };

    const handleBulkSelect = (count: number) => {
        const availableOrders = orders.filter(order =>
            order.status === 'assigned' || order.status === 'in_transit'
        ).slice(0, count);
        setSelectedOrders(availableOrders.map(order => order.id));
        setSelectAll(availableOrders.length === orders.filter(order =>
            order.status === 'assigned' || order.status === 'in_transit'
        ).length);
    };

    const handleStartDelivery = async () => {
        if (selectedOrders.length === 0) {
            alert('Please select at least one order to start delivery');
            return;
        }

        if (!confirm(`Start delivery for ${selectedOrders.length} selected orders?`)) {
            return;
        }

        try {
            setLoading(true);

            const data = await apiPost('/orders/start-delivery', {
                orderIds: selectedOrders
            });

            if (data.success) {
                if (data.data && data.data.waypoints && data.data.waypoints.length >= 2) {

                    try {
                        sessionStorage.removeItem('calculatedRoute');
                    } catch (e) {
                        console.warn('Failed to clear old route:', e);
                    }

                    try {
                        sessionStorage.setItem('deliveryWaypoints', JSON.stringify(data.data.waypoints));

                        const routeData = {
                            stops: data.data.waypoints,
                            timestamp: Date.now(),
                            currentSegmentIndex: 0
                        };
                        sessionStorage.setItem('calculatedRoute', JSON.stringify(routeData));
                    } catch (storageError) {
                        console.error('Failed to save to sessionStorage:', storageError);
                    }

                    setSelectedOrders([]);
                    setSelectAll(false);

                    // small delay to ensure storage is written before navigation
                    setTimeout(() => {
                        router.push('/dashboard/routing');
                    }, 100);
                } else if (data.data && data.data.waypoints && data.data.waypoints.length === 1) {
                    console.error('Only 1 waypoint received. Need at least 2 for routing.');
                } else {
                    console.error('No waypoints received from backend.');
                }
            } else {
                console.error('Backend returned error:', data);
            }
        } catch (error) {
            console.error('Failed to start delivery:', error);
            alert('Failed to start delivery');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
        try {
            setLoading(true);
            const data = await apiPatch(`/orders/${orderId}/status`, {
                status: newStatus
            });

            if (data.success) {
                fetchMyOrders();
            } else {
                alert(data.message || 'Failed to update status');
            }
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Failed to update status');
        } finally {
            setLoading(false);
        }
    };

    /* NOTE: those functions are kept for future use but currently not used

    const handleMarkDelivered = (orderId: string) => {
        const confirmDelivery = window.confirm('Are you sure you want to mark this order as delivered? This action can be undone.');
        if (confirmDelivery) {
            handleUpdateStatus(orderId, 'delivered');
        }
    };

    const handleUndoDelivery = (orderId: string) => {
        const confirmUndo = window.confirm('Are you sure you want to mark this order as not delivered?');
        if (confirmUndo) {
            handleUpdateStatus(orderId, 'assigned');
        }
    };

    const handleOrderSelection = (orderId: string) => {
        setSelectedOrders(prev =>
            prev.includes(orderId)
                ? prev.filter(id => id !== orderId)
                : [...prev, orderId]
        );
    };

    const handleCreateRoute = async () => {
        if (selectedOrders.length < 2) {
            alert('Please select at least 2 orders.');
            return;
        }

        try {
            setLoading(true);

            const selectedOrderObjects = orders.filter(order => selectedOrders.includes(order.id));

            const warehouse = selectedOrderObjects[0]?.warehouse;
            if (!warehouse) {
                alert('Warehouse information not found.');
                return;
            }

            const stops = [
                {
                    lat: Number(warehouse.latitude),
                    lng: Number(warehouse.longitude),
                    address: warehouse.address,
                    type: 'warehouse'
                },
                ...selectedOrderObjects.map(order => ({
                    lat: Number(order.delivery_lat),
                    lng: Number(order.delivery_lng),
                    address: order.delivery_address,
                    type: 'delivery',
                    orderId: order.id
                }))
            ];

            localStorage.setItem('routeStops', JSON.stringify(stops));

            await Promise.all(
                selectedOrderObjects.map(order =>
                    handleUpdateStatus(order.id, 'in_transit')
                )
            );

            setSelectedOrders([]);

            router.push('/dashboard/routing');
        } catch (error) {
            console.error('Failed to create route:', error);
            alert('Failed to create route.');
        } finally {
            setLoading(false);
        }
    };

    */
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

    const groupOrders = () => {
        const grouped: { [key: string]: Order[] } = {};
        const ungrouped: Order[] = [];

        orders.forEach(order => {
            if (order.status === 'cancelled') return;

            if (order.delivery_group_id && order.delivery_group_name) {
                if (!grouped[order.delivery_group_id]) {
                    grouped[order.delivery_group_id] = [];
                }
                grouped[order.delivery_group_id].push(order);
            } else {
                ungrouped.push(order);
            }
        });

        return { grouped, ungrouped };
    };

    const { grouped, ungrouped } = groupOrders();

    // Sort grouped entries by delivery group name in descending order (Delivery 3, Delivery 2, Delivery 1)
    const sortedGroupedEntries = Object.entries(grouped).sort((a, b) => {
        const aName = a[1][0]?.delivery_group_name || '';
        const bName = b[1][0]?.delivery_group_name || '';

        // Extract numbers from "Delivery X"
        const aMatch = aName.match(/Delivery (\d+)/);
        const bMatch = bName.match(/Delivery (\d+)/);

        if (aMatch && bMatch) {
            const aNum = parseInt(aMatch[1]);
            const bNum = parseInt(bMatch[1]);
            return bNum - aNum; // Descending order (3, 2, 1)
        }

        return bName.localeCompare(aName);
    });

    const toggleGroup = (groupId: string) => {
        setCollapsedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupId)) {
                newSet.delete(groupId);
            } else {
                newSet.add(groupId);
            }
            return newSet;
        });
    };

    const handleSelectGroup = (groupOrders: Order[], checked: boolean) => {
        const groupOrderIds = groupOrders
            .filter(order => order.status === 'assigned' || order.status === 'in_transit')
            .map(order => order.id);

        if (checked) {
            setSelectedOrders(prev => [...new Set([...prev, ...groupOrderIds])]);
        } else {
            setSelectedOrders(prev => prev.filter(id => !groupOrderIds.includes(id)));
        }
    };

    return (
        <div className="p-8">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
                    <p className="text-gray-600 mt-1">Manage your assigned deliveries</p>
                </div>

                {/* Driver toolbar */}
                <div className="flex items-center space-x-3">
                    {/* Bulk Selection Buttons */}
                    <div className="flex items-center space-x-2">
                        <span className="text-gray-600">Quick select:</span>
                        <button
                            onClick={() => handleBulkSelect(5)}
                            className="w-8 px-2 py-1 text-sm bg-neutral-200 text-gray-700 rounded border border-gray-300 hover:bg-gray-300 transition"
                        >
                            5
                        </button>
                        <button
                            onClick={() => handleBulkSelect(10)}
                            className="w-8 px-2 py-1 text-sm bg-neutral-200 text-gray-700 rounded border border-gray-300 hover:bg-gray-300 transition"
                        >
                            10
                        </button>
                        <button
                            onClick={() => handleBulkSelect(20)}
                            className="w-8 px-2 py-1 text-sm bg-neutral-200 text-gray-700 rounded border border-gray-300 hover:bg-gray-300 transition"
                        >
                            20
                        </button>
                    </div>

                    {/* Start Delivery Button */}
                    <button
                        onClick={handleStartDelivery}
                        disabled={selectedOrders.length === 0}
                        className={`px-4 py-2 rounded-lg transition flex items-center space-x-2 ${selectedOrders.length === 0
                            ? 'bg-gray-300 text-gray-800 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        <span>Start Delivery ({selectedOrders.length})</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={selectAll}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Select All
                                    </span>
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Order #
                            </th>
                            <th className="px-6 py-3 w-96 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Delivery Address
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estimated Delivery
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {/* Render grouped orders - sorted from newest to oldest */}
                        {sortedGroupedEntries.map(([groupId, groupOrders]) => {
                            const groupName = groupOrders[0]?.delivery_group_name || 'Unknown Group';
                            const isCollapsed = collapsedGroups.has(groupId);
                            const groupSelectableOrders = groupOrders.filter(order =>
                                order.status === 'assigned' || order.status === 'in_transit'
                            );
                            const allGroupOrdersSelected = groupSelectableOrders.length > 0 &&
                                groupSelectableOrders.every(order => selectedOrders.includes(order.id));

                            // Calculate group status
                            const hasInTransit = groupOrders.some(o => o.status === 'in_transit');
                            const hasDelivered = groupOrders.some(o => o.status === 'delivered');
                            const allDelivered = groupOrders.every(o => o.status === 'delivered');

                            return (
                                <React.Fragment key={groupId}>
                                    {/* Group Header Row - Clickable */}
                                    <tr className="bg-gradient-to-r from-indigo-50 to-blue-50 border-t-2 border-indigo-200 hover:from-indigo-100 hover:to-blue-100 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={allGroupOrdersSelected}
                                                onChange={(e) => handleSelectGroup(groupOrders, e.target.checked)}
                                                disabled={groupSelectableOrders.length === 0}
                                                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 cursor-pointer" onClick={() => toggleGroup(groupId)}>
                                            <div className="flex items-center space-x-2">
                                                {/* Collapse/Expand Icon */}
                                                <svg
                                                    className={`w-4 h-4 text-indigo-600 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>

                                                {/* Group Icon */}
                                                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                </svg>

                                                <span className="font-bold text-indigo-900">{groupName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 cursor-pointer" onClick={() => toggleGroup(groupId)}>
                                            <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full font-medium">
                                                {groupOrders.length} {groupOrders.length === 1 ? 'order' : 'orders'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => toggleGroup(groupId)}>
                                            {/* Group Status */}
                                            {allDelivered ? (
                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                    All Delivered
                                                </span>
                                            ) : hasInTransit ? (
                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                                    In Transit
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    Assigned
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer" onClick={() => toggleGroup(groupId)}>
                                            {/* Empty for alignment */}
                                        </td>
                                    </tr>

                                    {/* Group Orders - Collapsible */}
                                    {!isCollapsed && groupOrders.map((order) => {
                                        const canSelect = order.status === 'assigned' || order.status === 'in_transit';
                                        const isSelected = selectedOrders.includes(order.id);

                                        return (
                                            <tr key={order.id} className={`${isSelected ? 'bg-blue-50' : 'bg-gray-50'} border-l-4 border-indigo-300`}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={(e) => handleSelectOrder(order.id, e.target.checked)}
                                                        disabled={!canSelect}
                                                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    <span className="ml-6">#{order.order_number}</span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    {order.delivery_address}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                                        {order.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {order.estimated_delivery ? new Date(order.estimated_delivery).toLocaleDateString() : '-'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </React.Fragment>
                            );
                        })}

                        {/* Render ungrouped orders */}
                        {ungrouped.map((order) => {
                            const canSelect = order.status === 'assigned' || order.status === 'in_transit';
                            const isSelected = selectedOrders.includes(order.id);

                            return (
                                <tr key={order.id} className={isSelected ? 'bg-blue-50' : ''}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={(e) => handleSelectOrder(order.id, e.target.checked)}
                                            disabled={!canSelect}
                                            className={"w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"}
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        #{order.order_number}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {order.delivery_address}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                            {order.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {order.estimated_delivery ? new Date(order.estimated_delivery).toLocaleDateString() : '-'}
                                    </td>
                                </tr>
                            );
                        })}
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
                            deliveries per page (Total: {totalItems})
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

                {orders.length === 0 && (
                    <div className="p-8 text-center">
                        <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Assigned</h3>
                        <p className="text-gray-500">You don't have any assigned orders yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
