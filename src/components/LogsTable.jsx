import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { subscribeToLogs } from "../utils/firestoreAPI";
import { Info, AlertTriangle, XCircle, CheckCircle } from "lucide-react";

const LogsTable = ({ limit = 10 }) => {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToLogs(user.uid, (data) => {
            setLogs(data);
            setLoading(false);
        });
        return unsubscribe;
    }, [user]);

    const getIcon = (type) => {
        switch (type) {
            case 'error': return <XCircle size={16} className="text-red-500" />;
            case 'warning': return <AlertTriangle size={16} className="text-orange-500" />;
            case 'success': return <CheckCircle size={16} className="text-green-500" />;
            default: return <Info size={16} className="text-blue-500" />;
        }
    };

    if (loading) return <div className="h-48 bg-white rounded-xl animate-pulse"></div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50">
                <h3 className="text-lg font-bold text-gray-800">System Logs</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                        <tr>
                            <th className="px-6 py-3">Timestamp</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Action</th>
                            <th className="px-6 py-3">Device ID</th>
                            <th className="px-6 py-3">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {logs.slice(0, limit).map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                    {log.timestamp?.toLocaleTimeString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {getIcon(log.type)}
                                        <span className="capitalize text-gray-700">{log.type || 'info'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-800">{log.action}</td>
                                <td className="px-6 py-4 text-gray-500 font-mono text-xs">{log.deviceId}</td>
                                <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={log.details}>
                                    {log.details}
                                </td>
                            </tr>
                        ))}
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                                    No logs found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LogsTable;
