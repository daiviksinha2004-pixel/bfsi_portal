import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, Database } from 'lucide-react';

export default function AIBot() {
  const [messages, setMessages] = useState([
    { sender: 'ai', text: "Hello! I am connected to the PostgreSQL database. Ask me about outstanding premiums, policy statuses, or risk propensity." }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/ask-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMsg })
      });
      const data = await response.json();
      
      setMessages(prev => [...prev, { sender: 'ai', text: data.answer }]);
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'ai', text: "Sorry, the connection to the server failed." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[80vh] flex flex-col bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900/50 p-4 border-b border-slate-700 flex items-center space-x-3">
        <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
          <Database size={24} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Data Analyst AI</h2>
          <p className="text-xs text-slate-400">PostgreSQL Natural Language Query Engine</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-800/50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex items-start space-x-3 ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-blue-600' : 'bg-slate-700 border border-slate-600'}`}>
              {msg.sender === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-blue-400" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-tr-none shadow-lg' : 'bg-slate-700 text-slate-200 rounded-tl-none shadow-xl border border-slate-600'}`}>
              <p className="text-sm leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center shrink-0">
              <Bot size={16} className="text-blue-400" />
            </div>
            <div className="bg-slate-700 text-slate-400 rounded-2xl rounded-tl-none px-5 py-3 border border-slate-600 flex space-x-2">
              <span className="animate-bounce">●</span><span className="animate-bounce delay-100">●</span><span className="animate-bounce delay-200">●</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-4 bg-slate-900/50 border-t border-slate-700">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your collection data..." 
            className="w-full bg-slate-800 border border-slate-600 text-white text-sm rounded-xl pl-4 pr-12 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}