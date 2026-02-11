import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import {
    subscribeTriggers,
    createTrigger,
    updateTrigger as updateTriggerAPI,
    deleteTrigger as deleteTriggerAPI,
    toggleTrigger as toggleTriggerAPI,
    executeTrigger,
    getUserDevices
} from '../utils/firestoreAPI';
import { Plus, Play, Edit2, Trash2, Power, PowerOff, Clock, Zap } from 'lucide-react';
import './Triggers.css';

const Triggers = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user } = useAuth();

    const [triggers, setTriggers] = useState([]);
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTrigger, setEditingTrigger] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        type: 'immediate',
        action: 'run_cycle',
        targetDevices: [],
        schedule: {
            type: 'once',
            datetime: '',
            timezone: 'UTC',
        },
        parameters: {
            speed: 128,
            duration: 0,
        },
        enabled: true,
    });

    useEffect(() => {
        if (!user) return;

        // Subscribe to triggers in real-time
        const unsubTriggers = subscribeTriggers(user.uid, (triggerList) => {
            setTriggers(triggerList);
            setLoading(false);
        });

        // Subscribe to devices in real-time
        const unsubDevices = getUserDevices(user.uid, (deviceList) => {
            setDevices(deviceList);
        });

        return () => {
            unsubTriggers();
            unsubDevices();
        };
    }, [user]);

    const handleCreateTrigger = () => {
        setEditingTrigger(null);
        setFormData({
            name: '',
            type: 'immediate',
            action: 'run_cycle',
            targetDevices: [],
            schedule: {
                type: 'once',
                datetime: '',
                timezone: 'UTC',
            },
            parameters: {
                speed: 128,
                duration: 0,
            },
            enabled: true,
        });
        setShowModal(true);
    };

    const handleEditTrigger = (trigger) => {
        setEditingTrigger(trigger);
        setFormData({
            name: trigger.name,
            type: trigger.type,
            action: trigger.action,
            targetDevices: trigger.targetDevices,
            schedule: trigger.schedule || {
                type: 'once',
                datetime: '',
                timezone: 'UTC',
            },
            parameters: trigger.parameters || {
                speed: 128,
                duration: 0,
            },
            enabled: trigger.enabled,
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingTrigger) {
                // ... update logic
                const processedData = {
                    ...formData,
                    schedule: { ...formData.schedule, datetime: formData.schedule.datetime }
                };
                await updateTriggerAPI(user.uid, editingTrigger.id, processedData);
            } else {
                const docRef = await createTrigger(user.uid, formData);

                // If it's an immediate trigger, run it right now!
                if (formData.type === 'immediate') {
                    console.log("[Triggers] ⚡ Executing immediate trigger...");
                    await executeTrigger({ ...formData, id: docRef.id });

                    // Log the creation and immediate run
                    await createLog(user.uid, formData.targetDevices[0], "trigger", "Trigger Created & Fired", `Name: ${formData.name}`);
                }
            }

            setShowModal(false);
            // No need to refetch — Firestore listener will auto-update
        } catch (error) {
            console.error('Error saving trigger:', error);
            alert('Failed to save trigger');
        }
    };

    const handleDelete = async (triggerId) => {
        if (!window.confirm('Are you sure you want to delete this trigger?')) {
            return;
        }

        try {
            await deleteTriggerAPI(user.uid, triggerId);
        } catch (error) {
            console.error('Error deleting trigger:', error);
            alert('Failed to delete trigger');
        }
    };

    const handleExecute = async (trigger) => {
        try {
            await executeTrigger(trigger);
            // Log manual execution
            if (user && trigger.targetDevices?.length > 0) {
                await createLog(user.uid, trigger.targetDevices[0], "trigger", "Manual Execution", `Trigger: ${trigger.name}`);
            }
            alert('Trigger executed successfully!');
        } catch (error) {
            console.error('Error executing trigger:', error);
            alert('Failed to execute trigger');
        }
    };

    const handleToggle = async (trigger) => {
        try {
            await toggleTriggerAPI(user.uid, trigger.id, trigger.enabled);
        } catch (error) {
            console.error('Error toggling trigger:', error);
        }
    };

    const handleDeviceToggle = (deviceId) => {
        setFormData(prev => ({
            ...prev,
            targetDevices: prev.targetDevices.includes(deviceId)
                ? prev.targetDevices.filter(id => id !== deviceId)
                : [...prev.targetDevices, deviceId],
        }));
    };

    const handleSelectAll = () => {
        if (formData.targetDevices.length === devices.length) {
            setFormData(prev => ({ ...prev, targetDevices: [] }));
        } else {
            setFormData(prev => ({ ...prev, targetDevices: devices.map(d => d.id) }));
        }
    };

    return (
        <div className="min-h-screen bg-light-gray flex flex-col">
            <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />

                <main className="flex-1 p-4 md:p-6 overflow-y-auto h-[calc(100vh-4rem)]">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-dark-gray">Triggers</h1>
                                <p className="text-gray-500 text-sm">Automate device actions with scheduled or immediate triggers</p>
                            </div>
                            <button onClick={handleCreateTrigger} className="trigger-create-btn">
                                <Plus size={20} />
                                Create Trigger
                            </button>
                        </div>

                        {/* Triggers List */}
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="spinner"></div>
                            </div>
                        ) : triggers.length === 0 ? (
                            <div className="empty-state">
                                <Zap size={48} className="empty-icon" />
                                <h3>No Triggers Yet</h3>
                                <p>Create your first trigger to automate device actions</p>
                                <button onClick={handleCreateTrigger} className="trigger-create-btn">
                                    <Plus size={20} />
                                    Create Trigger
                                </button>
                            </div>
                        ) : (
                            <div className="triggers-grid">
                                {triggers.map((trigger) => (
                                    <div key={trigger.id} className="trigger-card">
                                        <div className="trigger-header">
                                            <div className="trigger-title-row">
                                                <h3 className="trigger-name">{trigger.name}</h3>
                                                <div className="trigger-badges">
                                                    <span className={`trigger-type-badge ${trigger.type}`}>
                                                        {trigger.type === 'immediate' ? <Zap size={14} /> : <Clock size={14} />}
                                                        {trigger.type}
                                                    </span>
                                                    <span className={`trigger-status-badge ${trigger.enabled ? 'enabled' : 'disabled'}`}>
                                                        {trigger.enabled ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="trigger-action">{trigger.action.replace(/_/g, ' ')}</p>
                                        </div>

                                        <div className="trigger-body">
                                            <div className="trigger-info-row">
                                                <span className="trigger-label">Target Devices:</span>
                                                <span className="trigger-value">{trigger.targetDevices.length} device(s)</span>
                                            </div>

                                            {trigger.type === 'scheduled' && trigger.nextRun && (
                                                <div className="trigger-info-row">
                                                    <span className="trigger-label">Next Run:</span>
                                                    <span className="trigger-value">
                                                        {trigger.nextRun?.toDate ? trigger.nextRun.toDate().toLocaleString() : new Date(trigger.nextRun).toLocaleString()}
                                                    </span>
                                                </div>
                                            )}

                                            {trigger.lastRun && (
                                                <div className="trigger-info-row">
                                                    <span className="trigger-label">Last Run:</span>
                                                    <span className="trigger-value">
                                                        {trigger.lastRun?.toDate ? trigger.lastRun.toDate().toLocaleString() : new Date(trigger.lastRun).toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="trigger-actions">
                                            <button
                                                onClick={() => handleToggle(trigger)}
                                                className="trigger-action-btn toggle"
                                                title={trigger.enabled ? 'Disable' : 'Enable'}
                                            >
                                                {trigger.enabled ? <PowerOff size={16} /> : <Power size={16} />}
                                            </button>

                                            <button
                                                onClick={() => handleExecute(trigger)}
                                                className="trigger-action-btn execute"
                                                title="Execute Now"
                                            >
                                                <Play size={16} />
                                            </button>

                                            <button
                                                onClick={() => handleEditTrigger(trigger)}
                                                className="trigger-action-btn edit"
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>

                                            <button
                                                onClick={() => handleDelete(trigger.id)}
                                                className="trigger-action-btn delete"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">
                            {editingTrigger ? 'Edit Trigger' : 'Create New Trigger'}
                        </h2>

                        <form onSubmit={handleSubmit} className="trigger-form">

                            {/* Name */}
                            <div className="form-group">
                                <label>Trigger Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="e.g., Daily Morning Cleaning"
                                />
                            </div>

                            {/* Type */}
                            <div className="form-group">
                                <label>Type *</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="immediate">Immediate</option>
                                    <option value="scheduled">Scheduled</option>
                                </select>
                            </div>

                            {/* Action */}
                            <div className="form-group">
                                <label>Action *</label>
                                <select
                                    value={formData.action}
                                    onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                                >
                                    <option value="run_cycle">Run Cleaning Cycle (Standard)</option>
                                    <option value="stop_motor">Stop Motor</option>
                                </select>
                            </div>

                            {/* Parameters based on Action */}
                            {formData.action === 'run_cycle' && (
                                <div className="flex gap-4">
                                    <div className="form-group flex-1">
                                        <label>Speed (0-255)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="255"
                                            value={formData.parameters?.speed || 128}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                parameters: { ...formData.parameters, speed: parseInt(e.target.value) }
                                            })}
                                        />
                                    </div>
                                    <div className="form-group flex-1">
                                        <label>Duration (ms)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.parameters?.duration || 5000}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                parameters: { ...formData.parameters, duration: parseInt(e.target.value) }
                                            })}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Target Devices */}
                            <div className="form-group">
                                <div className="flex justify-between items-center mb-2">
                                    <label>Target Devices *</label>
                                    <button
                                        type="button"
                                        onClick={handleSelectAll}
                                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        {formData.targetDevices.length === devices.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>
                                <div className="device-checkboxes max-h-40 overflow-y-auto border rounded p-2">
                                    {devices.length === 0 ? (
                                        <p className="text-gray-500 text-sm">No devices available.</p>
                                    ) : devices.map((device) => (
                                        <label key={device.id} className="checkbox-label flex items-center gap-2 mb-1">
                                            <input
                                                type="checkbox"
                                                checked={formData.targetDevices.includes(device.id)}
                                                onChange={() => handleDeviceToggle(device.id)}
                                            />
                                            <span className={device.status === 'online' ? 'text-green-600' : 'text-gray-500'}>
                                                {device.name}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Schedule (if scheduled) */}
                            {formData.type === 'scheduled' && (
                                <>
                                    <div className="form-group">
                                        <label>Timezone</label>
                                        <select
                                            value={formData.schedule.timezone}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                schedule: { ...formData.schedule, timezone: e.target.value }
                                            })}
                                        >
                                            <option value="UTC">UTC (Universal Time)</option>
                                            <option value="Asia/Kolkata">🇮🇳 India (IST)</option>
                                            <option value="Asia/Dubai">🇦🇪 Dubai (GST)</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Schedule Type</label>
                                        <select
                                            value={formData.schedule.type}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                schedule: { ...formData.schedule, type: e.target.value }
                                            })}
                                        >
                                            <option value="once">One-time</option>
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                        </select>
                                    </div>

                                    {formData.schedule.type === 'once' && (
                                        <div className="form-group">
                                            <label>Date & Time (One-time)</label>
                                            <input
                                                type="datetime-local"
                                                value={formData.schedule.datetime || ''}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    schedule: { ...formData.schedule, datetime: e.target.value }
                                                })}
                                                className="w-full p-2 border rounded"
                                            />
                                            <p className="text-[10px] text-gray-400 mt-1 italic">
                                                Tip: Use the calendar icon to select
                                            </p>
                                        </div>
                                    )}

                                    {formData.schedule.type === 'daily' && (
                                        <div className="form-group">
                                            <label>Time of Day (Runs every day)</label>
                                            <input
                                                type="time"
                                                value={formData.schedule.datetime || ''}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    schedule: { ...formData.schedule, datetime: e.target.value }
                                                })}
                                                className="w-full p-2 border rounded"
                                            />
                                        </div>
                                    )}

                                    {formData.schedule.type === 'weekly' && (
                                        <div className="form-group space-y-2">
                                            <label>Day & Time</label>
                                            <div className="flex gap-2">
                                                <select
                                                    className="flex-1"
                                                    value={formData.schedule.datetime ? new Date(formData.schedule.datetime).getDay() : ""}
                                                    onChange={(e) => {
                                                        const targetDay = parseInt(e.target.value);
                                                        const date = new Date();
                                                        const currentDay = date.getDay();
                                                        let diff = targetDay - currentDay;
                                                        if (diff < 0) diff += 7;
                                                        date.setDate(date.getDate() + diff);

                                                        // Preserve time if already set
                                                        if (formData.schedule.datetime && !isNaN(new Date(formData.schedule.datetime).getTime())) {
                                                            const old = new Date(formData.schedule.datetime);
                                                            date.setHours(old.getHours(), old.getMinutes(), 0, 0);
                                                        } else {
                                                            date.setHours(12, 0, 0, 0);
                                                        }

                                                        setFormData({
                                                            ...formData,
                                                            schedule: { ...formData.schedule, datetime: date.toISOString() }
                                                        });
                                                    }}
                                                >
                                                    <option value="">Select Day</option>
                                                    <option value="1">Monday</option>
                                                    <option value="2">Tuesday</option>
                                                    <option value="3">Wednesday</option>
                                                    <option value="4">Thursday</option>
                                                    <option value="5">Friday</option>
                                                    <option value="6">Saturday</option>
                                                    <option value="0">Sunday</option>
                                                </select>
                                                <input
                                                    type="time"
                                                    className="flex-1"
                                                    value={formData.schedule.datetime ?
                                                        (new Date(formData.schedule.datetime).getHours().toString().padStart(2, '0') + ':' +
                                                            new Date(formData.schedule.datetime).getMinutes().toString().padStart(2, '0'))
                                                        : ''}
                                                    onChange={(e) => {
                                                        const [h, m] = e.target.value.split(':').map(Number);
                                                        const date = formData.schedule.datetime ? new Date(formData.schedule.datetime) : new Date();
                                                        date.setHours(h, m, 0, 0);
                                                        setFormData({
                                                            ...formData,
                                                            schedule: { ...formData.schedule, datetime: date.toISOString() }
                                                        });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Form Actions */}
                            <div className="form-actions">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-submit" disabled={formData.targetDevices.length === 0}>
                                    {editingTrigger ? 'Update Trigger' : 'Create Trigger'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Triggers;
