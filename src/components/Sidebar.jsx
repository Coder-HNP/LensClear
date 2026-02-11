import { LayoutDashboard, Settings, FileText, Cpu, Zap, Copy, Check } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

const Sidebar = ({ isOpen, closeSidebar }) => {
    const { user } = useAuth();
    const [copied, setCopied] = useState(false);

    const copyUid = () => {
        if (user?.uid) {
            navigator.clipboard.writeText(user.uid);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

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
        transform transition-transform duration-300 ease-in-out z-30 flex flex-col
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
                <div className="p-4 space-y-1 flex-1 overflow-y-auto">
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

                {/* User UID Section */}
                {user && (
                    <div className="p-4 border-t border-gray-50 mt-auto">
                        <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">My User ID</p>
                            <div className="flex items-center justify-between gap-2">
                                <code className="text-[10px] text-gray-600 font-mono truncate flex-1">
                                    {user.uid}
                                </code>
                                <button
                                    onClick={copyUid}
                                    title="Copy ID"
                                    className={`p-1.5 rounded-lg transition-all duration-200 ${copied
                                        ? "bg-green-50 text-leaf-green"
                                        : "hover:bg-gray-200/50 text-gray-400 hover:text-gray-600"
                                        }`}
                                >
                                    {copied ? <Check size={14} /> : <Copy size={14} />}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </aside>
        </>
    );
};

export default Sidebar;
