import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import * as LightweightCharts from 'lightweight-charts';
import { 
  Search, TrendingUp, TrendingDown, Activity, 
  BarChart3, Calendar, Globe, ArrowUpCircle, ArrowDownCircle,
  ChevronDown, ChevronUp, Play, Square, Loader2, Check,
  LineChart as ChartIcon
} from 'lucide-react';

// Use environment variable with fallback to relative /api proxy
const API_BASE = import.meta.env.VITE_API_URL || "/api";
const BACKFILL_YEARS = 15;

export default function App() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [marketStatus, setMarketStatus] = useState('Checking...');
  const [syncMap, setSyncMap] = useState({}); // { SYMBOL: true/false }
  
  // Backfill State
  const [bulkStatus, setBulkStatus] = useState({
    is_running: false,
    total: 0,
    completed: 0,
    current_symbol: "",
  });
  const [isBoxOpen, setIsBoxOpen] = useState(true);

  // Helper to refresh sync status for all visible scrips
  const refreshSyncStates = useCallback(async (symbolsToCheck) => {
    // Collect all relevant symbols: suggestions + current viewed stock
    const list = symbolsToCheck || [
        ...suggestions.map(s => s.symbol),
        ...(stock ? [stock.info.symbol] : [])
    ];
    
    // Remove duplicates
    const uniqueList = [...new Set(list)];
    if (uniqueList.length === 0) return;

    try {
      const symbols = uniqueList.join(',');
      const res = await axios.get(`${API_BASE}/bulk-check-sync?symbols=${symbols}`);
      setSyncMap(prev => ({ ...prev, ...res.data }));
      
      // Update the main stock card specifically if it's in the response
      if (stock && res.data[stock.info.symbol] !== undefined) {
         setStock(prev => ({ ...prev, is_synced: res.data[stock.info.symbol] }));
      }
    } catch (e) { console.error("Sync check failed", e); }
  }, [suggestions, stock]);

  // Initial Market Status
  useEffect(() => {
    const fetchMarketStatus = async () => {
      try {
        const res = await axios.get(`${API_BASE}/market-status`);
        setMarketStatus(res.data.status);
      } catch (e) { setMarketStatus('Unknown'); }
    };
    fetchMarketStatus();
  }, []);

  // Polling for Progress
  useEffect(() => {
    const pollStatus = async () => {
      try {
        const res = await axios.get(`${API_BASE}/bulk-backfill/status`);
        const newStatus = res.data;
        
        // Detect ANY change in completed count or a finish event
        if (newStatus.completed > bulkStatus.completed || (bulkStatus.is_running && !newStatus.is_running)) {
           refreshSyncStates();
        }

        setBulkStatus(newStatus);
      } catch (e) { console.error("Status poll failed", e); }
    };
    
    const interval = setInterval(pollStatus, 2000);
    return () => clearInterval(interval);
  }, [bulkStatus.is_running, bulkStatus.completed, stock, suggestions, refreshSyncStates]);

  // Search logic
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

  // Refresh syncMap when suggestions change
  useEffect(() => {
    if (suggestions.length > 0) refreshSyncStates();
  }, [suggestions, refreshSyncStates]);

  const selectStock = async (symbol) => {
    setLoading(true);
    setSuggestions([]);
    setQuery('');
    try {
      const res = await axios.get(`${API_BASE}/details/${symbol}`);
      setStock(res.data);
    } catch (e) { alert("Failed to fetch live data."); }
    finally { setLoading(false); }
  };

  const syncSpecificStock = async (symbol) => {
    try {
      await axios.get(`${API_BASE}/backfill/${symbol}`);
    } catch (e) { console.error("Sync failed", e); }
  };

  const handleBulkAction = async () => {
    if (bulkStatus.is_running) {
      await axios.get(`${API_BASE}/bulk-backfill/stop`);
    } else {
      await axios.get(`${API_BASE}/bulk-backfill/start?years=${BACKFILL_YEARS}`);
      setIsBoxOpen(true);
    }
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
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Real-time Analytics</p>
                <div className="flex items-center gap-1.5 ml-1">
                  <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${marketStatus === 'Open' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`}></div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{marketStatus}</span>
                </div>
              </div>
            </div>
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
                  className="px-6 py-4 hover:bg-slate-800 group cursor-pointer flex justify-between items-center transition-all border-b border-slate-800/50 last:border-0"
                >
                  <div className="flex flex-col flex-1" onClick={() => selectStock(s.symbol)}>
                    <span className="font-bold text-white group-hover:scale-105 transition-transform origin-left">{s.symbol}</span>
                    <span className="text-xs text-slate-500 group-hover:text-indigo-100">{s.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {syncMap[s.symbol] ? (
                      <div className="bg-emerald-500/20 p-1.5 rounded-full text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                        <Check size={14} strokeWidth={4} />
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          syncSpecificStock(s.symbol);
                        }}
                        className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white text-[10px] font-black px-3 py-1.5 rounded-lg border border-indigo-500/30 transition-all active:scale-95"
                      >
                        SYNC 15Y
                      </button>
                    )}
                    <Globe size={16} className="text-slate-700 group-hover:text-indigo-200" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SETUP FEATURES SECTION */}
        <div className="mb-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between bg-slate-900/40 border border-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-500/10 p-3 rounded-xl">
                  <Activity size={24} className="text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Setup Features</h3>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Historical Data Ingestion (Last {BACKFILL_YEARS} Years)</p>
                </div>
              </div>
              
              <button
                onClick={handleBulkAction}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all shadow-lg ${
                  bulkStatus.is_running 
                  ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-105 active:scale-95'
                }`}
              >
                {bulkStatus.is_running ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                {bulkStatus.is_running ? 'STOP' : 'FETCH TOP 50 SCRIPS'}
              </button>
            </div>

            {/* PROGRESS BOX */}
            {(bulkStatus.is_running || bulkStatus.completed > 0) && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-top-4 duration-500">
                {/* PERSISTENT TOP PROGRESS BAR */}
                <div className="h-1.5 w-full bg-slate-950 relative">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                    style={{ width: `${bulkStatus.total > 0 ? (bulkStatus.completed / bulkStatus.total) * 100 : 0}%` }}
                  ></div>
                </div>

                <div className="p-4 px-6 flex items-center justify-between cursor-pointer group" onClick={() => setIsBoxOpen(!isBoxOpen)}>
                  <div className="flex items-center gap-3">
                    {bulkStatus.is_running ? (
                      <Loader2 className="animate-spin text-indigo-400" size={18} />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    )}
                    <span className="text-sm font-bold text-slate-300">
                      {bulkStatus.is_running ? `Fetching: ${bulkStatus.current_symbol}` : 'Backfill Completed'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest bg-slate-950 px-3 py-1 rounded-full border border-slate-800/50">
                      {bulkStatus.completed} / {bulkStatus.total} SCRIPS
                    </span>
                    {isBoxOpen ? <ChevronUp className="text-slate-600 group-hover:text-slate-400" size={20} /> : <ChevronDown className="text-slate-600 group-hover:text-slate-400" size={20} />}
                  </div>
                </div>

                {isBoxOpen && (
                  <div className="px-6 pb-6 pt-2 border-t border-slate-800/50 animate-in fade-in duration-300">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50 text-center">
                        <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Status</p>
                        <p className={`text-xs font-black ${bulkStatus.is_running ? 'text-indigo-400' : 'text-emerald-400'}`}>
                          {bulkStatus.is_running ? 'ACTIVE' : 'IDLE'}
                        </p>
                      </div>
                      <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50 text-center">
                        <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Time Range</p>
                        <p className="text-xs font-black text-slate-300">{BACKFILL_YEARS} YEARS</p>
                      </div>
                      <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50 text-center">
                        <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Remaining</p>
                        <p className="text-xs font-black text-slate-300">{bulkStatus.total - bulkStatus.completed}</p>
                      </div>
                      <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50 text-center">
                        <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Success Rate</p>
                        <p className="text-xs font-black text-slate-300">
                          {bulkStatus.total > 0 ? Math.round((bulkStatus.completed / bulkStatus.total) * 100) : 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
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
                    {stock.is_synced ? (
                      <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-500/20 flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2">
                        <div className="w-1 h-1 rounded-full bg-emerald-400"></div>
                        History Synced
                      </span>
                    ) : (
                      <button 
                        onClick={() => syncSpecificStock(stock.info.symbol)}
                        className="bg-amber-500/10 text-amber-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-amber-500/20 hover:bg-amber-500/20 transition-all flex items-center gap-1.5"
                      >
                        <Calendar size={10} />
                        Sync {BACKFILL_YEARS}Y History
                      </button>
                    )}
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

            {/* ANALYTICS SECTION */}
            {stock.is_synced && (
              <div className="mb-6 animate-in slide-in-from-bottom-4 duration-700">
                <StockChart symbol={stock.info.symbol} />
              </div>
            )}

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

function StockChart({ symbol }) {
  const chartContainerRef = useRef();
  const [range, setRange] = useState('1Y');
  const [loading, setLoading] = useState(false);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Use explicit LightweightCharts series additions
    const chart = LightweightCharts.createChart(chartContainerRef.current, {
      layout: {
        background: { type: LightweightCharts.ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.3)' },
        horzLines: { color: 'rgba(30, 41, 59, 0.3)' },
      },
      width: chartContainerRef.current.clientWidth || 800,
      height: 400,
      timeScale: {
        borderColor: 'rgba(30, 41, 59, 0.8)',
      },
    });

    // In v5, use addSeries with the series class/type
    let areaSeries;
    try {
        if (typeof chart.addSeries === 'function' && LightweightCharts.AreaSeries) {
            areaSeries = chart.addSeries(LightweightCharts.AreaSeries, {
                lineColor: '#6366f1',
                topColor: 'rgba(99, 102, 241, 0.3)',
                bottomColor: 'rgba(99, 102, 241, 0.0)',
                lineWidth: 2,
            });
        } else {
            // Fallback for older versions or if above fails
            areaSeries = chart.addAreaSeries({
                lineColor: '#6366f1',
                topColor: 'rgba(99, 102, 241, 0.3)',
                bottomColor: 'rgba(99, 102, 241, 0.0)',
                lineWidth: 2,
            });
        }
    } catch (e) {
        console.warn("API check failed, trying addAreaSeries directly", e);
        areaSeries = chart.addAreaSeries({
            lineColor: '#6366f1',
            topColor: 'rgba(99, 102, 241, 0.3)',
            bottomColor: 'rgba(99, 102, 241, 0.0)',
            lineWidth: 2,
        });
    }

    chartRef.current = { chart, areaSeries };

    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [symbol]);

  useEffect(() => {
    if (!chartRef.current) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/analytics/${symbol}?range=${range}`);
        if (chartRef.current && chartRef.current.areaSeries) {
            chartRef.current.areaSeries.setData(res.data);
            chartRef.current.chart.timeScale().fitContent();
        }
      } catch (e) {
        console.error("Chart data fetch failed", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol, range]);

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-8 backdrop-blur-md">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/20 p-2 rounded-xl">
            <ChartIcon className="text-indigo-400" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Price Analytics</h3>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Historical Performance</p>
          </div>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800/50">
          {['1M', '6M', '1Y', '5Y', 'ALL'].map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${range === r ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-slate-900/10 backdrop-blur-sm rounded-xl">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        )}
        <div ref={chartContainerRef} style={{ width: '100%', minHeight: '400px' }} />
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