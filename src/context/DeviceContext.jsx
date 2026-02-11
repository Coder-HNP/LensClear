import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import {
    getUserDevices,
    subscribeToDeviceData,
    updateDeviceData,
    createLog,
    subscribeTriggers,
    subscribeToAlerts
} from "../utils/firestoreAPI";
import { io } from "socket.io-client";

const DeviceContext = createContext({
    devices: [],
    selectedDeviceId: null,
    setSelectedDeviceId: () => { },
    currentDeviceData: null,
    alerts: [],
    loading: true,
    refreshDevices: () => { }
});

const BACKEND_URL = 'http://localhost:5000';

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
    const [unlinkedDevices, setUnlinkedDevices] = useState(new Set());
    const [socket, setSocket] = useState(null);

    // 1. INITIALIZE SOCKET
    useEffect(() => {
        const newSocket = io(BACKEND_URL);
        setSocket(newSocket);

        newSocket.on("connect", () => {
            console.log("Connected to Backend Proxy Bridge");
        });

        return () => newSocket.disconnect();
    }, []);

    // 2. FETCH DEVICES & TRIGGERS (Authenticated)
    useEffect(() => {
        if (!user || !socket) {
            setDevices([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        // Subscribe to Devices
        const unsubDevices = getUserDevices(user.uid, (deviceList) => {
            setDevices(deviceList);
            if (deviceList.length > 0 && !selectedDeviceId) {
                setSelectedDeviceId(deviceList[0].id);
            }
            setLoading(false);
        });

        // Subscribe to Triggers and SYNC to Backend Memory
        const unsubTriggers = subscribeTriggers(user.uid, (triggerList) => {
            // Push triggers to backend so scheduler can run them without DB permissions
            console.log(`[Proxy] Syncing ${triggerList.length} triggers to backend memory`);
            socket.emit("proxy:sync_triggers", { userId: user.uid, triggers: triggerList });
        });

        return () => {
            unsubDevices();
            unsubTriggers();
        };
    }, [user, socket]);

    // 2.5 SUBSCRIBE TO ALERTS
    useEffect(() => {
        if (!user) return;
        const unsubAlerts = subscribeToAlerts((alertList) => {
            setAlerts(alertList);
        });
        return () => unsubAlerts();
    }, [user]);

    // 3. LISTEN FOR PROXY REQUESTS FROM BACKEND
    useEffect(() => {
        if (!socket || !user) return;

        // --- STATUS & LOG PROXY (Bypasses Backend Permission Denied) ---
        socket.on("device:sync", async ({ deviceId, payload }) => {
            if (!user) return;

            // 1. Feed Heartbeat to Backend Memory Monitor
            socket.emit("proxy:track_heartbeat", { deviceId, userId: user.uid });

            const hasDevice = devices.some(d => String(d.id) === String(deviceId));
            if (hasDevice) {
                // Frontend is AUTHENTICATED -> Performs the save for the backend
                await updateDeviceData(user.uid, deviceId, {
                    ...payload,
                    lastOnline: new Date()
                }).catch(() => { });
            }

            if (String(deviceId) === String(selectedDeviceId)) {
                setCurrentDeviceData(prev => ({ ...prev, ...payload }));
            }
        });

        socket.on("proxy:update_trigger_state", async ({ triggerId, userId: targetUserId, updates }) => {
            // Only process if this is the target user
            if (user && user.uid === targetUserId) {
                const { updateTrigger } = await import("../utils/firestoreAPI");
                await updateTrigger(user.uid, triggerId, updates).catch(() => { });
            }
        });

        socket.on("proxy:create_log", async (logData) => {
            // Only log if the user owns this device (Coerce IDs to strings for matching)
            const hasDevice = devices.some(d => String(d.id) === String(logData.deviceId));
            if (hasDevice && user) {
                await createLog(user.uid, String(logData.deviceId), logData.type, logData.action, logData.details);
            }
        });

        socket.on("device:status", async (data) => {
            const { deviceId, status } = data;
            const targetId = String(deviceId);

            // Update UI
            if (targetId === String(selectedDeviceId)) {
                setCurrentDeviceData(prev => ({ ...prev, status }));
            }

            // Persist "Offline" status to user folder via bridge
            if (status === 'offline' && user) {
                const { updateDeviceData } = await import("../utils/firestoreAPI");
                await updateDeviceData(user.uid, targetId, { status: 'offline' });
            }
        });

        // Real-time UI updates (Vitals)
        socket.on("sensor:data", (data) => {
            if (String(data.deviceId) === String(selectedDeviceId)) {
                setCurrentDeviceData(prev => ({ ...prev, ...data, lastUpdate: new Date() }));
            }
        });

        return () => {
            socket.off("device:sync");
            socket.off("proxy:update_trigger_state");
            socket.off("proxy:create_log");
            socket.off("device:unlinked");
            socket.off("sensor:data");
        };
    }, [socket, user, devices, selectedDeviceId]);

    const value = {
        devices,
        selectedDeviceId,
        setSelectedDeviceId,
        currentDeviceData,
        alerts,
        unlinkedDevices,
        loading,
        refreshDevices: () => { }
    };

    return (
        <DeviceContext.Provider value={value}>
            {children}
        </DeviceContext.Provider>
    );
};
