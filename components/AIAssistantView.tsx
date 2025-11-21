import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { askBusinessAdvisor } from '../services/geminiService';
import { Product, Sale, ChatMessage } from '../types';

interface AIAssistantViewProps {
  inventory: Product[];
  sales: Sale[];
}

const AIAssistantView: React.FC<AIAssistantViewProps> = ({ inventory, sales }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: 'Bonjour ! Je suis TechAdvisor. Je peux analyser vos ventes, surveiller vos stocks ou rédiger des descriptions de produits. Que puis-je faire pour vous aujourd\'hui ?',
      timestamp: new Date(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const responseText = await askBusinessAdvisor(userMsg.text, inventory, sales);

    const modelMsg: ChatMessage = { role: 'model', text: responseText, timestamp: new Date() };
    setMessages((prev) => [...prev, modelMsg]);
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Sparkles size={24} className="text-yellow-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Assistant IA Business</h2>
            <p className="text-indigo-100 text-sm opacity-90">Propulsé par Gemini 2.5</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[80%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-slate-800 text-white' : 'bg-white border border-indigo-100 text-indigo-600'}`}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              
              <div
                className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-slate-800 text-white rounded-tr-none'
                    : 'bg-white text-slate-700 border border-gray-100 rounded-tl-none'
                }`}
              >
                {msg.text}
                <div className={`text-[10px] mt-2 ${msg.role === 'user' ? 'text-slate-400' : 'text-slate-400'}`}>
                    {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
          </div>
        ))}
        {loading && (
           <div className="flex justify-start w-full">
             <div className="flex gap-3 max-w-[80%]">
               <div className="w-10 h-10 rounded-full bg-white border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
                 <Loader2 size={20} className="animate-spin" />
               </div>
               <div className="p-4 bg-white rounded-2xl rounded-tl-none shadow-sm border border-gray-100 text-slate-500 text-sm flex items-center">
                  TechAdvisor réfléchit...
               </div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center gap-3 max-w-4xl mx-auto bg-slate-50 p-2 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
          <input
            type="text"
            className="flex-1 bg-transparent px-4 py-2 outline-none text-slate-700 placeholder-slate-400"
            placeholder="Demandez une analyse de stock ou une idée marketing..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className={`p-3 rounded-lg transition-all ${
              loading || !input.trim()
                ? 'bg-gray-200 text-gray-400'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
            }`}
          >
            <Send size={20} />
          </button>
        </div>
        <div className="text-center mt-2">
             <p className="text-xs text-slate-400">L'IA peut faire des erreurs. Vérifiez les informations importantes.</p>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantView;
