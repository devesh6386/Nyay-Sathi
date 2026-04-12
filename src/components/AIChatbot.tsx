import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, X, Send, Bot, User, Loader2, Minus, Maximize2 
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';

import { API_BASE_URL } from '@/config';

interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export const AIChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content: "Namaste! I am your Nyaya AI Assistant. How can I help you with Indian Legal queries today?",
      timestamp: new Date()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
      const data = await response.json();
      
      const aiMsg: Message = { 
        role: 'ai', 
        content: data.response || "I'm sorry, I couldn't process that. Please try again.", 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: "Network error. Please ensure the backend is running.", 
        timestamp: new Date() 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <Card className={`mb-4 w-[380px] sm:w-[420px] overflow-hidden flex flex-col shadow-2xl border-primary/20 bg-background/95 backdrop-blur-xl transition-all duration-300 ease-in-out origin-bottom-right ${isMinimized ? 'h-[60px]' : 'h-[600px] max-h-[80vh]'}`}>
          {/* Header */}
          <div className="p-4 gradient-saffron flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-md">
                <Scale className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-none">Nyaya AI Assistant ⚖️</h3>
                <span className="text-[10px] opacity-80 font-medium">Online • Justice for All</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages Area */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/10"
              >
                {messages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                  >
                    <div className={`max-w-[85%] flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-secondary text-primary'}`}>
                        {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>
                      <div className={`p-3 rounded-2xl text-sm ${
                        msg.role === 'user' 
                          ? 'bg-primary text-white rounded-tr-none' 
                          : 'bg-card border border-border text-foreground rounded-tl-none shadow-sm'
                      }`}>
                        {msg.content}
                        <div className={`text-[10px] mt-1 opacity-60 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-card border border-border p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground italic">Nyaya is thinking...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 bg-background border-t border-border">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex gap-2"
                >
                  <Input 
                    placeholder="Ask about BNS sections, FIR rules..." 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={loading}
                    className="flex-1 bg-secondary/30 h-10 text-sm border-none focus-visible:ring-1 ring-primary/50"
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={loading || !input.trim()}
                    className="h-10 w-10 shrink-0 gradient-saffron rounded-xl shadow-lg shadow-orange-500/10"
                  >
                    <Send className="h-4 w-4 text-white" />
                  </Button>
                </form>
                <p className="text-[10px] text-center text-muted-foreground mt-3 uppercase tracking-widest font-semibold opacity-60">
                  Powered by Llama 3.1 & BNS RAG
                </p>
              </div>
            </>
          )}
        </Card>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative h-14 w-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 hover:scale-105 active:scale-95 ${isOpen ? 'bg-card border border-border' : 'gradient-saffron text-white'}`}
        style={{ boxShadow: isOpen ? '0 10px 25px -5px rgba(0,0,0,0.1)' : '0 10px 25px -5px rgba(249,115,22,0.4)' }}
      >
        <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
        {isOpen ? (
          <X className="h-6 w-6 text-foreground animate-in spin-in-90 duration-300" />
        ) : (
          <div className="relative">
            <MessageCircle className="h-7 w-7 text-white animate-in zoom-in duration-300" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
          </div>
        )}
      </button>
    </div>
  );
};

// Re-using Scale for header
const Scale = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="M7 21h10" />
    <path d="M12 3v18" />
    <path d="M3 7h18" />
  </svg>
);
