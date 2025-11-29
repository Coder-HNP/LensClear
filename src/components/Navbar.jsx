import { useAuth } from "../context/AuthContext";
import { LogOut, User, Bell, Menu } from "lucide-react";
import { useDevice } from "../context/DeviceContext";

const Navbar = ({ toggleSidebar }) => {
    const { user, logout } = useAuth();
    const { alerts = [] } = useDevice();

    return (
        <nav className="bg-white shadow-sm border-b border-gray-100 h-16 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20">
            <div className="flex items-center gap-4">
                <button onClick={toggleSidebar} className="md:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-600">
                    <Menu size={24} />
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-md">
                        <span className="text-white font-bold text-lg">L</span>
                    </div>
                    <span className="text-xl font-bold text-dark-gray tracking-tight">Lens<span className="text-bright-blue">Clear</span></span>
                </div>
            </div>

            {user && (
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors relative">
                            <Bell size={20} />
                            {alerts?.length > 0 && (
                                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                            )}
                        </button>
                    </div>

                    <div className="h-8 w-px bg-gray-200 mx-1 hidden md:block"></div>

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-semibold text-gray-800 leading-none">{user.displayName || "User"}</p>
                            <p className="text-xs text-gray-500 mt-1">{user.email}</p>
                        </div>
                        {user.photoURL ? (
                            <img src={user.photoURL} alt="Profile" className="w-9 h-9 rounded-full border-2 border-white shadow-sm" />
                        ) : (
                            <div className="w-9 h-9 bg-light-gray rounded-full flex items-center justify-center border border-gray-200">
                                <User size={18} className="text-gray-500" />
                            </div>
                        )}
                        <button onClick={logout} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors ml-1" title="Logout">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
