import { useEffect, useState } from "react";
import { subscribeToLogs } from "../utils/firestoreAPI";

const Logs = () => {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const unsubscribe = subscribeToLogs(setLogs);
        return unsubscribe;
    }, []);

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Event Logs</h3>
            <div className="overflow-y-auto max-h-[300px]">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0">
                        <tr>
                            <th className="px-4 py-3">Time</th>
                            <th className="px-4 py-3">Event</th>
                            <th className="px-4 py-3">Type</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan="3" className="px-4 py-3 text-center text-gray-500">No logs available</td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="px-4 py-3 text-gray-500">
                                        {log.timestamp instanceof Date ? log.timestamp.toLocaleTimeString() : "Pending..."}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-800">{log.event}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${log.type === 'error' ? 'bg-red-100 text-red-600' :
                                                log.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                                                    'bg-blue-100 text-blue-600'
                                            }`}>
                                            {log.type || 'info'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Logs;
