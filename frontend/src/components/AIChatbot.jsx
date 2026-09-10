import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  Sparkles,
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  ExternalLink,
  ChevronDown,
  ChefHat,
  CheckCircle2,
  PhoneCall
} from 'lucide-react';

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am **ChefBot**, your CampusBite AI Dining Assistant. Ask me anything about today\'s canteen menu, calories, Jain/Veg options, HACK50 discounts, or live kitchen queue wait times!',
      suggestions: ['Show Jain items', 'How does HACK50 work?', 'What is in Paneer Thali?', 'Connect on WhatsApp']
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    const userMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('/api/ai/chat', { message: text });
      if (res.data.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: res.data.reply,
            suggestions: res.data.suggestions || [],
            whatsappLink: res.data.whatsappLink
          }
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I had trouble reaching the canteen database. You can reach the canteen helpdesk on WhatsApp at +91 98765 43210.',
          suggestions: ['Try again', 'Show Menu']
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-3.5 bg-gradient-to-tr from-flame-600 to-amber-500 hover:from-flame-700 hover:to-amber-600 text-white rounded-full shadow-2xl shadow-flame-600/40 flex items-center gap-2 group transition-all duration-300 hover:scale-105"
          title="Open AI Canteen Assistant"
        >
          <div className="relative">
            <Bot className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white"></span>
          </div>
          <span className="text-xs font-black pr-1 hidden sm:inline">Ask AI Assistant</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-96 bg-white rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-900/30 flex flex-col overflow-hidden max-h-[550px] h-[550px] animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-flame-900 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-flame-600 text-white flex items-center justify-center shadow-inner">
                <ChefHat className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="font-extrabold text-sm flex items-center gap-1.5">
                  <span>ChefBot AI</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                </div>
                <div className="text-[10px] text-slate-300">Live Campus Dining Assistant</div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowWhatsappModal(true)}
                className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-white/10 rounded-lg transition-colors text-xs font-bold flex items-center gap-1"
                title="Open WhatsApp Help"
              >
                <span>WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 text-xs">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-start gap-2 max-w-[85%]">
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs text-[10px]">
                      🤖
                    </div>
                  )}

                  <div
                    className={`p-3 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-flame-600 text-white rounded-tr-xs shadow-sm font-medium'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-xs'
                    }`}
                  >
                    {msg.content}

                    {/* WhatsApp Action Button if included */}
                    {msg.whatsappLink && (
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <a
                          href={msg.whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[11px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-200"
                        >
                          <span>💬 Continue on WhatsApp (+91 98765 43210)</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Suggestions Pills */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 ml-8">
                    {msg.suggestions.map((sug, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => handleSendMessage(sug)}
                        className="px-2.5 py-1 rounded-full bg-white border border-flame-200 text-flame-700 hover:bg-flame-50 text-[10px] font-bold shadow-2xs transition-all"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-400 italic text-[11px] ml-8">
                <div className="w-2 h-2 rounded-full bg-flame-600 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-flame-600 animate-bounce delay-100"></div>
                <div className="w-2 h-2 rounded-full bg-flame-600 animate-bounce delay-200"></div>
                <span>ChefBot is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about menu, Jain, HACK50..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-100 border-none text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-flame-500 focus:outline-none"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !input.trim()}
              className="p-2.5 bg-flame-600 hover:bg-flame-700 disabled:opacity-50 text-white rounded-xl shadow-sm transition-all"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* WhatsApp Integration Modal */}
      {showWhatsappModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-sm w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <PhoneCall className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black text-slate-900 text-center font-sans">
              CampusBite WhatsApp Helpdesk
            </h3>
            <p className="text-xs text-slate-500 text-center mt-1">
              Connect directly with North Canteen floor managers and Chef Vikram Sharma.
            </p>

            <div className="my-4 p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
              <div className="font-bold">Verified University Canteen Line:</div>
              <div className="font-mono text-sm font-black text-emerald-700">+91 98765 43210</div>
              <div className="text-[10px] text-emerald-800 font-medium">Average Response: &lt; 2 minutes</div>
            </div>

            <div className="flex flex-col gap-2">
              <a
                href="https://wa.me/919876543210?text=Hi%20CampusBite%20Canteen%20Manager%2C%20I%20need%20help%20with%20my%20order"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors"
              >
                <span>Open in WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => setShowWhatsappModal(false)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
