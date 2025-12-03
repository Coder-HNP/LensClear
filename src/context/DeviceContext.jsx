import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { deviceAPI } from "../services/api";
import socketService from "../services/socket";

const DeviceContext = createContext({
    devices: [],
    selectedDeviceId: null,
    setSelectedDeviceId: () => { },
    currentDeviceData: null,
    alerts: [],
    loading: true
});

export const useDevice = () => {
    const context = useContext(DeviceContext);
    if (!context) {
        console.warn("useDevice must be used within a DeviceProvider");
        return {
            devices: [],
            selectedDeviceId: null,
            setSelectedDeviceId: () => { },
            currentDeviceData: null,
            alerts: [],
            loading: false
        };
    }
    return context;
};

export const DeviceProvider = ({ children }) => {
    const { user } = useAuth();
    const [devices, setDevices] = useState([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState(null);
    const [currentDeviceData, setCurrentDeviceData] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch devices on mount
    useEffect(() => {
        if (!user) {
            setDevices([]);
            setLoading(false);
            return;
        }

        const fetchDevices = async () => {
            try {
                const response = await deviceAPI.getAll();
                if (response.data.success) {
                    const deviceList = response.data.devices.map(d => ({
                        id: d.deviceId,
                        name: d.name,
                        status: d.status,
                        lastOnline: d.lastSeen ? new Date(d.lastSeen) : null,
                        type: d.type
                    }));
                    setDevices(deviceList);

                    // Auto-select first device if none selected
                    if (deviceList.length > 0 && !selectedDeviceId) {
                        setSelectedDeviceId(deviceList[0].id);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch devices:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDevices();

        // Initialize Socket.io
        socketService.initSocket(user.uid);
    }, [user]);

    // Setup socket listeners with proper dependencies
    useEffect(() => {
        if (!user) return;

        // Listen for device status updates
        const handleDeviceStatus = (update) => {
            console.log('Device status update:', update);
            setDevices(prev => prev.map(d =>
                d.id === update.deviceId
                    ? { ...d, status: update.status, lastOnline: new Date(update.lastSeen) }
                    : d
            ));
        };

        // Listen for sensor data
        const handleSensorData = (data) => {
            console.log('Received sensor data:', data);
            if (data.deviceId === selectedDeviceId) {
                console.log('Updating currentDeviceData for device:', selectedDeviceId);
                setCurrentDeviceData(data.data);
            }
        };

        socketService.onDeviceStatus(handleDeviceStatus);
        socketService.onSensorData(handleSensorData);

        return () => {
            socketService.off('device:status', handleDeviceStatus);
            socketService.off('sensor:data', handleSensorData);
        };
    }, [user, selectedDeviceId]); // Added selectedDeviceId to dependencies

    // Update current data when selection changes
    useEffect(() => {
        if (!selectedDeviceId) {
            setCurrentDeviceData(null);
            return;
        }
        // In a real app, you might fetch the latest data snapshot here
        // For now, we wait for the next socket update
    }, [selectedDeviceId]);

    const value = {
        devices,
        selectedDeviceId,
        setSelectedDeviceId,
        currentDeviceData,
        alerts,
        loading
    };

    return (
        <DeviceContext.Provider value={value}>
            {children}
        </DeviceContext.Provider>
    );
};
