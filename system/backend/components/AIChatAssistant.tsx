
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Loader2 } from 'lucide-react';
import { chatWithAssistant } from '../lib/gemini';

const AIChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const stream = await chatWithAssistant(userMsg, messages);
      let assistantMsg = '';
      
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      
      for await (const chunk of stream) {
        assistantMsg += chunk.text;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), { ...last, content: assistantMsg }];
        });
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，我現在無法連線，請稍後再試。' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-orange-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-orange-700 transition-all z-40 hover:scale-110 active:scale-90 group"
      >
        <MessageSquare size={28} className="group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[550px] bg-white rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-100 animate-in slide-in-from-bottom-6 duration-500">
          <div className="p-5 bg-orange-600 text-white flex items-center justify-between shadow-lg relative z-10">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <Bot size={22} className="text-white" />
              </div>
              <div>
                <span className="font-black block text-sm">蘭光 AI 租賃助手</span>
                <span className="text-[10px] opacity-80 font-bold uppercase tracking-widest">Active Intelligence</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-2 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/50 scrollbar-hide">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 py-20 flex flex-col items-center">
                <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-4">
                  <Bot size={40} className="opacity-10" />
                </div>
                <p className="text-xs font-bold leading-relaxed text-gray-400">
                  您好！我是蘭光租賃的 AI 助手。<br/>
                  我可以協助您查詢車況、計算租金<br/>
                  或了解租賃流程，請隨時提問。
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-sm font-medium leading-relaxed ${
                  m.role === 'user' ? 'bg-orange-600 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && !messages[messages.length - 1]?.content && (
              <div className="flex justify-start">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center rounded-tl-none">
                  <Loader2 size={16} className="animate-spin text-orange-500 mr-2" />
                  <span className="text-xs font-bold text-gray-400">思考中...</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-5 border-t border-gray-100 bg-white">
            <div className="flex items-center space-x-3">
              <input
                type="text"
                placeholder="在此輸入問題..."
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-gray-400"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="p-3 bg-orange-600 text-white rounded-2xl hover:bg-orange-700 transition-all disabled:opacity-30 disabled:hover:scale-100 shadow-lg shadow-orange-100 active:scale-90"
              >
                <Send size={20} />
              </button>
            </div>
            <p className="text-[10px] text-gray-300 text-center mt-3 font-medium">由 Gemini 3.0 Pro 技術驅動</p>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatAssistant;
