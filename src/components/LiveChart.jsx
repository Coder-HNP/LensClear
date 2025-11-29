import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { useDevice } from "../context/DeviceContext";
import { subscribeToSensorHistory } from "../utils/firestoreAPI";
import { getChartOptions, formatSensorDataForChart } from "../utils/chartUtils";
import { Loader2, AlertCircle } from "lucide-react";

const LiveChart = () => {
    const { selectedDeviceId } = useDevice();
    const [chartData, setChartData] = useState({ labels: [], datasets: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!selectedDeviceId) {
            setChartData({ labels: [], datasets: [] });
            return;
        }

        setLoading(true);
        setError("");

        const unsubscribe = subscribeToSensorHistory(selectedDeviceId, (data) => {
            try {
                const formattedData = formatSensorDataForChart(data);
                setChartData(formattedData);
            } catch (err) {
                console.error("Error formatting chart data:", err);
                setError("Failed to load chart data.");
            }
            setLoading(false);
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [selectedDeviceId]);

    if (!selectedDeviceId) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[400px] flex items-center justify-center text-gray-400">
                Select a device to view live data
            </div>
        );
    }

    if (loading && chartData.labels.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[400px] flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[400px]">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Live Sensor Data</h3>
                {error ? (
                    <div className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle size={14} /> {error}
                    </div>
                ) : (
                    <select className="text-sm border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-primary">
                        <option>Last Hour</option>
                        <option>Last 24 Hours</option>
                        <option>Last 7 Days</option>
                    </select>
                )}
            </div>
            <div className="h-[320px]">
                <Line options={getChartOptions()} data={chartData} />
            </div>
        </div>
    );
};

export default LiveChart;
