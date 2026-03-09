import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function PaymentCurve({ paymentCurve }) {
  
  // If no data is available yet, show a placeholder
  if (!paymentCurve || paymentCurve.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-slate-500 space-y-4">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
           <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
           </svg>
        </div>
        <p>Please upload the Allocation CSV to generate the Payment Curve.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white">Collection Decay Curve</h2>
        <p className="text-slate-400 text-sm">Outstanding Premium (in Millions) across Lapse Ageing timelines</p>
      </div>

      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={paymentCurve}
            margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
          >
            {/* Background Grid */}
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            
            {/* Axes */}
            <XAxis 
              dataKey="time" 
              stroke="#94a3b8" 
              tick={{fill: '#94a3b8', fontSize: 12}} 
              dy={10}
            />
            <YAxis 
              stroke="#94a3b8" 
              tick={{fill: '#94a3b8', fontSize: 12}}
              dx={-10}
              tickFormatter={(value) => `₹${value}M`}
            />
            
            {/* Tooltip & Legend */}
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} 
              itemStyle={{ color: '#fff' }}
              formatter={(value) => [`₹${value} Million`, '']}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            
            {/* The 3 Data Lines */}
            <Line 
              type="monotone" 
              dataKey="High_Propensity" 
              name="High Risk (A.HIGH / GT5L)" 
              stroke="#ef4444" 
              strokeWidth={3} 
              dot={{ r: 4, strokeWidth: 2 }} 
              activeDot={{ r: 8 }} 
            />
            <Line 
              type="monotone" 
              dataKey="Medium_Propensity" 
              name="Medium Risk (B.MEDIUM)" 
              stroke="#eab308" 
              strokeWidth={3} 
              dot={{ r: 4, strokeWidth: 2 }} 
            />
            <Line 
              type="monotone" 
              dataKey="Low_Propensity" 
              name="Low Risk (C.LOW)" 
              stroke="#22c55e" 
              strokeWidth={3} 
              dot={{ r: 4, strokeWidth: 2 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Insight Card */}
      <div className="bg-blue-900/20 border border-blue-500/30 p-5 rounded-xl">
        <h4 className="text-blue-400 font-bold text-sm mb-2">Data Insight</h4>
        <p className="text-slate-300 text-sm leading-relaxed">
          This curve visualizes the drop-off in outstanding premium as accounts age. Notice how the <span className="text-red-400 font-bold">High Risk</span> line compares to the others as days past due increase. Steeper drop-offs indicate successful collections or write-offs within that specific time bucket.
        </p>
      </div>
    </div>
  );
}