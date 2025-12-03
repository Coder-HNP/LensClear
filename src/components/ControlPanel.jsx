import { useState } from "react";
import PropTypes from 'prop-types';
import { useDevice } from "../context/DeviceContext";
import { useAuth } from "../context/AuthContext";
import { commandAPI } from "../services/api";
import { Power, RotateCw, Leaf, Zap, RefreshCw, Settings, AlertCircle } from "lucide-react";

// Define static color mappings to avoid dynamic class generation
const COLOR_VARIANTS = {
  red: {
    active: "bg-red-50 border-red-200",
    iconBg: "bg-red-50",
    text: "text-red-500"
  },
  green: {
    active: "bg-green-50 border-green-200",
    iconBg: "bg-green-50",
    text: "text-green-500"
  },
  orange: {
    active: "bg-orange-50 border-orange-200",
    iconBg: "bg-orange-50",
    text: "text-orange-500"
  },
  leaf: {
    active: "bg-green-50 border-green-200", // Fallback to green for custom leaf color
    iconBg: "bg-green-50",
    text: "text-leaf-green"
  },
  blue: {
    active: "bg-blue-50 border-blue-200",
    iconBg: "bg-blue-50",
    text: "text-bright-blue"
  },
  purple: {
    active: "bg-purple-50 border-purple-200",
    iconBg: "bg-purple-50",
    text: "text-purple-500"
  },
  default: {
    active: "bg-gray-50 border-gray-200",
    iconBg: "bg-gray-50",
    text: "text-gray-700"
  }
};

const ControlButton = ({ icon: Icon, label, onClick, variant = 'default', loading, active, disabled }) => {
  const styles = COLOR_VARIANTS[variant] || COLOR_VARIANTS.default;

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200
        ${active
          ? `${styles.active}`
          : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      <div className={`p-2 rounded-full mb-2 ${active ? 'bg-white' : styles.iconBg} ${styles.text}`}>
        <Icon size={24} className={loading ? "animate-spin" : ""} />
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </button>
  );
};

ControlButton.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(['red', 'green', 'orange', 'leaf', 'blue', 'purple', 'default']),
  loading: PropTypes.bool,
  active: PropTypes.bool,
  disabled: PropTypes.bool
};

const ControlPanel = () => {
  const { selectedDeviceId, currentDeviceData } = useDevice();
  const { user } = useAuth();
  const [loadingAction, setLoadingAction] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleAction = async (command, label, params = {}) => {
    if (!selectedDeviceId || !user) return;

    setLoadingAction(command);
    setError("");
    setSuccess("");

    try {
      // Send command via backend API
      const response = await commandAPI.send(selectedDeviceId, command, params);

      if (response.data.success) {
        setSuccess(`Command "${label}" sent successfully.`);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        throw new Error(response.data.message || 'Command failed');
      }
    } catch (err) {
      console.error("Action failed:", err);
      setError(`Failed to send command: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  if (!selectedDeviceId) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
        <Settings size={32} className="text-gray-300 mb-2" />
        <p className="text-gray-500">Select a device to access controls</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Settings size={20} className="text-gray-400" />
        Device Controls
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm">
          {success}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <ControlButton
          icon={Power}
          label={currentDeviceData?.status === 'online' ? "Turn Off" : "Turn On"}
          variant={currentDeviceData?.status === 'online' ? "red" : "green"}
          onClick={() => handleAction('toggle_power', 'Power Toggle', { targetState: currentDeviceData?.status === 'online' ? 'offline' : 'online' })}
          loading={loadingAction === 'toggle_power'}
        />
        <ControlButton
          icon={RotateCw}
          label="Restart"
          variant="orange"
          onClick={() => handleAction('restart', 'System Restart')}
          loading={loadingAction === 'restart'}
        />
        <ControlButton
          icon={Leaf}
          label="Eco Mode"
          variant="leaf"
          active={currentDeviceData?.mode === 'eco'}
          onClick={() => handleAction('set_mode', 'Eco Mode', { mode: 'eco' })}
          loading={loadingAction === 'set_mode'}
        />
        <ControlButton
          icon={Zap}
          label="Performance"
          variant="blue"
          active={currentDeviceData?.mode === 'performance'}
          onClick={() => handleAction('set_mode', 'Performance Mode', { mode: 'performance' })}
          loading={loadingAction === 'set_mode'}
        />
        <ControlButton
          icon={RefreshCw}
          label="Calibrate"
          variant="purple"
          onClick={() => handleAction('calibrate', 'Sensor Calibration')}
          loading={loadingAction === 'calibrate'}
        />
      </div>
    </div>
  );
};

export default ControlPanel;
