import { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import LogsTable from "../components/LogsTable";

const Logs = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-light-gray flex flex-col">
            <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />

                <main className="flex-1 p-4 md:p-6 overflow-y-auto h-[calc(100vh-4rem)]">
                    <div className="max-w-7xl mx-auto space-y-6">
                        <div>
                            <h1 className="text-2xl font-bold text-dark-gray">System Logs</h1>
                            <p className="text-gray-500 text-sm">History of all device events and actions</p>
                        </div>

                        <LogsTable limit={50} />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Logs;
