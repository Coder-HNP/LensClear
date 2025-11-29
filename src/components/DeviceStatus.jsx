import { useEffect, useState } from "react";
import { subscribeToDeviceState } from "../utils/firestoreAPI";
import { Thermometer, Battery, Signal, Clock } from "lucide-react";

const DeviceStatus = () => {
    const [device, setDevice] = useState(null);

    useEffect(() => {
        const unsubscribe = subscribeToDeviceState((data) => {
            if (data && data.length > 0) {
                setDevice(data[0]);
            } else {
                // Fallback for demo if no data
                setDevice({
                    temperature: 0,
                    battery: 0,
                    signal: 0,
                    updatedAt: { toDate: () => new Date() }
                });
            }
        });
        return unsubscribe;
    }, []);

    if (!device) return <div className="p-4 bg-white rounded-xl shadow-sm animate-pulse h-32"></div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
                    <Thermometer size={24} />
                </div>
                <div>
                    <p className="text-sm text-gray-500">Temperature</p>
                    <p className="text-2xl font-bold text-gray-800">{device.temperature || "--"}°C</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                    <Battery size={24} />
                </div>
                <div>
                    <p className="text-sm text-gray-500">Battery</p>
                    <p className="text-2xl font-bold text-gray-800">{device.battery || "--"}%</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                    <Signal size={24} />
                </div>
                <div>
                    <p className="text-sm text-gray-500">Signal</p>
                    <p className="text-2xl font-bold text-gray-800">{device.signal || "--"} dBm</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                    <Clock size={24} />
                </div>
                <div>
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="text-sm font-bold text-gray-800">
                        {device.updatedAt?.toDate?.().toLocaleTimeString() || "Just now"}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DeviceStatus;
