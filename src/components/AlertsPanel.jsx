import { AlertTriangle, X, CheckCircle } from "lucide-react";
import { useDevice } from "../context/DeviceContext";
import { dismissAlert } from "../utils/firestoreAPI";

const AlertsPanel = () => {
    const { alerts } = useDevice();

    if (alerts.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle size={24} />
                </div>
                <h3 className="text-gray-800 font-medium">System Healthy</h3>
                <p className="text-sm text-gray-400 mt-1">No active alerts</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <AlertTriangle size={20} className="text-red-500" />
                    Active Alerts
                    <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{alerts.length}</span>
                </h3>
            </div>

            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                {alerts.map((alert) => (
                    <div key={alert.id} className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3 animate-pulse-slow">
                        <AlertTriangle size={18} className="text-red-500 mt-0.5 shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-800">{alert.title}</p>
                            <p className="text-xs text-gray-600 mt-0.5">{alert.message}</p>
                            <p className="text-[10px] text-gray-400 mt-1">
                                {alert.timestamp?.toDate?.().toLocaleTimeString()}
                            </p>
                        </div>
                        <button
                            onClick={() => dismissAlert(alert.id)}
                            className="text-gray-400 hover:text-gray-600 p-1"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AlertsPanel;
