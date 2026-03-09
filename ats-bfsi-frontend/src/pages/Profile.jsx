import React from 'react';
import { User, Briefcase, GraduationCap, Code, Database, Server, Terminal } from 'lucide-react';

export default function Profile() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">System Administrator Profile</h2>
          <p className="text-slate-400 text-sm">Dashboard Architect & Lead Developer</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Column: ID Card */}
        <div className="col-span-12 md:col-span-4 space-y-6">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 text-center shadow-lg">
            <div className="w-24 h-24 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
              <User className="text-blue-500" size={40} />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">System Admin</h3>
            <p className="text-sm text-blue-400 font-medium mb-4">Intern</p>
            
            <div className="inline-flex items-center space-x-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-semibold text-slate-300 tracking-wider">SYSTEM ONLINE</span>
            </div>
          </div>

          {/* Education Card */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 shadow-lg">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center">
              <GraduationCap size={14} className="mr-2" /> Contact Info
            </h4>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-white">sinhadaivik8122@gmail.com</p>
                <p className="text-xs text-slate-400">8287035751</p>
              </div>
              <div className="pt-2 border-t border-slate-700">
                <p className="text-sm font-semibold text-white">ATS Services</p>
                <p className="text-xs text-slate-400">Faridabad</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Project & Tech Details */}
        <div className="col-span-12 md:col-span-8 space-y-6">
          
          {/* Project Info */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-lg">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center">
              <Briefcase size={14} className="mr-2" /> Project Overview
            </h4>
            <div className="space-y-4">
              <div>
                <h5 className="text-white font-semibold mb-1">ATS & BFSI Collection Performance Tracking</h5>
                <p className="text-sm text-slate-400 leading-relaxed">
                  A full-stack, automated command center designed to process raw CSV financial allocations. 
                  It cleanses outstanding premium data, calculates critical lapse ageing buckets, and visualizes 
                  high-risk propensity distribution. Built to track collection performance metrics and agent leaderboards in real-time.
                </p>
              </div>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-lg">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center">
              <Terminal size={14} className="mr-2" /> Technical Architecture
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                <div className="flex items-center space-x-2 mb-2">
                  <Code size={16} className="text-blue-400" />
                  <span className="font-semibold text-sm text-white">Frontend</span>
                </div>
                <p className="text-xs text-slate-400">React.js, Tailwind CSS, Recharts, React Router, Lucide Icons.</p>
              </div>
              
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                <div className="flex items-center space-x-2 mb-2">
                  <Server size={16} className="text-green-400" />
                  <span className="font-semibold text-sm text-white">Backend</span>
                </div>
                <p className="text-xs text-slate-400">Python, FastAPI, Uvicorn, JWT Security Logic.</p>
              </div>

              <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                <div className="flex items-center space-x-2 mb-2">
                  <Database size={16} className="text-purple-400" />
                  <span className="font-semibold text-sm text-white">Data Processing</span>
                </div>
                <p className="text-xs text-slate-400">Pandas Dataframes, NumPy, Big Data parsing methodologies.</p>
              </div>

              <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                <div className="flex items-center space-x-2 mb-2">
                  <User size={16} className="text-orange-400" />
                  <span className="font-semibold text-sm text-white">Core Competencies</span>
                </div>
                <p className="text-xs text-slate-400">Data Analysis, Machine Learning, NLP, Hadoop, MapReduce.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}