import { Thermometer, Gauge, Activity, Zap, Wifi, WifiOff } from "lucide-react";
import { useDevice } from "../context/DeviceContext";

const MetricItem = ({ icon: Icon, label, value, unit, colorClass, bgClass }) => (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 transition-all duration-200">
        <div className={`p-2 rounded-lg ${bgClass} ${colorClass}`}>
            <Icon size={20} />
        </div>
        <div>
            <p className="text-xs text-gray-500 font-medium">{label}</p>
            <p className="text-lg font-bold text-gray-800">
                {value !== undefined && value !== null ? value : "--"}
                <span className="text-xs text-gray-400 ml-1 font-normal">{unit}</span>
            </p>
        </div>
    </div>
);

const DeviceCard = () => {
    const { currentDeviceData, loading } = useDevice();

    if (loading) return <div className="h-64 bg-white rounded-xl animate-pulse"></div>;

    if (!currentDeviceData) {
        return (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <WifiOff size={32} />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">No Device Selected</h3>
                <p className="text-gray-500 mt-2">Select a device from the list or add a new one.</p>
            </div>
        );
    }

    const isOnline = currentDeviceData.status === 'online' || currentDeviceData.status === 'active' || currentDeviceData.status === 'idle' || currentDeviceData.status === 'running';

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isOnline ? 'bg-green-100 text-leaf-green' : 'bg-gray-100 text-gray-400'}`}>
                        <Wifi size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">{currentDeviceData.name || "Unknown Device"}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-leaf-green animate-pulse' : 'bg-gray-400'}`}></span>
                            <span className="text-sm text-gray-500 font-medium capitalize">{currentDeviceData.status || "Offline"}</span>
                            <span className="text-gray-300">•</span>
                            <span className="text-xs text-gray-400 font-mono">ID: {currentDeviceData.id}</span>
                        </div>
                    </div>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Last Update</p>
                    <p className="text-sm font-medium text-gray-700">
                        {currentDeviceData.lastUpdate ? new Date(currentDeviceData.lastUpdate).toLocaleTimeString() : "Never"}
                    </p>
                </div>
            </div>

            <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricItem
                    icon={Thermometer}
                    label="Temperature"
                    value={currentDeviceData.temperature}
                    unit="°C"
                    colorClass="text-orange-500"
                    bgClass="bg-orange-50"
                />
                <MetricItem
                    icon={Gauge}
                    label="Motor RPM"
                    value={currentDeviceData.rpm}
                    unit="RPM"
                    colorClass="text-blue-500"
                    bgClass="bg-blue-50"
                />
                <MetricItem
                    icon={Activity}
                    label="Vibration"
                    value={currentDeviceData.vibration}
                    unit="g"
                    colorClass="text-purple-500"
                    bgClass="bg-purple-50"
                />
                <MetricItem
                    icon={Zap}
                    label="Power"
                    value={currentDeviceData.power}
                    unit="kW"
                    colorClass="text-yellow-500"
                    bgClass="bg-yellow-50"
                />
            </div>
        </div>
    );
};

export default DeviceCard;
