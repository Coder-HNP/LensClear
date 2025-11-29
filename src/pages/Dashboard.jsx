import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import DeviceCard from "../components/DeviceCard";
import LiveChart from "../components/LiveChart";
import AlertsPanel from "../components/AlertsPanel";
import ControlPanel from "../components/ControlPanel";
import Timeline from "../components/Timeline";
import DeviceLinker from "../components/DeviceLinker";
import CommandHistory from "../components/CommandHistory";
import SystemHealth from "../components/SystemHealth";
import { useDevice } from "../context/DeviceContext";

const Dashboard = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { devices = [], setSelectedDeviceId } = useDevice();
    const [searchParams] = useSearchParams();

    // Handle URL query param for device selection
    useEffect(() => {
        const deviceIdFromUrl = searchParams.get("deviceId");
        if (deviceIdFromUrl) {
            setSelectedDeviceId(deviceIdFromUrl);
        }
    }, [searchParams, setSelectedDeviceId]);

    return (
        <div className="min-h-screen bg-light-gray flex flex-col">
            <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />

                <main className="flex-1 p-4 md:p-6 overflow-y-auto h-[calc(100vh-4rem)]">
                    <div className="max-w-7xl mx-auto space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-dark-gray">Dashboard</h1>
                                <p className="text-gray-500 text-sm">Overview of your connected devices</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-500">
                                    {devices?.length || 0} Device{(devices?.length || 0) !== 1 ? 's' : ''} Online
                                </span>
                            </div>
                        </div>

                        {/* Top Row: Device Card & Alerts */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                <DeviceCard />
                            </div>
                            <div className="lg:col-span-1 h-full">
                                <AlertsPanel />
                            </div>
                        </div>

                        {/* Middle Row: Chart & Controls */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                <LiveChart />
                                <CommandHistory />
                            </div>
                            <div className="lg:col-span-1 space-y-6">
                                <ControlPanel />
                                <SystemHealth />
                                <DeviceLinker />
                            </div>
                        </div>

                        {/* Bottom Row: Timeline */}
                        <div className="grid grid-cols-1">
                            <Timeline />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
