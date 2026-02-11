import { db } from "../firebase";
import {
    collection,
    doc,
    addDoc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    Timestamp
} from "firebase/firestore";

// Helper to check if DB is initialized
const checkDb = () => {
    if (!db) {
        console.error("Firestore database is not initialized");
        return false;
    }
    return true;
};

// --- DEVICE MANAGEMENT ---

export const getUserDevices = (userId, callback) => {
    if (!userId || !checkDb()) return () => { };

    try {
        const devicesRef = collection(db, "users", userId, "devices");
        return onSnapshot(devicesRef, (snapshot) => {
            const deviceList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(deviceList);
        });
    } catch (error) {
        console.error("Error subscribing to devices:", error);
        return () => { };
    }
};

export const subscribeToDeviceData = (deviceId, callback) => {
    if (!deviceId || !checkDb()) return () => { };

    try {
        // Subscribe to root device doc for live updates
        const deviceRef = doc(db, "devices", deviceId);
        return onSnapshot(deviceRef, (snapshot) => {
            if (snapshot.exists()) {
                callback({ id: snapshot.id, ...snapshot.data() });
            } else {
                callback(null);
            }
        });
    } catch (error) {
        console.error("Error subscribing to device data:", error);
        return () => { };
    }
};

export const linkDeviceToUser = async (userId, deviceId, name, authToken) => {
    if (!userId || !deviceId || !checkDb()) return;

    const targetId = String(deviceId);
    const deviceData = {
        id: targetId,
        userId: userId,
        name: name || `Device ${targetId}`,
        authToken: authToken || null,
        status: 'offline', // Default to offline until first heartbeat
        lastOnline: serverTimestamp(),
        createdAt: serverTimestamp()
    };

    // 1. User profile ONLY (Removes root dependency)
    await setDoc(doc(db, "users", userId, "devices", targetId), deviceData, { merge: true });
};

export const updateDeviceToken = async (userId, deviceId, newToken) => {
    if (!userId || !deviceId || !checkDb()) return;
    const updates = { authToken: newToken, updatedAt: serverTimestamp() };

    // Update user folder ONLY
    await setDoc(doc(db, "users", userId, "devices", deviceId), updates, { merge: true });
};

export const unlinkDeviceFromUser = async (userId, deviceId) => {
    if (!userId || !deviceId || !checkDb()) return;

    // 1. Remove from User profile
    await deleteDoc(doc(db, "users", userId, "devices", deviceId));

    // 2. Mark as unlinked in Root registry (don't delete, just remove userId)
    await updateDoc(doc(db, "devices", deviceId), {
        userId: null,
        updatedAt: serverTimestamp()
    });
};

export const renameDevice = async (userId, deviceId, newName) => {
    if (!userId || !deviceId || !checkDb()) return;
    const updates = { name: newName, updatedAt: serverTimestamp() };

    // Update user folder ONLY
    await updateDoc(doc(db, "users", userId, "devices", deviceId), updates);
};

export const getUserSettings = async (userId) => {
    if (!userId || !checkDb()) return null;
    const ref = doc(db, "users", userId, "settings", "general");
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : {};
};

export const updateUserSettings = async (userId, settings) => {
    if (!userId || !checkDb()) return;
    const ref = doc(db, "users", userId, "settings", "general");
    await setDoc(ref, settings, { merge: true });
};

export const dismissAlert = async (alertId) => {
    if (!checkDb() || !alertId) return;
    try {
        await deleteDoc(doc(db, "alerts", alertId));
    } catch (error) {
        console.error("Error dismissing alert:", error);
    }
};

export const updateDeviceData = async (userId, deviceId, updates) => {
    if (!userId || !deviceId || !checkDb()) return;

    try {
        const userDeviceRef = doc(db, "users", userId, "devices", deviceId);
        await setDoc(userDeviceRef, {
            ...updates,
            updatedAt: serverTimestamp()
        }, { merge: true });

        // Root update removed to bypass permission blocks
    } catch (error) {
        console.error("Error updating device data:", error);
    }
};

// --- LOG MANAGEMENT ---

export const createLog = async (userId, deviceId, type, action, details) => {
    if (!checkDb() || !userId) return;
    try {
        const logData = {
            userId,
            deviceId,
            type,
            action,
            event: action, // Backward compatibility
            details,
            timestamp: serverTimestamp()
        };

        // Save to user-specific logs ONLY (Bypasses root permission block)
        await addDoc(collection(db, "users", userId, "logs"), logData);
    } catch (error) {
        console.error("Error creating log:", error);
    }
};

export const subscribeToLogs = (userId, callback, deviceId = null) => {
    if (!userId || !checkDb()) return () => { };

    try {
        let q;
        if (deviceId) {
            q = query(
                collection(db, "users", userId, "logs"),
                where("deviceId", "==", String(deviceId)),
                orderBy("timestamp", "desc"),
                limit(50)
            );
        } else {
            q = query(
                collection(db, "users", userId, "logs"),
                orderBy("timestamp", "desc"),
                limit(50)
            );
        }

        return onSnapshot(q, (snapshot) => {
            const logList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(logList);
        });
    } catch (error) {
        console.error("Error subscribing to logs:", error);
        return () => { };
    }
};

