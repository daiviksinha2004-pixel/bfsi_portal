import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, IndianRupee, UploadCloud, LogOut, Bell, ShieldCheck, TrendingUp, MessageSquare } from 'lucide-react';

import Dashboard from './pages/Dashboard';
import ATSBoard from './pages/ATSboard';
import Login from './pages/Login'; 
import Profile from './pages/Profile';
import PaymentCurve from './pages/PaymentCurve';
import AIBot from './pages/Aibot'; 

// --- NEW COMPACT FORMATTER ---
// --- BULLETPROOF INDIAN CURRENCY FORMATTER ---
const formatCompactNumber = (num) => {
  const n = Number(num);
  if (isNaN(n) || n === null) return "-";
  
  // Format as Crores (Cr)
  if (n >= 10000000) {
    return `₹${(n / 10000000).toFixed(2)} Cr`;
  }
  // Format as Lakhs (L)
  if (n >= 100000) {
    return `₹${(n / 100000).toFixed(2)} L`;
  }
  // Format as Thousands (K)
  if (n >= 1000) {
    return `₹${(n / 1000).toFixed(1)} K`;
  }
  return `₹${n.toFixed(0)}`;
};

export default function App() {
  // --- AUTH STATE ---
  const [token, setToken] = useState(localStorage.getItem("adminToken"));

  const handleLogin = (newToken) => {
    setToken(newToken);
    localStorage.setItem("adminToken", newToken);
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("adminToken");
  };

  // --- DASHBOARD DATA STATE ---
  const [isUploading, setIsUploading] = useState(false);
  const [kpis, setKpis] = useState({ 
    total_policies: "-", total_outstanding: "-", 
    high_risk_volume: "-", avg_ticket_size: "-",
    amount_in_suspense: "-", interest_charged: "-", 
    high_prop_target: "-", recovered_policies: "-"  
  });
  const [funnelData, setFunnelData] = useState([]);
  const [policyStatusPie, setPolicyStatusPie] = useState([]);
  const [agents, setAgents] = useState([]);
  const [paymentCurve, setPaymentCurve] = useState([]);

  // --- 1. NEW: FETCH DASHBOARD DATA ON LOAD ---
  const fetchDashboardData = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/dashboard");
      const data = await response.json();
      
      if (data.status === "success") {
        
        // --- APPLIED COMPACT FORMATTING HERE ---
        const formattedOutstanding = formatCompactNumber(data.kpis.total_outstanding);
        const formattedHighRisk = formatCompactNumber(data.kpis.high_risk_volume);
        
        // Avg Ticket Size stays standard since it's usually a smaller number (e.g., ₹15,000)
        const formattedAvgTicket = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(data.kpis.avg_ticket_size);
        
        const formattedSuspense = formatCompactNumber(data.kpis.amount_in_suspense);
        const formattedInterest = formatCompactNumber(data.kpis.interest_charged);
        const formattedHighProp = formatCompactNumber(data.kpis.high_prop_target);

        setKpis({ 
          total_policies: data.kpis.total_policies.toLocaleString('en-IN'), 
          total_outstanding: formattedOutstanding, 
          high_risk_volume: formattedHighRisk,
          avg_ticket_size: formattedAvgTicket,
          amount_in_suspense: formattedSuspense,               
          interest_charged: formattedInterest,                 
          high_prop_target: formattedHighProp,                 
          recovered_policies: data.kpis.recovered_policies     
        });

        setFunnelData(data.funnel);
        setAgents(data.agents);
        setPolicyStatusPie(data.policy_status_pie); 
        setPaymentCurve(data.payment_curve || []);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data.", error);
    }
  };

  // Trigger fetch once when the app loads (if logged in)
  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);


  // --- 2. UPDATED UPLOAD LOGIC ---
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Step 1: Push file into PostgreSQL
      await fetch("http://127.0.0.1:8000/api/collections/upload-allocation", { 
        method: "POST", 
        body: formData 
      });
      
      // Step 2: Refresh the dashboard visuals from the newly populated database!
      await fetchDashboardData();
      alert("Database updated successfully!");
      
    } catch (error) {
      alert("Error uploading to database!");
    } finally {
      setIsUploading(false);
    }
  };

  // --- RENDER GUARD ---
  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="flex h-screen bg-slate-900 text-slate-200 font-sans">
        
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-slate-800 flex flex-col justify-between border-r border-slate-700">
          <div>
            <div className="p-4 mb-6 flex justify-center">
              <img src="/ATS_LOGO1.png" alt="ATS Services" className="h-12 object-contain" />
            </div>
            
            <nav className="space-y-1 px-3">
              <NavItem to="/" icon={<LayoutDashboard size={18} />} label="Main Dashboard" />
              <NavItem to="/ats" icon={<Users size={18} />} label="Applicant Tracking" />
              <NavItem to="/pipeline" icon={<IndianRupee size={18} />} label="Collections Pipeline" />
              <NavItem to="/payment-curve" icon={<TrendingUp size={18} />} label="Payment Curve" />
              <NavItem to="/ask-ai" icon={<MessageSquare size={18} />} label="Ask AI Bot" />
              <NavItem to="/profile" icon={<ShieldCheck size={18} />} label="Admin Profile" />

              <div className="mt-6 px-3">
                <label className="flex items-center space-x-3 px-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 cursor-pointer transition text-white shadow-lg shadow-blue-600/20">
                  <UploadCloud size={18} />
                  <span className="text-sm font-medium">{isUploading ? "Uploading..." : "Upload CSV Data"}</span>
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </nav>
          </div>

          <div className="p-4 border-t border-slate-700">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 bg-slate-700/50 hover:bg-red-500/10 hover:text-red-500 border border-slate-700 text-slate-400 py-2.5 rounded-xl transition-all"
            >
              <LogOut size={18} />
              <span className="font-medium text-sm">Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="h-16 flex items-center justify-between px-6 border-b border-slate-700 bg-slate-800/50">
            <h2 className="text-xl font-semibold">Insurance Collections & ATS Services</h2>
            <div className="flex items-center space-x-4">
              <Bell size={18} className="text-slate-400 cursor-pointer" />
              <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-[10px] font-bold">AD</div>
            </div>
          </header>

          <div className="flex-1 overflow-auto p-6">
            <Routes>
              <Route path="/" element={<Dashboard kpis={kpis} funnelData={funnelData} agents={agents} policyStatusPie={policyStatusPie} />} />
              <Route path="/ats" element={<ATSBoard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/ask-ai" element={<AIBot />} />
              <Route path="/payment-curve" element={<PaymentCurve paymentCurve={paymentCurve} />} />
              <Route path="/pipeline" element={<div className="text-center mt-10 text-slate-400">Pipeline Table Coming Soon</div>} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

function NavItem({ icon, label, to }) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link to={to}>
      <div className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg cursor-pointer transition ${active ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}>
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
    </Link>
  );
}