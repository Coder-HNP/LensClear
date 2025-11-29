import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { DeviceProvider } from "./context/DeviceContext.jsx";
import ProtectRoute from "./utils/ProtectRoute.jsx";

// Pages
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Devices from "./pages/Devices.jsx";
import DeviceDetails from "./pages/DeviceDetails.jsx";
import Logs from "./pages/Logs.jsx";
import Settings from "./pages/Settings.jsx";

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
