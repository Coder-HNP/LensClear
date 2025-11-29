import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import DeviceLinker from "../components/DeviceLinker";
import { useDevice } from "../context/DeviceContext";
import { useAuth } from "../context/AuthContext";
import { getUserDevices, unlinkDeviceFromUser, renameDevice } from "../utils/firestoreAPI";
import { Wifi, Trash2, ExternalLink, Loader2, AlertCircle, Edit2, Check, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const Devices = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { setSelectedDeviceId } = useDevice();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [userDevices, setUserDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [newName, setNewName] = useState("");

    useEffect(() => {
        if (!user) return;

        const unsubscribe = getUserDevices(user.uid, (devices) => {
            setUserDevices(devices);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleRemove = async (e, deviceId) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to unlink this device?")) {
            try {
                await unlinkDeviceFromUser(user.uid, deviceId);
            } catch (err) {
                setError("Failed to unlink device: " + err.message);
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

    const handleCardClick = (deviceId) => {
        if (editingId) return; // Don't navigate if editing
        navigate(`/dashboard?deviceId=${deviceId}`);
    };

    return (
        <div className="min-h-screen bg-light-gray flex flex-col">
            <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />

                <main className="flex-1 p-4 md:p-6 overflow-y-auto h-[calc(100vh-4rem)]">
                    <div className="max-w-7xl mx-auto space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-dark-gray">Devices</h1>
                                <p className="text-gray-500 text-sm">Manage your connected hardware</p>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2">
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Device List */}
                            <div className="lg:col-span-2 space-y-4">
                                {loading ? (
                                    <div className="flex justify-center py-12">
                                        <Loader2 size={32} className="animate-spin text-primary" />
                                    </div>
                                ) : userDevices.length === 0 ? (
                                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                                        <p className="text-gray-400">No devices linked yet.</p>
                                    </div>
                                ) : (
                                    userDevices.map((device) => (
                                        <div
                                            key={device.id}
                                            onClick={() => handleCardClick(device.id)}
                                            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-md transition-shadow cursor-pointer group"
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
                                                            <button onClick={handleRename} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={16} /></button>
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
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${device.status === 'online' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                                            {device.status || 'Offline'}
                                                        </span>
                                                        {device.lastOnline && (
                                                            <span className="text-xs text-gray-400">
                                                                Last seen: {device.lastOnline?.toDate?.().toLocaleDateString() || 'Unknown'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={(e) => handleRemove(e, device.id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Unlink Device"
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
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Devices;
