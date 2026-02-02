
import React, { useState } from 'react';
import { LeadType, LeadStatus, Lead } from '../types';

interface LeadFormsProps {
  onNewLead: (lead: Lead) => void;
}

export const ContactModal: React.FC<{ isOpen: boolean; onClose: () => void; onNewLead: (lead: Lead) => void }> = ({ isOpen, onClose, onNewLead }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Fix: Added missing required properties 'referralCode' and 'referralCount' to satisfy Lead interface
    const newLead: Lead = {
      id: Math.random().toString(36).substring(2, 11),
      email,
      message,
      type: LeadType.CONTACT,
      status: LeadStatus.NEW,
      timestamp: Date.now(),
      referralCode: '',
      referralCount: 0,
    };

    setTimeout(() => {
      onNewLead(newLead);
      setIsSubmitting(false);
      setEmail('');
      setMessage('');
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Contact Support</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Email Address</label>
            <input 
              required
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Message</label>
            <textarea 
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
              placeholder="How can we help?"
            />
          </div>
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
};

export const NewsletterSignup: React.FC<LeadFormsProps> = ({ onNewLead }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Fix: Added missing required properties 'referralCode' and 'referralCount' to satisfy Lead interface
    const newLead: Lead = {
      id: Math.random().toString(36).substring(2, 11),
      email,
      type: LeadType.SIGNUP,
      status: LeadStatus.NEW,
      timestamp: Date.now(),
      referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      referralCount: 0,
    };

    onNewLead(newLead);
    setSubmitted(true);
    setEmail('');
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 mt-auto">
      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Newsletter</h4>
      {submitted ? (
        <p className="text-xs text-emerald-400">Thanks for signing up!</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="bg-slate-800 border border-slate-700 text-[10px] px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button className="bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold py-2 rounded-lg transition-all">
            Join Waitlist
          </button>
        </form>
      )}
    </div>
  );
};
