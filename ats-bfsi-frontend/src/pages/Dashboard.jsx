import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function Dashboard({ kpis, funnelData, agents, policyStatusPie }) {
  return (
    <div className="space-y-6">
      {/* --- TOP ROW: 8 KPI CARDS --- */}
      {/* Changed xl:grid-cols-8 to lg:grid-cols-4 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">    
        <MetricCard title="Policies Queue" value={kpis.total_policies} />
        <MetricCard title="Avg Ticket Size" value={kpis.avg_ticket_size} />
        <MetricCard title="Recovered (Paid)" value={kpis.recovered_policies} highlight="text-green-400" />
        <MetricCard title="Total Agents" value={agents.length > 0 ? agents.length : "-"} />
        
        <MetricCard title="High Prop Target" value={kpis.high_prop_target} highlight="text-orange-400" />
        <MetricCard title="Amt in Suspense" value={kpis.amount_in_suspense} highlight="text-yellow-400" />
        <MetricCard title="Interest Charged" value={kpis.interest_charged} highlight="text-blue-400" />
        <MetricCard title="High Risk (>180D)" value={kpis.high_risk_volume} alert />
      </div>

      {/* --- BOTTOM ROW: CHARTS --- */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Column (Pie Chart) */}
        <div className="col-span-12 lg:col-span-3 bg-slate-800 p-4 rounded-xl border border-slate-700 h-80 flex flex-col shadow-lg">
          <h3 className="text-sm font-semibold mb-2 text-white">Policy Status</h3>
          <div className="flex-1 min-h-0">
            {policyStatusPie && policyStatusPie.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={policyStatusPie} innerRadius={50} outerRadius={70} dataKey="value" paddingAngle={2}>
                    {policyStatusPie.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-500 text-center px-4">
                Upload CSV to view breakdown
              </div>
            )}
          </div>
        </div>

        {/* Center Column (Funnel) */}
        <div className="col-span-12 lg:col-span-6 bg-slate-800 p-5 rounded-xl border border-slate-700 flex flex-col shadow-lg">
          <h3 className="font-semibold mb-4 text-sm text-white">INSURANCE COLLECTIONS AGEING FUNNEL & RISK (In Millions)</h3>
          <p className="text-sm text-slate-400 mb-6">Total Outstanding: <span className="text-white font-bold">{kpis.total_outstanding}</span></p>
          
          <div className="flex-1 min-h-[250px]">
            {funnelData && funnelData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} width={90} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} />
                  <Bar dataKey="High" stackId="a" fill="#22c55e" radius={[4, 0, 0, 4]} />
                  <Bar dataKey="Medium" stackId="a" fill="#eab308" />
                  <Bar dataKey="Low" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-slate-500 text-center">
                Upload your CSV pipeline to generate insights.
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Agents) */}
        <div className="col-span-12 lg:col-span-3 bg-slate-800 p-5 rounded-xl border border-slate-700 flex flex-col shadow-lg">
          <h3 className="font-semibold mb-4 text-sm text-white">AGENT LEADERBOARD</h3>
          <div className="space-y-4 overflow-y-auto flex-1">
            {agents && agents.length > 0 ? agents.map((agent, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-700">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full ${agent.color} flex items-center justify-center text-xs font-bold text-white shadow-lg`}>
                    {agent.code.substring(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-white">{agent.code}</p>
                    <p className="text-xs text-slate-400">{agent.amount} • {agent.policies} Pols</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="flex items-center justify-center h-32 text-sm text-slate-500">
                Awaiting data...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Custom Metric Card to handle highlights
// Notice the use of 'min-w-0' and 'truncate' or responsive text sizing
function MetricCard({ title, value, highlight = "text-white", alert = false }) {
  return (
    <div className={`p-4 rounded-xl border flex flex-col justify-center min-w-0 ${
      alert ? 'bg-red-900/20 border-red-500/30' : 'bg-slate-800 border-slate-700 shadow-lg'
    }`}>
      <h3 className="text-slate-400 text-xs sm:text-sm font-medium mb-1 truncate">
        {title}
      </h3>
      {/* 1. 'min-w-0' forces the flex item to allow text truncation.
        2. text scaling (text-lg xl:text-xl) keeps it readable but contained.
        3. 'break-words' ensures if the number is too long, it wraps to the next line instead of breaking the box.
      */}
      <p className={`text-lg xl:text-xl font-bold break-words min-w-0 ${highlight}`}>
        {value}
      </p>
    </div>
  );
}