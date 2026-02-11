import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

const SystemHealth = ({ devices = [] }) => {
    // Check for issues
    const offlineDevices = devices.filter(d => ['offline', 'unknown', 'disconnected'].includes(d.status?.toLowerCase()));
    const errorDevices = devices.filter(d => d.status?.toLowerCase() === 'error');

    let status = 'healthy';
    let message = 'No active alerts';
    let Icon = CheckCircle2;
    let colorClass = 'text-green-500';
    let bgClass = 'bg-green-50';

    if (errorDevices.length > 0) {
        status = 'critical';
        message = `${errorDevices.length} device(s) reporting errors`;
        Icon = XCircle;
        colorClass = 'text-red-500';
        bgClass = 'bg-red-50';
    } else if (offlineDevices.length > 0) {
        status = 'warning';
        message = `${offlineDevices.length} device(s) offline`;
        Icon = AlertTriangle;
        colorClass = 'text-orange-500';
        bgClass = 'bg-orange-50';
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col items-center justify-center text-center">
            <div className={`w-12 h-12 ${bgClass} rounded-full flex items-center justify-center mb-4 ${colorClass}`}>
                <Icon size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800">
                {status === 'healthy' ? 'System Healthy' : status === 'warning' ? 'System Warning' : 'System Error'}
            </h3>
            <p className="text-gray-500 mt-1">{message}</p>
        </div>
    );
};

export default SystemHealth;
