import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { subscribeToLogs } from "../utils/firestoreAPI";
import { Clock } from "lucide-react";

const Timeline = () => {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        const unsubscribe = subscribeToLogs(user.uid, (data) => {
            setLogs(data.slice(0, 5)); // Only show last 5 items
            setLoading(false);
        });
        return unsubscribe;
    }, [user]);

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h3>
            <div className="relative border-l-2 border-gray-100 ml-3 space-y-6">
                {logs.map((log, index) => (
                    <div key={log.id} className="ml-6 relative">
                        <span className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${log.type === 'error' ? 'bg-red-500' :
                            log.type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
                            }`}></span>
                        <h4 className="text-sm font-semibold text-gray-800">{log.action}</h4>
                        <p className="text-xs text-gray-500 mt-1">{log.details}</p>
                        <span className="text-[10px] text-gray-400 block mt-1">
                            {log.timestamp?.toLocaleTimeString()}
                        </span>
                    </div>
                ))}
                {loading && (
                    <div className="space-y-4 ml-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse">
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                )}
                {!loading && logs.length === 0 && (
                    <div className="ml-6 text-center py-8">
                        <Clock size={32} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-sm text-gray-400">No recent activity</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Timeline;
