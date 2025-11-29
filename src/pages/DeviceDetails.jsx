import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import LiveChart from "../components/LiveChart";
import ControlPanel from "../components/ControlPanel";
import LogsTable from "../components/LogsTable";
import { useDevice } from "../context/DeviceContext";
import { ArrowLeft, Wifi, Battery, Signal, Activity, Cpu } from "lucide-react";

const DeviceDetails = () => {
    const { id } = useParams();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { devices, setSelectedDeviceId, currentDeviceData } = useDevice();

    useEffect(() => {
        if (id) {
            setSelectedDeviceId(id);
        }
    }, [id, setSelectedDeviceId]);

    const device = devices.find(d => d.id === id) || currentDeviceData;

    if (!device) return <div className="min-h-screen bg-light-gray flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-light-gray flex flex-col">
            <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />

                <main className="flex-1 p-4 md:p-6 overflow-y-auto h-[calc(100vh-4rem)]">
                    <div className="max-w-7xl mx-auto space-y-6">
                        <div className="flex items-center gap-4">
                            <Link to="/devices" className="p-2 bg-white rounded-lg hover:bg-gray-50 text-gray-500 transition-colors">
                                <ArrowLeft size={20} />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-dark-gray">{device.name}</h1>
                                <p className="text-gray-500 text-sm font-mono">ID: {device.id}</p>
                            </div>
                        </div>

                        {/* Status Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${device.status === 'online' ? 'bg-green-50 text-leaf-green' : 'bg-gray-50 text-gray-400'}`}>
                                    <Wifi size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Status</p>
                                    <p className="font-bold text-gray-800 capitalize">{device.status || 'Unknown'}</p>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-50 text-bright-blue">
                                    <Battery size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Battery</p>
                                    <p className="font-bold text-gray-800">{device.battery || 0}%</p>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-purple-50 text-purple-500">
                                    <Signal size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Signal</p>
                                    <p className="font-bold text-gray-800">{device.signal || 0} dBm</p>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-orange-50 text-orange-500">
                                    <Cpu size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Firmware</p>
                                    <p className="font-bold text-gray-800">{device.firmware || '1.0.0'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                <LiveChart />
                                <LogsTable limit={5} />
                            </div>
                            <div className="lg:col-span-1">
                                <ControlPanel />
                                <div className="mt-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <Activity size={20} className="text-gray-400" />
                                        Device Info
                                    </h3>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between py-2 border-b border-gray-50">
                                            <span className="text-gray-500">Type</span>
                                            <span className="font-medium text-gray-800 capitalize">{device.type || 'Sensor Hub'}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-gray-50">
                                            <span className="text-gray-500">Mode</span>
                                            <span className="font-medium text-gray-800 capitalize">{device.mode || 'Normal'}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-gray-50">
                                            <span className="text-gray-500">Last Sync</span>
                                            <span className="font-medium text-gray-800">
                                                {device.updatedAt?.toDate?.().toLocaleString() || 'Never'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-gray-50">
                                            <span className="text-gray-500">Created</span>
                                            <span className="font-medium text-gray-800">
                                                {device.createdAt?.toDate?.().toLocaleDateString() || 'Unknown'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DeviceDetails;
