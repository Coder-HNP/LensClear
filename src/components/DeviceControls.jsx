import { useState } from "react";
import { updateDeviceControl } from "../utils/firestoreAPI";
import { Play, Square, RotateCw, Send } from "lucide-react";

const DeviceControls = () => {
    const [deviceId] = useState("device_001");
    const [loading, setLoading] = useState(false);

    const handleCommand = async (command) => {
        setLoading(true);
        try {
            await updateDeviceControl(deviceId, command);
        } catch (error) {
            console.error("Error sending command:", error);
        }
        setLoading(false);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Device Controls</h3>
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => handleCommand("START")}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                    <Play size={18} /> Start
                </button>
                <button
                    onClick={() => handleCommand("STOP")}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                    <Square size={18} /> Stop
                </button>
                <button
                    onClick={() => handleCommand("RESTART")}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 p-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 cursor-pointer"
                >
                    <RotateCw size={18} /> Restart
                </button>
                <button
                    onClick={() => handleCommand("PING")}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                    <Send size={18} /> Ping
                </button>
            </div>
        </div>
    );
};

export default DeviceControls;
