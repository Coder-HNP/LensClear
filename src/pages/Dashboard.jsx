import { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Timeline from "../components/Timeline";
import SystemHealth from "../components/SystemHealth";
import { useDevice } from "../context/DeviceContext";
import { Layers, Wifi, RefreshCw, AlertTriangle } from "lucide-react";

const StatCard = ({ icon: Icon, label, value, colorClass }) => (
    <div className="flex-1 bg-gray-50/50 p-4 rounded-xl flex items-center gap-4 border border-transparent hover:border-gray-100 transition-all">
        <div className={`p-2 rounded-lg bg-white shadow-sm ${colorClass}`}>
            <Icon size={20} />
        </div>
        <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{label}</p>
            <p className="text-xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const Dashboard = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { devices = [], currentDeviceData, unlinkedDevices = new Set() } = useDevice();

    // Active devices: specifically 'active' status
    const activeCount = devices.filter(d =>
        d.status?.toLowerCase() === 'active'
    ).length;

    // Online devices: 'online', 'active', or 'idle'
    const onlineCount = devices.filter(d =>
        ['online', 'active', 'idle'].includes(d.status?.toLowerCase())
    ).length;

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
            <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />

                <main className="flex-1 p-6 overflow-y-auto h-[calc(100vh-4rem)]">
                    <div className="max-w-7xl mx-auto space-y-6">

                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-extrabold text-[#1E293B]">Dashboard</h1>
                                <p className="text-gray-400 text-xs md:text-sm mt-1">Overview of your connected devices</p>
                            </div>
                            <div className="text-xs md:text-sm font-bold text-gray-400 tracking-tight">
                                {onlineCount} Device{onlineCount !== 1 ? 's' : ''} Online
                            </div>
                        </div>

                        {/* --- Hardware Diagnostic Alert --- */}
                        {[...unlinkedDevices].length > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-4 items-start shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                                    <AlertTriangle size={20} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-amber-800">Hardware Connection Diagnostic</h4>
                                    <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                                        We detected hardware with ID: <span className="font-mono font-bold">{[...unlinkedDevices].join(", ")}</span> trying to connect,
                                        but it's not linked to your account yet.
                                        <br />
                                        <span className="font-semibold underline mt-1 block">Solution:</span> Go to the **Devices** tab and add a device with the exact ID shown above.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Top Main Card Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-8">
                                <div className="flex flex-col md:flex-row gap-3">
                                    <StatCard
                                        icon={Layers}
                                        label="Total Devices"
                                        value={devices.length}
                                        colorClass="text-blue-500"
                                    />
                                    <StatCard
                                        icon={Wifi}
                                        label="Online Devices"
                                        value={onlineCount}
                                        colorClass="text-green-500"
                                    />
                                    <StatCard
                                        icon={RefreshCw}
                                        label="Active Devices"
                                        value={activeCount}
                                        colorClass="text-purple-500"
                                    />
                                </div>
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4">System Overview</h3>
                                    <p className="text-gray-500">Global system status and health metrics.</p>
                                    {/* Placeholder for future global charts if needed */}
                                </div>
                            </div>

                            {/* System Healthy Card */}
                            <div className="lg:col-span-1">
                                <SystemHealth devices={devices} />
                            </div>
                        </div>

                        {/* Bottom Grid Section */}
                        <div className="grid grid-cols-1 gap-6">
                            {/* Recent Activity Column */}
                            <div className="w-full">
                                <Timeline />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
