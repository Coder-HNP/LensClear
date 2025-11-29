import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { linkDeviceToUser } from "../utils/firestoreAPI";
import { Plus, Loader2 } from "lucide-react";

const DeviceLinker = () => {
    const { user } = useAuth();
    const [deviceId, setDeviceId] = useState("");
    const [deviceName, setDeviceName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleAddDevice = async (e) => {
        e.preventDefault();
        if (!deviceId || !deviceName) return;

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            // Use the new linkDeviceToUser function
            await linkDeviceToUser(user.uid, deviceId, deviceName);
            setSuccess("Device linked successfully!");
            setDeviceId("");
            setDeviceName("");
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError(err.message || "Failed to link device.");
        }
        setLoading(false);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Link New Device</h3>
            <form onSubmit={handleAddDevice} className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Device ID</label>
                    <input
                        type="text"
                        value={deviceId}
                        onChange={(e) => setDeviceId(e.target.value)}
                        className="input-field"
                        placeholder="e.g. DEV-001"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Device Name</label>
                    <input
                        type="text"
                        value={deviceName}
                        onChange={(e) => setDeviceName(e.target.value)}
                        className="input-field"
                        placeholder="e.g. Living Room Hub"
                        required
                    />
                </div>

                {error && <p className="text-xs text-red-500">{error}</p>}
                {success && <p className="text-xs text-green-500">{success}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                    Link Device
                </button>
            </form>
        </div>
    );
};

export default DeviceLinker;
