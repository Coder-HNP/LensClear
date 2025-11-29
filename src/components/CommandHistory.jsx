import { useEffect, useState } from "react";
import { useDevice } from "../context/DeviceContext";
import { subscribeToDeviceCommands } from "../utils/firestoreAPI";
import { Terminal, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";

const CommandHistory = () => {
    const { selectedDeviceId } = useDevice();
    const [commands, setCommands] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!selectedDeviceId) {
            setCommands([]);
            return;
        }

        setLoading(true);
        const unsubscribe = subscribeToDeviceCommands(selectedDeviceId, (data) => {
            setCommands(data);
            setLoading(false);
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [selectedDeviceId]);

    if (!selectedDeviceId) return null;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Terminal size={20} className="text-gray-500" />
                Last 10 Commands
            </h3>

            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {loading ? (
                    <div className="flex justify-center py-4">
                        <Loader2 size={24} className="animate-spin text-primary" />
                    </div>
                ) : commands.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No commands executed yet.</p>
                ) : (
                    commands.slice(0, 10).map((cmd) => (
                        <div key={cmd.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-1.5 rounded-md ${cmd.status === 'success' ? 'bg-green-100 text-green-600' : cmd.status === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {cmd.status === 'success' ? <CheckCircle size={14} /> : cmd.status === 'error' ? <XCircle size={14} /> : <Clock size={14} />}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-700 font-mono">{cmd.command}</p>
                                    <p className="text-[10px] text-gray-400">
                                        {cmd.timestamp?.toLocaleTimeString() || "Pending..."}
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs font-mono text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                                {JSON.stringify(cmd.params || {}).substring(0, 20)}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CommandHistory;
