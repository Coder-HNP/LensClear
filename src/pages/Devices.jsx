import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import DeviceLinker from "../components/DeviceLinker";
import { useDevice } from "../context/DeviceContext";
import { useAuth } from "../context/AuthContext";
import { getUserDevices, unlinkDeviceFromUser, renameDevice } from "../utils/firestoreAPI";
import { Wifi, Trash2, Loader2, AlertCircle, Edit2, Check, X } from "lucide-react";

import LogsTable from "../components/LogsTable";
import DeviceControls from "../components/DeviceControls";
import { ChevronLeft } from "lucide-react";

const Devices = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { setSelectedDeviceId } = useDevice();
    const { user } = useAuth();

    const [userDevices, setUserDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [newName, setNewName] = useState("");
    const [selectedDevice, setSelectedDevice] = useState(null);

    // Subscribe to user's devices via Firestore real-time listener
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const unsubscribe = getUserDevices(user.uid, (devices) => {
            setUserDevices(devices);

            // Update selected device data if active
            if (selectedDevice) {
                const updatedSelected = devices.find(d => d.id === selectedDevice.id);
                if (updatedSelected) setSelectedDevice(updatedSelected);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleRemove = async (e, deviceId) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this device?")) {
            try {
                await unlinkDeviceFromUser(user.uid, deviceId);
                if (selectedDevice?.id === deviceId) setSelectedDevice(null);
            } catch (err) {
                setError("Failed to delete device: " + err.message);
            }
        }
    };

    const handleRename = async (e) => {
        e.stopPropagation();
        if (!editingId || !newName.trim()) return;
        try {
            await renameDevice(user.uid, editingId, newName);
            setEditingId(null);
        } catch (err) {
            setError("Failed to rename device.");
        }
    };

    const startEditing = (e, device) => {
        e.stopPropagation();
        setEditingId(device.id);
        setNewName(device.name);
    };

    const handleCardClick = (device) => {
        if (editingId) return;
        setSelectedDevice(device);
    };

    return (
        <div className="min-h-screen bg-light-gray flex flex-col">
            <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />

                <main className="flex-1 p-4 md:p-6 overflow-y-auto h-[calc(100vh-4rem)]">
                    <div className="max-w-7xl mx-auto space-y-6">

                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-dark-gray">Devices</h1>
                                <p className="text-gray-500 text-sm">Manage your connected hardware</p>
                            </div>
                            {selectedDevice && (
                                <button
                                    onClick={() => setSelectedDevice(null)}
                                    className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
                                >
                                    <ChevronLeft size={20} /> Back to List
                                </button>
                            )}
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2">
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        {!selectedDevice ? (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Device List */}
                                <div className="lg:col-span-2 space-y-4">
                                    {loading ? (
                                        <div className="space-y-4">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 animate-pulse">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                                                        <div className="flex-1 space-y-2">
                                                            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                                            <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : userDevices.length === 0 ? (
                                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                                            <p className="text-gray-400">No devices linked yet.</p>
                                        </div>
                                    ) : (
                                        userDevices.map((device) => (
                                            <div
                                                key={device.id}
                                                onClick={() => handleCardClick(device)}
                                                className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group"
                                            >
                                                <div className="flex items-center gap-4 w-full">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${device.status === 'online' ? 'bg-green-50 text-leaf-green' : 'bg-gray-50 text-gray-400'}`}>
                                                        <Wifi size={24} />
                                                    </div>
                                                    <div className="flex-1">
                                                        {editingId === device.id ? (
                                                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                                <input
                                                                    type="text"
                                                                    value={newName}
                                                                    onChange={(e) => setNewName(e.target.value)}
                                                                    className="border border-gray-300 rounded px-2 py-1 text-sm w-full max-w-[200px]"
                                                                    autoFocus
                                                                />
                                                                <button onClick={(e) => handleRename(e)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={16} /></button>
                                                                <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="p-1 text-red-600 hover:bg-red-50 rounded"><X size={16} /></button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-bold text-gray-800">{device.name || "Unnamed Device"}</h3>
                                                                <button onClick={(e) => startEditing(e, device)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-primary transition-opacity">
                                                                    <Edit2 size={14} />
                                                                </button>
                                                            </div>
                                                        )}
                                                        <p className="text-xs text-gray-400 font-mono">ID: {device.id}</p>
                                                        <p className="text-xs text-gray-400 font-mono mt-0.5">
                                                            Auth ID: {device.authToken ? (
                                                                <span className="bg-gray-100 px-1 rounded select-all text-gray-600 font-medium">{device.authToken}</span>
                                                            ) : (
                                                                <span className="text-gray-300 italic">Generate in details</span>
                                                            )}
                                                        </p>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${device.status === 'online' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                                                {(device.status && device.status.toLowerCase() !== 'unknown') ? device.status : 'Offline'}
                                                            </span>
                                                            {device.lastOnline && (
                                                                <span className="text-xs text-gray-400">
                                                                    Last seen: {device.lastOnline?.toDate?.().toLocaleDateString?.() || (device.lastOnline instanceof Date ? device.lastOnline.toLocaleDateString() : 'Never')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={(e) => handleRemove(e, device.id)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete Device"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Sidebar Actions */}
                                <div className="lg:col-span-1">
                                    <DeviceLinker />
                                </div>
                            </div>
                        ) : (
                            /* Detailed Device View */
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-right duration-300">
                                <div className="space-y-6">
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${selectedDevice.status === 'online' ? 'bg-green-50 text-leaf-green' : 'bg-gray-50 text-gray-400'}`}>
                                                    <Wifi size={24} />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-bold text-gray-800">{selectedDevice.name}</h2>
                                                    <p className="text-xs text-gray-400 font-mono">ID: {selectedDevice.id}</p>
                                                </div>
                                            </div>
                                            <span className={`text-sm font-medium px-3 py-1 rounded-full ${selectedDevice.status === 'online' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                                {selectedDevice.status || 'Offline'}
                                            </span>
                                        </div>

                                        <div className="border-t border-gray-100 pt-6">
                                            <DeviceControls deviceId={selectedDevice.id} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <LogsTable deviceId={selectedDevice.id} />
                                </div>
                            </div>
                        )}

                    </div>
                </main>
            </div>
        </div>
    );
};

export default Devices;
