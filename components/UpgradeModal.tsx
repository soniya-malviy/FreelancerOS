"use client";

import { Zap, Check, X } from "lucide-react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (plan: 'pro' | 'agency') => void;
  isLoading?: boolean;
}

export default function UpgradeModal({ isOpen, onClose, onUpgrade, isLoading }: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] w-full max-w-3xl overflow-hidden shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="bg-primary p-8 text-center relative">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
            <Zap size={14} fill="currentColor" />
            LIMIT REACHED
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Unlock unlimited proposals</h2>
          <p className="text-white/80">Choose the plan that fits your freelance business</p>
        </div>

        {/* Plans */}
        <div className="p-8 grid sm:grid-cols-2 gap-8">
          {/* Pro Plan */}
          <div className="flex flex-col border-2 border-primary rounded-2xl p-6 relative">
            <div className="absolute -top-3 right-6 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              MOST POPULAR
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-foreground">Pro</h3>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-extrabold text-foreground">$9</span>
                <span className="text-muted text-sm font-medium">/month</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                "Unlimited proposals",
                "Contract generator",
                "Invoice templates",
                "Priority AI models"
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-muted">
                  <Check size={16} className="text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => onUpgrade('pro')}
              disabled={isLoading}
              className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary-hover transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? "Processing..." : "Upgrade to Pro"}
            </button>
          </div>

          {/* Agency Plan */}
          <div className="flex flex-col border border-border rounded-2xl p-6">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-foreground">Agency</h3>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-extrabold text-foreground">$29</span>
                <span className="text-muted text-sm font-medium">/month</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                "Everything in Pro",
                "Up to 5 team members",
                "White-label options",
                "Personal success manager"
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-muted">
                  <Check size={16} className="text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => onUpgrade('agency')}
              disabled={isLoading}
              className="w-full border-2 border-border text-foreground font-bold py-3.5 rounded-xl hover:bg-gray-50 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              Get Agency
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-muted pb-8 px-8">
          Payments are secure and encrypted via Razorpay. Cancel anytime.
        </p>
      </div>
    </div>
  );
}
