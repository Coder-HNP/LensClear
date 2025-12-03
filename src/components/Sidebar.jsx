import { LayoutDashboard, Settings, FileText, Cpu, Zap } from "lucide-react";
import { NavLink } from "react-router-dom";

const Sidebar = ({ isOpen, closeSidebar }) => {
    const links = [
        { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
        { icon: Cpu, label: "Devices", path: "/devices" },
        { icon: Zap, label: "Triggers", path: "/triggers" },
        { icon: FileText, label: "Logs", path: "/logs" },
        { icon: Settings, label: "Settings", path: "/settings" },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-20 md:hidden backdrop-blur-sm"
                    onClick={closeSidebar}
                ></div>
            )}

            <aside className={`
        fixed md:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-100 
        transform transition-transform duration-300 ease-in-out z-30
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
                <div className="p-4 space-y-1">
                    <div className="px-4 py-2 mb-4">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Main Menu</p>
                    </div>
                    {links.map((link) => (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            onClick={() => window.innerWidth < 768 && closeSidebar()}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? "bg-primary/5 text-primary font-medium shadow-sm"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                }`
                            }
                        >
                            <link.icon size={20} className="group-hover:text-gray-700" />
                            <span>{link.label}</span>
                        </NavLink>
                    ))}
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
