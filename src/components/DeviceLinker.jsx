import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { deviceAPI } from "../services/api";
import { Plus, Loader2, Copy, Check } from "lucide-react";

const DeviceLinker = () => {
    const { user } = useAuth();
    const [deviceId, setDeviceId] = useState("");
    const [deviceName, setDeviceName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [generatedToken, setGeneratedToken] = useState("");
    const [copied, setCopied] = useState(false);

    const handleAddDevice = async (e) => {
        e.preventDefault();
        if (!deviceId || !deviceName) return;

        setLoading(true);
        setError("");
        setSuccess("");
        setGeneratedToken("");

        try {
            // Call backend API to create device and get token
            const response = await deviceAPI.create({
                deviceId,
                name: deviceName,
                type: 'combined', // Fixed: Must match enum ['motor', 'sensor', 'combined']
                location: 'Home'
            });

            if (response.data.success) {
                setSuccess("Device registered successfully!");
                setGeneratedToken(response.data.device.authToken);
                setDeviceId("");
                setDeviceName("");
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || "Failed to register device.");
        }
        setLoading(false);
    };

    const copyToken = () => {
        navigator.clipboard.writeText(generatedToken);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Register New Device</h3>

            {!generatedToken ? (
                <form onSubmit={handleAddDevice} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Device ID</label>
                        <input
                            type="text"
                            value={deviceId}
                            onChange={(e) => setDeviceId(e.target.value)}
                            className="input-field"
                            placeholder="e.g. ESP32_TEST_001"
                            required
                        />
                        <p className="text-[10px] text-gray-400 mt-1">Must match DEVICE_ID in firmware</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Device Name</label>
                        <input
                            type="text"
                            value={deviceName}
                            onChange={(e) => setDeviceName(e.target.value)}
                            className="input-field"
                            placeholder="e.g. Living Room Monitor"
                            required
                        />
                    </div>

                    {error && <p className="text-xs text-red-500">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                        Register Device
                    </button>
                </form>
            ) : (
                <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                    <div className="bg-green-50 p-3 rounded-lg flex items-center gap-2 text-green-700 text-sm">
                        <Check size={18} />
                        {success}
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-700">
                            ⚠️ Copy this Auth Token now!
                        </label>
                        <p className="text-xs text-gray-500">
                            You won't be able to see it again. Paste it into your ESP32 code.
                        </p>

                        <div className="flex items-center gap-2">
                            <code className="flex-1 bg-gray-100 p-2 rounded text-xs font-mono break-all border border-gray-200">
                                {generatedToken}
                            </code>
                            <button
                                onClick={copyToken}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                                title="Copy Token"
                            >
                                {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => setGeneratedToken("")}
                        className="w-full text-sm text-primary hover:underline mt-2"
                    >
                        Register Another Device
                    </button>
                </div>
            )}
        </div>
    );
};

export default DeviceLinker;
