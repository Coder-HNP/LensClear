import { Activity, Thermometer, Gauge, Zap, ShieldCheck } from "lucide-react";
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

    // Derive health status from actual ESP32 sensor data
    const getHealthStatus = () => {
        if (!currentDeviceData) return { temperature: 'good', motor: 'good', vibration: 'good', power: 'good' };

        return {
            temperature: currentDeviceData.temperature > 60 ? 'critical' : currentDeviceData.temperature > 45 ? 'warning' : 'good',
            motor: currentDeviceData.rpm > 3000 ? 'warning' : 'good',
            vibration: currentDeviceData.vibration > 0.5 ? 'critical' : currentDeviceData.vibration > 0.3 ? 'warning' : 'good',
            power: currentDeviceData.power > 5 ? 'warning' : 'good'
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
                    icon={Thermometer}
                    label="Temperature"
                    status={health.temperature}
                    value={currentDeviceData ? `${currentDeviceData.temperature}°C` : '--'}
                />
                <HealthItem
                    icon={Gauge}
                    label="Motor Speed"
                    status={health.motor}
                    value={currentDeviceData ? `${currentDeviceData.rpm} RPM` : '--'}
                />
                <HealthItem
                    icon={Activity}
                    label="Vibration Level"
                    status={health.vibration}
                    value={currentDeviceData ? `${currentDeviceData.vibration}g` : '--'}
                />
                <HealthItem
                    icon={Zap}
                    label="Power Consumption"
                    status={health.power}
                    value={currentDeviceData ? `${currentDeviceData.power} kW` : '--'}
                />
            </div>
        </div>
    );
};

export default SystemHealth;
