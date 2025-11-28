import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

const ChatPage: React.FC = () => {
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const autoMessage = location.state?.autoMessage;

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto assistant welcome message
  useEffect(() => {
    if (autoMessage) {
      const welcome: Message = {
        sender: 'bot',
        text: 'Hi there! How can I help you today?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => {
        const alreadySent = prev.some((msg) => msg.text === welcome.text);
        return alreadySent ? prev : [...prev, welcome];
      });
    }
  }, [autoMessage]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { sender: 'user', text: input, time: 'Just Now' };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
      const data = await res.json();

      const botReply: Message = {
        sender: 'bot',
        text: data.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botReply]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Something went wrong. Please try again later.', time: 'Just Now' }
      ]);
    }

    setTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-500 via-pink-500 to-orange-400 p-5 rounded-b-3xl">
        <div className="flex items-center justify-between">
          <div className="bg-white text-gray-900 rounded-full h-10 w-10 flex items-center justify-center font-bold">C</div>
          <button className="text-white text-xl font-bold" onClick={() => navigate(-1)}>×</button>
        </div>
        <div className="mt-4">
          <h1 className="text-xl font-bold">Casa</h1>
          <p className="text-white/80 text-sm leading-snug">
            A quick commerce app that delivers cloths in 60min 🚀.
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 px-4 py-3 overflow-y-auto space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
            {msg.sender === 'bot' && (
              <div className="text-sm text-gray-400 font-semibold mb-1">Assistant</div>
            )}
            <div
              className={`rounded-xl px-4 py-2 text-sm max-w-xs ${
                msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-white'
              }`}
            >
              {msg.text}
            </div>
            <div className="text-xs text-gray-500 mt-1">{msg.time}</div>
          </div>
        ))}

        {/* Typing dots */}
        {typing && (
          <div className="flex flex-col items-start">
            <div className="text-sm text-gray-400 font-semibold mb-1">Assistant</div>
            <div className="bg-gray-800 text-white px-4 py-2 rounded-xl text-sm max-w-xs animate-pulse">
              Typing<span className="animate-bounce delay-75">.</span>
              <span className="animate-bounce delay-150">.</span>
              <span className="animate-bounce delay-300">.</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input box */}
      <div className="p-4 border-t border-gray-700 flex items-center bg-gray-900">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Reply ..."
          className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-full text-sm outline-none"
        />
        <button onClick={handleSend} className="ml-2 bg-indigo-600 p-2 rounded-full">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path d="M22 2L11 13"></path>
            <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatPage;
