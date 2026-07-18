"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Shield, User, Globe } from "lucide-react";

type Language = "en" | "hi" | "bn" | "te" | "ta" | "mr" | "gu" | "kn" | "ml" | "pa" | "or" | "as";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const LANGUAGES: { [key in Language]: string } = {
  en: "English",
  hi: "हिंदी",
  bn: "বাংলা",
  te: "తెలుగు",
  ta: "தமிழ்",
  mr: "मराठी",
  gu: "ગુજરાતી",
  kn: "ಕನ್ನಡ",
  ml: "മലയാളം",
  pa: "ਪੰਜਾਬੀ",
  or: "ଓଡ଼ିଆ",
  as: "অসমীয়া",
};

const INITIAL_MESSAGES: { [key in Language]: string } = {
  en: "Hello citizen. I am the Fraud Shield AI. Are you receiving a suspicious call or message right now?",
  hi: "नमस्ते नागरिक। मैं फ्रॉड शील्ड AI हूं। क्या आपको अभी कोई संदिग्ध कॉल या संदेश मिल रहा है?",
  bn: "হ্যালো নাগরিক। আমি ফ্রড শিল্ড AI। আপনি কি এখনই কোন সন্দেহজনক কল বা বার্তা পাচ্ছেন?",
  te: "హలో పౌరుడు. నేను ఫ్రాడ్ షీల్డ్ AI. మీరు ప్రస్తుతం సందిగ్ధమైన కాల్ లేదా సందేశాన్ని అందుకుంటున్నారా?",
  ta: "வணக்கம் குடிமகனே. நான் மோசடி கேட் AI. இப்போது சந்தேகத்திற்குரிய அழைப்பு அல்லது செய்தியை பெற்றுக்கொண்டிருக்கிறீர்களா?",
  mr: "नमस्कार नागरिक. मी फ्रॉड शील्ड AI आहे. तुम्हाला सध्या कोणताही संशयास्पद कॉल किंवा संदेश येत आहे का?",
  gu: "નમસ્તે નાગરિક। હું ફ્રોડ શિલ્ડ AI છું। તમને હમણાં કોઈ શંકાસ્પદ કોલ અથવા સંદેશ મળી રહ્યો છે?",
  kn: "ಹಲೋ ನಾಗರಿಕ. ನಾನು ಫ್ರಾಡ್ ಶೀಲ್ಡ್ AI. ನಿಮಗೆ ಸದ್ಯ ಸಂದೇಹಪೂರಿತ ಕಾಲ್ ಅಥವಾ ಸಂದೇಶ ಪಡೆಯುತ್ತಿದ್ದೀರಾ?",
  ml: "ഹലോ നാഗരികം. ഞാൻ ഫ്രോഡ് ഷീൽഡ് AI. ഇപ്പോൾ സന്ദേഹപരമായ ഒരു കോൾ അല്ലെങ്കിൽ മെസ്സേജ് നിങ്ങൾക്ക് ലഭിക്കുന്നുണ്ടോ?",
  pa: "ਹੈਲੋ ਨਾਗਰਿਕ। ਮੈਂ ਫਰੌਡ ਸ਼ੀਲਡ AI ਹਾਂ। ਕੀ ਤੁਹਾਨੂੰ ਹੁਣੇ ਹੀ ਕੋਈ ਸ਼ੱਕੀ ਕਾਲ ਜਾਂ ਸੰਦੇਸ਼ ਮਿਲ ਰਿਹਾ ਹੈ?",
  or: "ନମସ୍କାର ନାଗରିକ। ମୁଁ ଫ୍ରଡ୍ ଶିଲ୍ଡ AI। ଆପଣ ବର୍ତ୍ତମାନେ କୌଣସି ସନ୍ଦିଗ୍ଧ କଲ୍ କିମ୍ବା ବାର୍ତ୍ତା ପାଉଛନ୍ତି କି?",
  as: "নমস্কাৰ নাগৰিক। মই ফ্ৰড শিল্ড AI। আপুনি বৰ্তমানে কোনো সন্দেহজনক কল বা বাৰ্তা লাভ কৰিছে নেকি?",
};

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<Language>("en");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: INITIAL_MESSAGES.en }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    setMessages([{ role: "assistant", content: INITIAL_MESSAGES[language] }]);
  }, [language]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage], language }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I am currently facing a technical issue. (Error: " + (data.error || "Unknown") + ")" }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I am currently facing a network error." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-[#00f3ff] rounded-full shadow-[0_0_20px_rgba(0,243,255,0.4)] flex items-center justify-center z-50 text-black cursor-pointer"
          >
            <MessageSquare className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 w-[350px] h-[550px] bg-[#111111] border border-[#333333] rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#00f3ff] text-black px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold font-mono text-sm">
                <Shield className="w-5 h-5" />
                CITIZEN SHIELD AI
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button onClick={() => setShowLanguageDropdown(!showLanguageDropdown)} className="p-1 hover:bg-black/10 rounded-full flex items-center gap-1 text-xs font-bold">
                    <Globe className="w-4 h-4" />
                    {LANGUAGES[language]}
                  </button>
                  <AnimatePresence>
                    {showLanguageDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute top-10 right-0 bg-[#111111] border border-[#333333] rounded-lg shadow-xl w-48 max-h-60 overflow-y-auto z-10"
                      >
                        {Object.entries(LANGUAGES).map(([code, name]) => (
                          <button
                            key={code}
                            onClick={() => {
                              setLanguage(code as Language);
                              setShowLanguageDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-[#00f3ff]/10 ${language === code ? "text-[#00f3ff] font-bold" : "text-white"}`}
                          >
                            {name}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button onClick={() => setIsOpen(false)} className="hover:bg-black/10 p-1 rounded-full cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-grow p-4 overflow-y-auto flex flex-col gap-4 font-sans text-sm">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "user" ? "bg-[#333]" : "bg-[#00f3ff]/20 text-[#00f3ff]"}`}>
                    {msg.role === "user" ? <User className="w-4 h-4 text-white" /> : <Shield className="w-4 h-4" />}
                  </div>
                  <div className={`p-3 rounded-lg max-w-[80%] ${msg.role === "user" ? "bg-[#333333] text-white rounded-tr-none" : "bg-[#00f3ff]/10 text-gray-200 border border-[#00f3ff]/30 rounded-tl-none"}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#00f3ff]/20 text-[#00f3ff] flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="p-3 rounded-lg bg-[#00f3ff]/10 text-gray-200 border border-[#00f3ff]/30 rounded-tl-none flex items-center gap-1">
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 bg-[#00f3ff] rounded-full" />
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-[#00f3ff] rounded-full" />
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-[#00f3ff] rounded-full" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={sendMessage} className="p-3 border-t border-[#333333] bg-[#0a0a0a] flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type your concern here..."
                className="flex-grow bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00f3ff]"
              />
              <button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className="bg-[#00f3ff] text-black w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
