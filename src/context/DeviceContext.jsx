import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { deviceAPI } from "../services/api";
const DeviceContext = createContext({
    devices: [],
    selectedDeviceId: null,
    setSelectedDeviceId: () => { },
    currentDeviceData: null,
    alerts: [],
    loading: true,
    refreshDevices: () => { }
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
    // Fetch devices function wrapped in useCallback for stability
    const fetchDevices = useCallback(async () => {
        if (!user) {
            setDevices([]);
            setLoading(false);
            return;
        }

        try {
            const response = await deviceAPI.getAll();
            if (response.data.success) {
                const deviceList = response.data.devices.map(d => ({
                    id: d.deviceId,
                    name: d.name,
                    status: d.status,
                    lastOnline: d.lastSeen ? new Date(d.lastSeen) : null,
                    type: d.type,
                    cleaningCycles: d.cleaningCycles || 0
                }));

                // Only update if data actually changed to avoid unnecessary re-renders
                setDevices(prev => {
                    if (JSON.stringify(prev) !== JSON.stringify(deviceList)) {
                        return deviceList;
                    }
                    return prev;
                });

                // Auto-select first device if none selected
                if (deviceList.length > 0 && !selectedDeviceId) {
                    setSelectedDeviceId(deviceList[0].id);
                }
            }
        } catch (err) {
            // Silently handle network errors
            if (err.code !== 'ERR_NETWORK') {
                console.error("Failed to fetch devices:", err);
            }
        } finally {
            setLoading(false);
        }
    }, [user, selectedDeviceId]);

    // Initial fetch and Polling
    useEffect(() => {
        if (!user) return;

        fetchDevices();

        // Poll every 5 seconds to keep device list in sync
        const interval = setInterval(fetchDevices, 5000);

        return () => clearInterval(interval);
    }, [user, fetchDevices]);



    // Update current data when selection changes
    useEffect(() => {
        if (!selectedDeviceId) {
            setCurrentDeviceData(null);
            return;
        }

        // Find device in current list to show immediate info
        const device = devices.find(d => d.id === selectedDeviceId);

        // If we found the device in our list, update currentDeviceData immediately
        // This prevents showing stale data from the previously selected device
        if (device) {
            setCurrentDeviceData(prev => {
                // If the current data is already for this device, don't overwrite it
                // This respects richer data that might have come from socket updates
                if (prev?.deviceId === selectedDeviceId) {
                    return prev;
                }

                // Otherwise, initialize with the basic info we have
                return {
                    deviceId: device.id,
                    name: device.name,
                    status: device.status,
                    lastUpdate: device.lastOnline, // Mapping lastOnline to lastUpdate
                    cleaningCycles: device.cleaningCycles,
                    type: device.type,
                    // Default values for fields not in the basic list
                    battery: 0,
                    signal: 0,
                    firmware: 'Loading...'
                };
            });
        }
    }, [selectedDeviceId, devices]);

    const value = {
        devices,
        selectedDeviceId,
        setSelectedDeviceId,
        currentDeviceData,
        alerts,
        loading,
        refreshDevices: fetchDevices
    };

    return (
        <DeviceContext.Provider value={value}>
            {children}
        </DeviceContext.Provider>
    );
};
