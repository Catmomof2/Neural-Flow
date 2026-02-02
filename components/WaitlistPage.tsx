
import React, { useState, useEffect } from 'react';
import { Lead, LeadType, LeadStatus } from '../types';
import { sendNotification } from '../services/notificationService';

interface WaitlistPageProps {
  onJoin: (lead: Lead) => void;
  existingLead?: Lead;
  onEnterApp: () => void;
}

const WaitlistPage: React.FC<WaitlistPageProps> = ({ onJoin, existingLead, onEnterApp }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referrerCode, setReferrerCode] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) setReferrerCode(ref);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSubmitting) return;

    setIsSubmitting(true);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const newLead: Lead = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      type: LeadType.SIGNUP,
      status: LeadStatus.NEW,
      timestamp: Date.now(),
      referralCode: code,
      referredBy: referrerCode || undefined,
      referralCount: 0
    };

    await sendNotification('CONFIRMATION', { email });
    onJoin(newLead);
    setIsSubmitting(false);
  };

  const shareUrl = existingLead ? `${window.location.origin}${window.location.pathname}?ref=${existingLead.referralCode}` : '';

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    alert('Referral link copied to clipboard!');
  };

  if (existingLead) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
        <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl font-bold mb-8 shadow-2xl shadow-indigo-500/40">N</div>
        <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
          You're on the list!
        </h1>
        <p className="text-slate-400 max-w-md mb-12">
          Want to skip the queue? Refer your friends to move up in rank. Every referral gets you closer to early access.
        </p>

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
             <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 px-3 py-1 bg-indigo-400/10 rounded-full">
               Level 1: Pioneer
             </span>
          </div>
          
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="text-left">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Your Referrals</p>
              <p className="text-4xl font-bold text-white">{existingLead.referralCount}</p>
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Queue Position</p>
              <p className="text-4xl font-bold text-indigo-400">#{Math.max(1, 1420 - (existingLead.referralCount * 12))}</p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-medium text-slate-300">Share your unique link:</p>
            <div className="flex gap-2">
              <input 
                readOnly 
                value={shareUrl}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm font-mono text-slate-400"
              />
              <button 
                onClick={copyLink}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition-all"
              >
                Copy
              </button>
            </div>
          </div>
        </div>

        <button 
          onClick={onEnterApp}
          className="mt-12 text-slate-500 hover:text-white transition-colors flex items-center gap-2 group"
        >
          Proceed to Neural Canvas
          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center neural-grid">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/80 pointer-events-none" />
      
      <div className="relative z-10 animate-in slide-in-from-bottom-12 duration-1000">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-bold mb-8 shadow-2xl shadow-indigo-500/20 mx-auto">N</div>
        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
          Think in <span className="text-indigo-500">Flow</span>.
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 mx-auto leading-relaxed">
          The world's first AI-powered neural mapping tool. Transform complex logic into stunning visual architectures with Gemini 3 Pro.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3 max-w-lg mx-auto mb-6">
          <input 
            type="email" 
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-xl"
          />
          <button 
            type="submit"
            disabled={isSubmitting}
            className="bg-white text-slate-950 hover:bg-slate-200 font-bold px-8 py-4 rounded-2xl transition-all shadow-xl disabled:opacity-50"
          >
            {isSubmitting ? 'Reserving...' : 'Join Waitlist'}
          </button>
        </form>

        <p className="text-xs text-slate-500 flex items-center justify-center gap-2">
          <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
          1,419 pioneers already joined
        </p>
      </div>
      
      <div className="absolute bottom-12 flex gap-8 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
        <span>Infinite Canvas</span>
        <span>•</span>
        <span>Gemini 3 Powered</span>
        <span>•</span>
        <span>Real-time Flows</span>
      </div>
    </div>
  );
};

export default WaitlistPage;
