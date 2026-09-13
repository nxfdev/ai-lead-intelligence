"use client";

import { useEffect, useRef, useState } from "react";
import { X, Lock, Mail, ArrowRight } from "lucide-react";
import { DialOLogo } from "./dial-o-logo";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => emailInputRef.current?.focus(), 50);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
      setIsLoading(false);
      onClose();
      // Smooth scroll to console as authenticated
      const consoleElem = document.getElementById("console");
      if (consoleElem) {
        consoleElem.scrollIntoView({ behavior: "smooth" });
      }
    }, 800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signin-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md bg-black border-2 border-[#1A1A1A] p-8 text-white relative shadow-[0_0_50px_rgba(0,0,0,0.9)]"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-neutral-400 hover:text-white transition-colors p-1"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-8 text-center">
          <DialOLogo size="md" />
          <h2 id="signin-title" className="text-xl font-bold tracking-[0.2em] uppercase mt-4 text-[#EFCD5E]">
            SIGN IN
          </h2>
          <p className="text-xs text-neutral-400 tracking-wider mt-1 uppercase">
            Access Lead Intelligence Console
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-950/40 border border-red-500/50 text-red-300 text-xs tracking-wide">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] uppercase tracking-widest text-neutral-400 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={emailInputRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@dial-o.com"
                required
                className="w-full bg-[#0A0A0A] border border-[#242424] focus:border-[#00FFFF] pl-10 pr-4 py-3 text-sm text-white placeholder-neutral-600 outline-none transition-colors font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-widest text-neutral-400 mb-1.5">
              Access Key / Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full bg-[#0A0A0A] border border-[#242424] focus:border-[#00FFFF] pl-10 pr-4 py-3 text-sm text-white placeholder-neutral-600 outline-none transition-colors font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-neutral-400 py-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-[#EFCD5E]" defaultChecked />
              <span className="uppercase tracking-wider">Remember Key</span>
            </label>
            <a href="#" className="hover:text-[#00FFFF] transition-colors uppercase tracking-wider">
              Forgot Access Key?
            </a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#EFCD5E] hover:bg-[#F8DA76] text-black font-bold uppercase tracking-[0.2em] py-3 text-xs flex items-center justify-center gap-2 transition-all mt-6 shadow-[0_2px_12px_rgba(239,205,94,0.3)] cursor-pointer"
          >
            {isLoading ? (
              <span>AUTHENTICATING...</span>
            ) : (
              <>
                <span>ENTER CONSOLE</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#1F1F1F] text-center text-[10px] text-neutral-500 uppercase tracking-widest">
          DIAL O SECURE ACCESS · AIR-GAPPED AUTH
        </div>
      </div>
    </div>
  );
}
