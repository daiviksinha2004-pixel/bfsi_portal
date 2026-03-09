import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search, FileText } from 'lucide-react';

export default function ATSBoard() {
  const [policies, setPolicies] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);

  // 1. THE PAGINATION ENGINE
  const fetchPolicies = async (currentPage) => {
    setLoading(true);
    try {
      // Ask FastAPI for just 100 rows at a time
      const response = await fetch(`http://127.0.0.1:8000/api/policies?page=${currentPage}&limit=100`);
      const data = await response.json();
      
      if (data.status === "success") {
        setPolicies(data.data);
        setTotalPages(data.total_pages);
        setTotalRecords(data.total_records);
      }
    } catch (error) {
      console.error("Failed to fetch table data", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. TRIGGER FETCH WHEN PAGE CHANGES
  useEffect(() => {
    fetchPolicies(page);
  }, [page]);

  const handleNext = () => {
    if (page < totalPages) setPage(page + 1);
  };

  const handlePrev = () => {
    if (page > 1) setPage(page - 1);
  };

  return (
    <div className="space-y-4 h-full flex flex-col max-w-7xl mx-auto">
      
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">ATS Tracking Table</h2>
          <p className="text-sm text-slate-400">
            Showing Page {page} of {totalPages} ({totalRecords.toLocaleString('en-IN')} total policies)
          </p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search Cust ID..." 
            className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg pl-10 pr-4 py-2 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-700">
              <tr>
                <th className="px-6 py-4 font-semibold">Customer ID</th>
                <th className="px-6 py-4 font-semibold">Product Name</th>
                <th className="px-6 py-4 font-semibold">Paid To Date</th>
                <th className="px-6 py-4 font-semibold">Term</th>
                <th className="px-6 py-4 font-semibold text-right">Outstanding (₹)</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
                      <span>Loading database records...</span>
                    </div>
                  </td>
                </tr>
              ) : policies.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500 flex flex-col items-center justify-center">
                    <FileText size={32} className="mb-2 text-slate-600" />
                    <span>No data available. Please upload a CSV to the database.</span>
                  </td>
                </tr>
              ) : (
                policies.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-6 py-3 font-medium text-white">{p.CUST_ID}</td>
                    <td className="px-6 py-3 text-slate-400">{p.PRODUCT_NAME}</td>
                    <td className="px-6 py-3">{p.PAID_TO_DATE}</td>
                    <td className="px-6 py-3">{p.POLICY_PAYING_TERM} Yrs</td>
                    <td className="px-6 py-3 text-right font-medium text-orange-400">
                      {new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(p.OUTSTANDING_PREMIUM)}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${
                        p.POLICY_STATUS === 'Paid up' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 
                        p.POLICY_STATUS === 'Lapse' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                        'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                      }`}>
                        {p.POLICY_STATUS}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls Footer */}
        <div className="bg-slate-900 border-t border-slate-700 px-6 py-3 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">
            Database Engine: PostgreSQL Active
          </p>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handlePrev} 
              disabled={page === 1 || loading}
              className="p-1.5 rounded bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-medium text-slate-300 px-3">
              Page <span className="text-white">{page}</span> of {totalPages}
            </span>
            <button 
              onClick={handleNext} 
              disabled={page === totalPages || loading}
              className="p-1.5 rounded bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}