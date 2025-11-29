import { Activity, Cpu, Wifi, HardDrive, ShieldCheck } from "lucide-react";
import { useDevice } from "../context/DeviceContext";

const HealthItem = ({ icon: Icon, label, status, value }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-md text-primary shadow-sm">
                <Icon size={16} />
            </div>
            <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <div className="text-right">
            <div className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mb-1 ${status === 'good' ? 'bg-green-100 text-green-600' :
                    status === 'warning' ? 'bg-orange-100 text-orange-600' :
                        'bg-red-100 text-red-600'
                }`}>
                {status === 'good' ? 'Healthy' : status === 'warning' ? 'Warning' : 'Critical'}
            </div>
            {value && <p className="text-xs text-gray-500">{value}</p>}
        </div>
    </div>
);

const SystemHealth = () => {
    const { currentDeviceData } = useDevice();

    // Mock health data derived from device data
    const getHealthStatus = () => {
        if (!currentDeviceData) return { cpu: 'good', memory: 'good', wifi: 'good', firmware: 'good' };

        return {
            cpu: currentDeviceData.temperature > 60 ? 'warning' : 'good',
            memory: 'good', // Mock
            wifi: currentDeviceData.signal < -80 ? 'warning' : 'good',
            firmware: 'good'
        };
    };

    const health = getHealthStatus();

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <ShieldCheck size={20} className="text-green-500" />
                System Health
            </h3>

            <div className="space-y-3">
                <HealthItem
                    icon={Cpu}
                    label="CPU Load"
                    status={health.cpu}
                    value={currentDeviceData ? `${currentDeviceData.temperature}°C` : '--'}
                />
                <HealthItem
                    icon={HardDrive}
                    label="Memory Usage"
                    status={health.memory}
                    value="42% Used"
                />
                <HealthItem
                    icon={Wifi}
                    label="Network Stability"
                    status={health.wifi}
                    value={currentDeviceData ? `${currentDeviceData.signal} dBm` : '--'}
                />
                <HealthItem
                    icon={Activity}
                    label="Firmware Status"
                    status={health.firmware}
                    value="v2.1.0 (Latest)"
                />
            </div>
        </div>
    );
};

export default SystemHealth;
