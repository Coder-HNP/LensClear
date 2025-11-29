import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { DeviceProvider } from "./context/DeviceContext";
import ProtectRoute from "./utils/ProtectRoute";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Devices from "./pages/Devices";
import DeviceDetails from "./pages/DeviceDetails";
import Logs from "./pages/Logs";
import Settings from "./pages/Settings";

function App() {
  return (
    <Router>
      <AuthProvider>
        <DeviceProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectRoute>
                <Dashboard />
              </ProtectRoute>
            } />
            <Route path="/devices" element={
              <ProtectRoute>
                <Devices />
              </ProtectRoute>
            } />
            <Route path="/devices/:id" element={
              <ProtectRoute>
                <DeviceDetails />
              </ProtectRoute>
            } />
            <Route path="/logs" element={
              <ProtectRoute>
                <Logs />
              </ProtectRoute>
            } />
            <Route path="/settings" element={
              <ProtectRoute>
                <Settings />
              </ProtectRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </DeviceProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
