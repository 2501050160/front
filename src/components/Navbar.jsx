import { useState } from "react";
import { Search, Bell } from "lucide-react";

function Navbar({ 
    searchQuery = "", 
    onSearchChange,
    selectedCollege = "KLU",
    onAlertsClick 
}) {
    const [searchValue, setSearchValue] = useState(searchQuery);

    const handleSearch = (e) => {
        const val = e.target.value;
        setSearchValue(val);
        if (onSearchChange) onSearchChange(val);
    };

    return (
        <header className="w-full mb-6 sticky top-2 z-30">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3.5 rounded-2xl glass-panel border border-white/10 shadow-lg backdrop-blur-2xl bg-slate-900/60">
                <div className="flex items-center gap-3 shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#37E67D] animate-pulse"></span>
                    <span className="text-[12px] font-extrabold uppercase tracking-widest text-cyan-100">
                        Active Campus • {selectedCollege || "KLU"}
                    </span>
                </div>

                <div className="flex items-center flex-1 max-w-md w-full relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <input 
                        placeholder="Search campus buildings, blocks, or services..." 
                        className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/12 border border-white/15 text-sm text-white placeholder-cyan-100/60 focus:outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10 transition-all" 
                        type="text" 
                        value={searchValue}
                        onChange={handleSearch}
                    />
                </div>

                <button 
                    onClick={onAlertsClick}
                    className="relative px-3.5 py-2 rounded-xl bg-white/12 border border-white/15 flex items-center gap-2 text-cyan-50 hover:text-white hover:border-cyan-200/50 text-xs font-bold transition-all cursor-pointer shrink-0 active:scale-95"
                >
                    <Bell className="w-4 h-4" />
                    <span className="hidden sm:inline">Alerts</span>
                </button>
            </div>
        </header>
    );
}

export default Navbar;
