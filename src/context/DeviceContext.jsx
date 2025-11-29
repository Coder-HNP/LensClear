import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { getUserDevices, subscribeToDeviceData, subscribeToAlerts } from "../utils/firestoreAPI";

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

    // Subscribe to user's devices
    useEffect(() => {
        if (!user) {
            setDevices([]);
            setLoading(false);
            return;
        }

        let unsubscribe = () => { };

        try {
            unsubscribe = getUserDevices(user.uid, (deviceList) => {
                setDevices(deviceList);
                // Auto-select first device if none selected
                if (deviceList.length > 0 && !selectedDeviceId) {
                    setSelectedDeviceId(deviceList[0].id);
                }
                setLoading(false);
            });
        } catch (error) {
            console.error("Error subscribing to devices:", error);
            setLoading(false);
        }

        return () => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        };
    }, [user]);

    // Subscribe to selected device's live data
    useEffect(() => {
        if (!selectedDeviceId) {
            setCurrentDeviceData(null);
            return;
        }

        let unsubscribe = () => { };

        try {
            unsubscribe = subscribeToDeviceData(selectedDeviceId, (data) => {
                setCurrentDeviceData(data);
            });
        } catch (error) {
            console.error("Error subscribing to device data:", error);
        }

        return () => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        };
    }, [selectedDeviceId]);

    // Subscribe to alerts
    useEffect(() => {
        if (!user) return;

        let unsubscribe = () => { };

        try {
            unsubscribe = subscribeToAlerts(user.uid, (alertList) => {
                setAlerts(alertList);
            });
        } catch (error) {
            console.error("Error subscribing to alerts:", error);
        }

        return () => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        };
    }, [user]);

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
