import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, TrendingUp, TrendingDown, Activity, 
  BarChart3, Calendar, Globe, ArrowUpCircle, ArrowDownCircle 
} from 'lucide-react';

// Change this to your ThinkPad IP if accessing from another device
const API_BASE = "http://192.168.1.100:8000/api";

export default function App() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 3) return setSuggestions([]);
    const timeout = setTimeout(async () => {
      try {
        const res = await axios.get(`${API_BASE}/symbols?q=${query}`);
        setSuggestions(res.data);
      } catch (e) { console.error("Search error", e); }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const selectStock = async (symbol) => {
    setLoading(true);
    setSuggestions([]);
    setQuery(''); // Clear search after selection
    try {
      const res = await axios.get(`${API_BASE}/details/${symbol}`);
      setStock(res.data);
    } catch (e) { alert("Failed to fetch live data."); }
    finally { setLoading(false); }
  };

  const isPositive = stock?.priceInfo?.pChange >= 0;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-4 md:p-10 font-sans selection:bg-indigo-500/30">
      <div className="max-w-5xl mx-auto">
        
        {/* TOP NAV BAR */}
        <nav className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
              <Activity size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-white">NSE<span className="text-indigo-500">PRO</span></h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Real-time Analytics</p>
            </div>
          </div>
          <div className="hidden md:flex gap-6 text-sm font-medium text-slate-400">
            <span className="hover:text-indigo-400 cursor-pointer transition-colors">Markets</span>
            <span className="hover:text-indigo-400 cursor-pointer transition-colors">Screener</span>
            <span className="hover:text-indigo-400 cursor-pointer transition-colors">Portfolio</span>
          </div>
        </nav>

        {/* MODERN SEARCH BAR */}
        <div className="relative mb-16 max-w-2xl mx-auto">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={22} />
            <input
              className="w-full bg-slate-900/50 border-2 border-slate-800 rounded-2xl py-5 pl-14 pr-6 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all text-xl font-medium placeholder:text-slate-600 shadow-2xl"
              placeholder="Search by Symbol or Company Name..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>

          {/* AUTOCOMPLETE DROPDOWN */}
          {suggestions.length > 0 && (
            <div className="absolute w-full mt-3 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
              {suggestions.map(s => (
                <div 
                  key={s.symbol}
                  onClick={() => selectStock(s.symbol)}
                  className="px-6 py-4 hover:bg-indigo-600 group cursor-pointer flex justify-between items-center transition-all border-b border-slate-800/50 last:border-0"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-white group-hover:scale-105 transition-transform origin-left">{s.symbol}</span>
                    <span className="text-xs text-slate-500 group-hover:text-indigo-100">{s.name}</span>
                  </div>
                  <Globe size={16} className="text-slate-700 group-hover:text-indigo-200" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-indigo-400 font-bold tracking-widest text-xs uppercase">Fetching Market Data...</p>
          </div>
        )}

        {/* STOCK DASHBOARD CARD */}
        {stock && !loading && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            {/* MAIN HEADER CARD */}
            <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 shadow-2xl mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <BarChart3 size={120} />
              </div>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-indigo-500/10 text-indigo-400 text-xs font-black px-3 py-1 rounded-full uppercase tracking-tighter">Equity</span>
                    <span className="text-slate-500 font-mono text-sm">{stock.info.symbol}</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black text-white mb-1 tracking-tight">{stock.info.companyName}</h2>
                  <p className="text-slate-400 flex items-center gap-2 text-sm">
                    <Globe size={14} /> National Stock Exchange of India
                  </p>
                </div>

                <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800 flex flex-col items-end">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Current Market Price</p>
                  <div className="text-5xl font-black text-white mb-2">
                    ₹{stock.priceInfo.lastPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-sm ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {isPositive ? <TrendingUp size={18}/> : <TrendingDown size={18}/>}
                    {isPositive ? 'UP' : 'DOWN'} {Math.abs(stock.priceInfo.pChange).toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>

            {/* STATS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                label="Intraday High" 
                value={`₹${stock.priceInfo.intraDayHighLow.high}`} 
                icon={<ArrowUpCircle className="text-emerald-500" size={20} />} 
                desc="Highest price today"
              />
              <StatCard 
                label="Intraday Low" 
                value={`₹${stock.priceInfo.intraDayHighLow.low}`} 
                icon={<ArrowDownCircle className="text-rose-500" size={20} />} 
                desc="Lowest price today"
              />
              <StatCard 
                label="VWAP" 
                value={`₹${stock.priceInfo.vwa.toFixed(2)}`} 
                icon={<Activity className="text-indigo-500" size={20} />} 
                desc="Volume Weighted Avg"
              />
              <StatCard 
                label="52-Week High" 
                value={`₹${stock.azMarket.high52}`} 
                icon={<Calendar className="text-amber-500" size={20} />} 
                desc="Yearly record high"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, desc }) {
  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-[1.5rem] hover:border-slate-700 transition-all group">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-slate-950 rounded-lg group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white mb-1 tracking-tight">{value}</div>
      <p className="text-[10px] text-slate-600 font-medium uppercase">{desc}</p>
    </div>
  );
}