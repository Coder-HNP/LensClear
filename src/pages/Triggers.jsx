import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { triggerAPI, deviceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
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
        action: 'start_motor',
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
        fetchTriggers();
        fetchDevices();
    }, []);

    const fetchTriggers = async () => {
        try {
            const response = await triggerAPI.getAll();
            setTriggers(response.data.triggers || []);
        } catch (error) {
            console.error('Error fetching triggers:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDevices = async () => {
        try {
            const response = await deviceAPI.getAll();
            setDevices(response.data.devices || []);
        } catch (error) {
            console.error('Error fetching devices:', error);
        }
    };

    const handleCreateTrigger = () => {
        setEditingTrigger(null);
        setFormData({
            name: '',
            type: 'immediate',
            action: 'start_motor',
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
                await triggerAPI.update(editingTrigger._id, formData);
            } else {
                await triggerAPI.create(formData);
            }

            setShowModal(false);
            fetchTriggers();
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
            await triggerAPI.delete(triggerId);
            fetchTriggers();
        } catch (error) {
            console.error('Error deleting trigger:', error);
            alert('Failed to delete trigger');
        }
    };

    const handleExecute = async (triggerId) => {
        try {
            await triggerAPI.execute(triggerId);
            alert('Trigger executed successfully!');
        } catch (error) {
            console.error('Error executing trigger:', error);
            alert('Failed to execute trigger');
        }
    };

    const handleToggle = async (triggerId) => {
        try {
            await triggerAPI.toggle(triggerId);
            fetchTriggers();
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
                                    <div key={trigger._id} className="trigger-card">
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
                                                        {new Date(trigger.nextRun).toLocaleString()}
                                                    </span>
                                                </div>
                                            )}

                                            {trigger.lastRun && (
                                                <div className="trigger-info-row">
                                                    <span className="trigger-label">Last Run:</span>
                                                    <span className="trigger-value">
                                                        {new Date(trigger.lastRun).toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="trigger-actions">
                                            <button
                                                onClick={() => handleToggle(trigger._id)}
                                                className="trigger-action-btn toggle"
                                                title={trigger.enabled ? 'Disable' : 'Enable'}
                                            >
                                                {trigger.enabled ? <PowerOff size={16} /> : <Power size={16} />}
                                            </button>

                                            {trigger.type === 'scheduled' && (
                                                <button
                                                    onClick={() => handleExecute(trigger._id)}
                                                    className="trigger-action-btn execute"
                                                    title="Execute Now"
                                                >
                                                    <Play size={16} />
                                                </button>
                                            )}

                                            <button
                                                onClick={() => handleEditTrigger(trigger)}
                                                className="trigger-action-btn edit"
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>

                                            <button
                                                onClick={() => handleDelete(trigger._id)}
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
                                    <option value="start_motor">Start Motor</option>
                                    <option value="stop_motor">Stop Motor</option>
                                    <option value="adjust_speed">Adjust Speed</option>
                                    <option value="run_cycle">Run Cleaning Cycle</option>
                                </select>
                            </div>

                            {/* Target Devices */}
                            <div className="form-group">
                                <label>Target Devices * (Select at least one)</label>
                                <div className="device-checkboxes">
                                    {devices.map((device) => (
                                        <label key={device.deviceId} className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={formData.targetDevices.includes(device.deviceId)}
                                                onChange={() => handleDeviceToggle(device.deviceId)}
                                            />
                                            <span>{device.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Schedule (if scheduled) */}
                            {formData.type === 'scheduled' && (
                                <>
                                    <div className="form-group">
                                        <label>Schedule Type</label>
                                        <select
                                            value={formData.schedule.type}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                schedule: { ...formData.schedule, type: e.target.value }
                                            })}
                                        >
                                            <option value="once">Once</option>
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Date & Time</label>
                                        <input
                                            type="datetime-local"
                                            value={formData.schedule.datetime}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                schedule: { ...formData.schedule, datetime: e.target.value }
                                            })}
                                        />
                                    </div>
                                </>
                            )}

                            {/* Parameters */}
                            {(formData.action === 'adjust_speed' || formData.action === 'start_motor') && (
                                <div className="form-group">
                                    <label>Motor Speed (0-255)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="255"
                                        value={formData.parameters.speed}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            parameters: { ...formData.parameters, speed: parseInt(e.target.value) }
                                        })}
                                    />
                                </div>
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
