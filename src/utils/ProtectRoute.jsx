import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectRoute = ({ children }) => {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/" />;
    }

    return children;
};

export default ProtectRoute;
