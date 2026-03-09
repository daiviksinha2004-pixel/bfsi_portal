import React, { useState } from 'react';
import { Lock, User } from 'lucide-react';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://127.0.0.1:8000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (data.status === "success") {
        onLogin(data.token);
      } else {
        setError("Invalid username or password");
      }
    } catch (err) {
      setError("Backend server is not running");
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-900">
      <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 w-96 shadow-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/ATS_LOGO1.png" alt="ATS Services" className="h-16 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
          <p className="text-slate-400 text-sm">BFSI Collection Management</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">Username</label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-2.5 text-slate-500" size={18} />
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-10 text-white focus:border-blue-500 outline-none" placeholder="admin" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">Password</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-2.5 text-slate-500" size={18} />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-10 text-white focus:border-blue-500 outline-none" placeholder="••••••••" />
            </div>
          </div>
          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg transition mt-4">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}