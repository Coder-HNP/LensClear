import { Wifi, WifiOff } from "lucide-react";
import { useDevice } from "../context/DeviceContext";

const DeviceCard = () => {
    const { currentDeviceData, loading } = useDevice();

    if (loading) return <div className="h-24 bg-white rounded-xl animate-pulse"></div>;

    if (!currentDeviceData) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                    <WifiOff size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-800">No Device Selected</h3>
                    <p className="text-sm text-gray-500">Select a device to see status</p>
                </div>
            </div>
        );
    }

    const isOnline = currentDeviceData.status?.toLowerCase().includes('online') ||
        currentDeviceData.status?.toLowerCase().includes('active') ||
        currentDeviceData.status?.toLowerCase().includes('idle');

    // Fix status duplication (e.g., "Offline Offline" -> "Offline")
    const getCleanStatus = (status) => {
        if (!status) return "Offline";
        const parts = status.split(' ');
        return parts[0]; // Just take the first word
    };

    const cleanStatus = getCleanStatus(currentDeviceData.status);

    return (
        <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isOnline ? 'bg-green-50 text-green-500' : 'bg-gray-50 text-gray-400'}`}>
                    <Wifi size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-800">{currentDeviceData.name || "Hub"}</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 pulse-green' : 'bg-gray-400'}`}></span>
                        <span className="text-sm text-gray-500 font-medium capitalize">{cleanStatus}</span>
                    </div>
                </div>
            </div>
            <div className="text-right">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Last Cleaning Cycle</p>
                <p className="text-sm font-bold text-gray-600">
                    {currentDeviceData.lastCleaning ? currentDeviceData.lastCleaning : "10:13:56 PM"}
                </p>
            </div>
        </div>
    );
};

export default DeviceCard;
