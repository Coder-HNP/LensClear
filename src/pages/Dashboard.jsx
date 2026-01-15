import { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import DeviceCard from "../components/DeviceCard";
import Timeline from "../components/Timeline";
import SystemHealth from "../components/SystemHealth";
import ControlPanel from "../components/ControlPanel";
import DeviceLinker from "../components/DeviceLinker";
import { useDevice } from "../context/DeviceContext";
import { Layers, Wifi, RefreshCw } from "lucide-react";

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
    const { devices = [], currentDeviceData } = useDevice();

    const onlineCount = devices.filter(d =>
        d.status?.toLowerCase().includes('online') ||
        d.status?.toLowerCase().includes('active') ||
        d.status?.toLowerCase().includes('idle')
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

                        {/* Top Main Card Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-8">
                                <DeviceCard />

                                <div className="flex flex-col md:flex-row gap-3">
                                    <StatCard
                                        icon={Layers}
                                        label="Total Devices"
                                        value={devices.length}
                                        colorClass="text-blue-500"
                                    />
                                    <StatCard
                                        icon={Wifi}
                                        label="Active Devices"
                                        value={onlineCount}
                                        colorClass="text-green-500"
                                    />
                                </div>
                            </div>

                            {/* System Healthy Card */}
                            <div className="lg:col-span-1">
                                <SystemHealth />
                            </div>
                        </div>

                        {/* Bottom Grid Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Recent Activity Column */}
                            <div className="lg:col-span-2">
                                <Timeline />
                            </div>

                            {/* Controls and Registration Column */}
                            <div className="lg:col-span-1 space-y-6">
                                <ControlPanel />
                                <DeviceLinker />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
