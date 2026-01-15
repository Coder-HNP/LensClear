import { CheckCircle2 } from "lucide-react";

const SystemHealth = () => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4 text-green-500">
                <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800">System Healthy</h3>
            <p className="text-gray-500 mt-1">No active alerts</p>
        </div>
    );
};

export default SystemHealth;
