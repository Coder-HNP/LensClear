import { db } from "../firebase";
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    setDoc,
    getDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    deleteDoc
} from "firebase/firestore";

// Helper to check DB
const checkDb = () => {
    if (!db) {
        console.error("Firestore DB not initialized");
        return false;
    }
    return true;
};

// --- Devices Management (User's Linked Devices) ---

export const getUserDevices = (userId, callback) => {
    if (!userId || !checkDb()) return () => { };

    try {
        const q = query(collection(db, "users", userId, "devices"));

        return onSnapshot(q, (snapshot) => {
            const devices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(devices);
        }, (error) => {
            console.error("Error fetching user devices:", error);
            callback([]);
        });
    } catch (err) {
        console.error("getUserDevices error:", err);
        return () => { };
    }
};

export const linkDeviceToUser = async (userId, deviceId, deviceName) => {
    if (!checkDb()) throw new Error("Database not available");

    const userDeviceRef = doc(db, "users", userId, "devices", deviceId);

    const docSnap = await getDoc(userDeviceRef);
    if (docSnap.exists()) {
        throw new Error("Device is already linked to this account.");
    }

    await setDoc(userDeviceRef, {
        name: deviceName,
        linkedAt: serverTimestamp(),
        status: 'unknown',
        lastOnline: null
    });
};

export const unlinkDeviceFromUser = async (userId, deviceId) => {
    if (!checkDb()) return;
    await deleteDoc(doc(db, "users", userId, "devices", deviceId));
};

export const renameDevice = async (userId, deviceId, newName) => {
    if (!checkDb()) return;
    const userDeviceRef = doc(db, "users", userId, "devices", deviceId);
    await updateDoc(userDeviceRef, { name: newName });
};

// --- Device Control & State ---

export const sendDeviceCommand = async (deviceId, command, params = {}) => {
    if (!checkDb()) throw new Error("Database not available");

    try {
        await addDoc(collection(db, "devices", deviceId, "control"), {
            command,
            params,
            status: 'pending',
            timestamp: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error("Error sending command:", error);
        throw error;
    }
};

export const subscribeToDeviceData = (deviceId, callback) => {
    if (!deviceId || !checkDb()) return () => { };

    try {
        const deviceRef = doc(db, "devices", deviceId);
        return onSnapshot(deviceRef, (doc) => {
            if (doc.exists()) {
                callback({ id: doc.id, ...doc.data() });
            } else {
                callback(null);
            }
        }, (error) => {
            console.error("Error fetching device data:", error);
        });
    } catch (err) {
        console.error("subscribeToDeviceData error:", err);
        return () => { };
    }
};

// --- Logs & Commands History ---

export const createLog = async (userId, deviceId, action, details, type = "info") => {
    if (!checkDb()) return;

    try {
        await addDoc(collection(db, "logs"), {
            userId,
            deviceId,
            action,
            details,
            type,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Error creating log:", error);
    }
};

export const subscribeToLogs = (userId, callback) => {
    if (!userId || !checkDb()) return () => { };

    try {
        const q = query(
            collection(db, "logs"),
            where("userId", "==", userId),
            limit(50)
        );

        return onSnapshot(q, (snapshot) => {
            let logs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate()
            }));

            // Client-side sort
            logs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

            callback(logs);
        }, (error) => {
            console.error("Error fetching logs:", error);
            callback([]);
        });
    } catch (err) {
        console.error("subscribeToLogs error:", err);
        return () => { };
    }
};

export const subscribeToDeviceCommands = (deviceId, callback) => {
    if (!deviceId || !checkDb()) return () => { };

    try {
        const q = query(
            collection(db, "devices", deviceId, "control"),
            limit(20)
        );

        return onSnapshot(q, (snapshot) => {
            let commands = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate()
            }));

            // Client-side sort
            commands.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

            callback(commands);
        }, (error) => {
            console.error("Error fetching commands:", error);
            callback([]);
        });
    } catch (err) {
        console.error("subscribeToDeviceCommands error:", err);
        return () => { };
    }
};

// --- Alerts ---

export const subscribeToAlerts = (userId, callback) => {
    if (!userId || !checkDb()) return () => { };

    try {
        const q = query(
            collection(db, "alerts"),
            where("userId", "==", userId),
            where("active", "==", true)
        );

        return onSnapshot(q, (snapshot) => {
            let alerts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate()
            }));

            // Client-side sort
            alerts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

            callback(alerts);
        }, (error) => {
            console.error("Error fetching alerts:", error);
            callback([]);
        });
    } catch (err) {
        console.error("subscribeToAlerts error:", err);
        return () => { };
    }
};

export const dismissAlert = async (alertId) => {
    if (!checkDb()) return;
    await updateDoc(doc(db, "alerts", alertId), {
        active: false,
        dismissedAt: serverTimestamp()
    });
};

// --- History ---

export const subscribeToSensorHistory = (deviceId, callback) => {
    if (!deviceId || !checkDb()) return () => { };

    try {
        const q = query(
            collection(db, "devices", deviceId, "history"),
            orderBy("timestamp", "desc"),
            limit(50)
        );

        return onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp
            }));
            callback(data.reverse());
        }, (error) => {
            console.error("Error fetching history:", error);
            callback([]);
        });
    } catch (err) {
        console.error("subscribeToSensorHistory error:", err);
        return () => { };
    }
};

// --- Settings ---

export const getUserSettings = async (userId) => {
    if (!checkDb()) return null;
    const docRef = doc(db, "users", userId, "settings", "preferences");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data();
    }
    return null;
};

export const updateUserSettings = async (userId, settings) => {
    if (!checkDb()) return;
    const docRef = doc(db, "users", userId, "settings", "preferences");
    await setDoc(docRef, settings, { merge: true });
};