export const subscribeToSensorHistory = (userId, deviceId, callback) => {
    if (!userId || !deviceId || !checkDb()) return () => { };

    try {
        // Query logs of type 'sensor' for this device
        const q = query(
            collection(db, "users", userId, "logs"),
            where("deviceId", "==", deviceId),
            where("type", "==", "sensor"),
            orderBy("timestamp", "desc"),
            limit(50)
        );

        return onSnapshot(q, (snapshot) => {
            const history = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).reverse(); // Oldest first for chart
            callback(history);
        });
    } catch (error) {
        console.error("Error subscribing to sensor history:", error);
        return () => { };
    }
};

export const subscribeToAlerts = (callback) => {
    if (!checkDb()) return () => { };
    try {
        const alertsRef = collection(db, "alerts");
        const q = query(alertsRef, orderBy("timestamp", "desc"), limit(10));
        return onSnapshot(q, (snapshot) => {
            const alertList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(alertList);
        });
    } catch (error) {
        console.error("Error subscribing to alerts:", error);
        return () => { };
    }
};

// --- TRIGGER MANAGEMENT ---

export const subscribeTriggers = (userId, callback) => {
    if (!userId || !checkDb()) return () => { };

    try {
        const triggersRef = collection(db, "users", userId, "triggers");
        return onSnapshot(triggersRef, (snapshot) => {
            const triggerList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(triggerList);
        });
    } catch (error) {
        console.error("Error subscribing to triggers:", error);
        return () => { };
    }
};

export const createTrigger = async (userId, triggerData) => {
    if (!userId || !checkDb()) throw new Error("Authentication required");

    let nextRun = null;
    if (triggerData.type === 'scheduled' && triggerData.schedule?.datetime) {
        const schedule = triggerData.schedule;
        const now = new Date();

        if (schedule.type === 'once') {
            nextRun = new Date(schedule.datetime);
        } else if (schedule.type === 'daily') {
            // schedule.datetime is HH:mm
            const [hours, minutes] = schedule.datetime.split(':').map(Number);
            nextRun = new Date();
            nextRun.setHours(hours, minutes, 0, 0);
            if (nextRun <= now) nextRun.setDate(nextRun.getDate() + 1);
        } else if (schedule.type === 'weekly') {
            // Robust weekly calculation
            nextRun = new Date(schedule.datetime);
            if (isNaN(nextRun.getTime())) {
                // Fallback to day components
                const [h, m] = schedule.datetime.includes(':') ? schedule.datetime.split(':').map(Number) : [12, 0];
                nextRun = new Date();
                nextRun.setHours(h, m, 0, 0);
            }
            // If it's in the past relative to now (even same day earlier), move to next week
            if (nextRun <= now) nextRun.setDate(nextRun.getDate() + 7);
        }
    }

    const docRef = await addDoc(collection(db, "users", userId, "triggers"), {
        ...triggerData,
        createdAt: serverTimestamp(),
        lastRun: null,
        nextRun: nextRun,
        enabled: true
    });

    return docRef;
};

export const updateTrigger = async (userId, triggerId, updates) => {
    if (!userId || !checkDb()) return;
    const ref = doc(db, "users", userId, "triggers", triggerId);
    await updateDoc(ref, updates);
};

export const deleteTrigger = async (userId, triggerId) => {
    if (!userId || !checkDb()) return;
    const ref = doc(db, "users", userId, "triggers", triggerId);
    await deleteDoc(ref);
};

export const toggleTrigger = async (userId, triggerId, currentEnabled) => {
    if (!userId || !checkDb()) return;
    const ref = doc(db, "users", userId, "triggers", triggerId);
    await updateDoc(ref, { enabled: !currentEnabled });
};

// --- COMMAND EXECUTION ---

export const sendDeviceCommand = async (deviceId, command, params = {}) => {
    // API call to the Local Relay Backend
    try {
        const response = await fetch('/api/commands/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceId, command, params })
        });
        return await response.json();
    } catch (error) {
        console.error("Command Execution API Failure:", error);
        throw error;
    }
};

export const executeTrigger = async (trigger) => {
    // API call to the Local Relay Backend
    // Triggers a command immediately without waiting for schedule
    try {
        const response = await fetch('/api/commands/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                deviceId: trigger.targetDevices[0], // First device
                command: trigger.action === 'run_cycle' ? 'CYCLE' : 'STOP',
                params: trigger.parameters || {}
            })
        });
        return await response.json();
    } catch (error) {
        console.error("Trigger Execution API Failure:", error);
        throw error;
    }
};

export const subscribeToDeviceCommands = (deviceId, callback) => {
    if (!deviceId || !checkDb()) return () => { };
    try {
        const q = query(
            collection(db, "devices", deviceId, "control"), // Hardware listens to 'control'
            orderBy("timestamp", "desc"),
            limit(10)
        );
        return onSnapshot(q, (snapshot) => {
            const commandList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(commandList);
        });
    } catch (error) {
        console.error("Error subscribing to commands:", error);
        return () => { };
    }
};

export const subscribeToDeviceState = (callback) => {
    if (!checkDb()) return () => { };
    try {
        const q = query(collection(db, "devices"), limit(20));
        return onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(data);
        });
    } catch (error) {
        console.error("Error subscribing to device state:", error);
        return () => { };
    }
};
