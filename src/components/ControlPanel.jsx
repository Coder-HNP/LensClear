import { useState } from "react";
import { useDevice } from "../context/DeviceContext";
import { useAuth } from "../context/AuthContext";
import { sendDeviceCommand, createLog } from "../utils/firestoreAPI";
import { RotateCw, RefreshCw, Settings, AlertCircle } from "lucide-react";

const ControlButton = ({ icon: Icon, label, onClick, variant = 'default', loading }) => {
  const variants = {
    orange: "text-orange-500 bg-orange-50",
    purple: "text-purple-500 bg-purple-50",
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex flex-col items-center gap-2 group transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className={`p-4 rounded-2xl ${variants[variant] || 'bg-gray-50 text-gray-500'} group-hover:shadow-md group-active:scale-95 transition-all`}>
        <Icon size={24} className={loading ? "animate-spin" : ""} />
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </button>
  );
};

const ControlPanel = () => {
  const { selectedDeviceId } = useDevice();
  const { user } = useAuth();
  const [loadingAction, setLoadingAction] = useState(null);
  const [error, setError] = useState("");

  const handleAction = async (command, label, params = {}) => {
    if (!selectedDeviceId || !user) return;
    setLoadingAction(command);
    setError("");

    try {
      await sendDeviceCommand(selectedDeviceId, command, params);
      await createLog(user.uid, selectedDeviceId, "command", `Sent ${label} command`, `Command: ${command.toUpperCase()}`);
    } catch (err) {
      console.error("Action failed:", err);
      setError(`Failed to send command: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  if (!selectedDeviceId) return null;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Settings size={20} className="text-gray-400 font-normal" />
        Device Controls
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="flex gap-8">
        <ControlButton
          icon={RotateCw}
          label="Restart"
          variant="orange"
          onClick={() => handleAction('restart', 'Restart')}
          loading={loadingAction === 'restart'}
        />
        <ControlButton
          icon={RefreshCw}
          label="Trigger"
          variant="purple"
          onClick={() => handleAction('trigger_clean', 'Trigger')}
          loading={loadingAction === 'trigger_clean'}
        />
      </div>
    </div>
  );
};

export default ControlPanel;
