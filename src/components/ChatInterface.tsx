import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import { ChatMessage } from '../types';
import { sendMessageStream } from '../services/geminiService';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

interface ChatInterfaceProps {
  onStepUpdate: (message: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onStepUpdate }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [learningLevel, setLearningLevel] = useState<'beginner' | 'normal' | 'advanced'>('normal');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load chat history from Firestore if user is logged in
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const q = query(
        collection(db, 'users', user.uid, 'messages'),
        orderBy('timestamp', 'asc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const loadedMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as ChatMessage));
        
        if (loadedMessages.length === 0) {
          setMessages([{
            id: 'welcome',
            role: 'model',
            text: "Namaste! I'm your Election Education Assistant. 🗳️\n\nI'm here to help you navigate the voting process. How can I guide you today?",
            timestamp: Date.now()
          }]);
        } else {
          setMessages(loadedMessages);
        }
      });
      return () => unsubscribe();
    } else {
      setMessages([{
        id: 'welcome',
        role: 'model',
        text: "Namaste! I'm your Election Education Assistant. 🗳️\n\nI'm here to help you navigate the voting process. How can I guide you today?",
        timestamp: Date.now()
      }]);
    }
  }, []);

  const starters = [
    "I am a first-time voter",
    "How do I register?",
    "Can I vote without a card?",
    "Explain NOTA to me"
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim() || isLoading) return;

    // Append learning level context if it's not the default
    const processedInput = learningLevel === 'beginner' 
      ? `${textToSend} (Please explain this like I am 10 years old)`
      : learningLevel === 'advanced'
      ? `${textToSend} (Please provide a detailed and insightful explanation)`
      : textToSend;

    const user = auth.currentUser;
    const userMessage = {
      role: 'user' as const,
      text: textToSend,
      timestamp: Date.now()
    };

    if (user) {
      await addDoc(collection(db, 'users', user.uid, 'messages'), userMessage);
    } else {
      setMessages(prev => [...prev, { id: Date.now().toString(), ...userMessage }]);
    }
    
    setInput('');
    setIsLoading(true);

    const modelMessageId = (Date.now() + 1).toString();
    // For non-logged users, we still need local state updates for the stream
    if (!user) {
      setMessages(prev => [...prev, {
        id: modelMessageId,
        role: 'model',
        text: '',
        timestamp: Date.now()
      }]);
    }

    try {
      let accumulatedText = '';
      const stream = sendMessageStream(messages, processedInput);
      
      for await (const chunk of stream) {
        accumulatedText += chunk;
        if (!user) {
          setMessages(prev => prev.map(msg => 
            msg.id === modelMessageId ? { ...msg, text: accumulatedText } : msg
          ));
        }
      }

      if (user) {
        await addDoc(collection(db, 'users', user.uid, 'messages'), {
          role: 'model',
          text: accumulatedText,
          timestamp: Date.now()
        });
      }

      onStepUpdate(accumulatedText);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-ink text-paper shadow-2xl overflow-hidden relative border border-white/5">
      {/* Header */}
      <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 flex-shrink-0 gap-4">
        <div>
          <h3 className="text-xs uppercase tracking-[0.2em] font-black mb-1">Mentor Assistant</h3>
          <div className="flex items-center gap-2">
            {isLoading ? (
               <span className="text-[10px] uppercase font-bold tracking-widest opacity-40 animate-pulse">Assistant is thinking...</span>
            ) : (
              <span className="text-[10px] uppercase font-bold tracking-widest opacity-40">Ready to Guide</span>
            )}
          </div>
        </div>

        {/* Learning Level Selector */}
        <div className="flex items-center bg-white/5 p-1 rounded-sm border border-white/10">
          {(['beginner', 'normal', 'advanced'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setLearningLevel(level)}
              className={`px-3 py-1 text-[8px] uppercase tracking-widest font-black transition-all ${
                learningLevel === level ? 'bg-accent text-white' : 'opacity-40 hover:opacity-100'
              }`}
            >
              {level === 'beginner' ? 'Simple' : level}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scroll-smooth custom-scrollbar"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className={`flex items-center gap-2 mb-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-1 h-1 rounded-full ${msg.role === 'user' ? 'bg-accent' : 'bg-ink/30'}`} />
                <span className="text-[9px] uppercase tracking-[0.2em] font-black opacity-40">
                  {msg.role === 'user' ? 'The Citizen' : 'The Mentor'}
                </span>
              </div>
              <div className={`text-sm leading-relaxed max-w-[90%] md:max-w-[80%] transition-all duration-300 ${
                msg.role === 'user' 
                  ? 'bg-paper text-ink px-6 py-4 font-bold border border-white/10 shadow-lg' 
                  : 'text-paper/90 italic font-light serif text-xl md:text-2xl leading-tight'
              }`}>
                {msg.role === 'model' && msg.text !== '' && '“'}{msg.text}{msg.role === 'model' && msg.text !== '' && '”'}
                {msg.text === '' && isLoading && (
                   <Loader2 className="animate-spin text-paper/30" size={24} />
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Starters */}
        {messages.length === 1 && !isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-wrap gap-2 pt-4"
          >
            {starters.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="text-[10px] uppercase font-bold tracking-widest border border-white/20 px-4 py-2 hover:bg-white hover:text-ink transition-all"
              >
                {s}
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="p-6 md:p-8 border-t border-white/10 flex-shrink-0">
        <div className="flex flex-col gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="TYPE YOUR RESPONSE HERE..."
            className="w-full bg-transparent border-b border-white/30 py-2 text-sm uppercase tracking-widest font-black focus:outline-none focus:border-white transition-colors"
            disabled={isLoading}
          />
          <div className="flex justify-between items-center">
            <p className="text-[9px] uppercase tracking-widest opacity-40">Press Enter to Send</p>
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="bg-paper text-ink text-[10px] font-black uppercase px-6 py-2 hover:bg-accent hover:text-white transition-all disabled:opacity-20"
            >
              {isLoading ? 'TRANSMITTING...' : 'SEND MESSAGE'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
