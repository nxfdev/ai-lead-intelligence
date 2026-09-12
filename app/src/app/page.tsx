"use client";

import React, { useState } from "react";
import { AladdinNavbar } from "@/components/dashboard/aladdin-navbar";
import { AladdinHero } from "@/components/dashboard/aladdin-hero";
import { FlashcardsGrid } from "@/components/dashboard/flashcards-grid";
import { AladdinLampChatbot } from "@/components/chat/aladdin-lamp-chatbot";
import { DemoModal } from "@/components/dashboard/demo-modal";
import { Sparkles } from "lucide-react";

export default function AladdinDashboardPage() {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [isGenieOpen, setIsGenieOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const handleOpenGenie = () => {
    setIsGenieOpen(true);
  };

  const handleTriggerCall = (leadId: string) => {
    setSelectedLeadId(leadId);
    fetch(`/api/leads/${leadId}/call`, { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          alert("📞 CALL-E Voice Agent dispatched! Check Call Activity for real-time streaming.");
        }
      })
      .catch(() => {
        // Handled smoothly in simulation
      });
  };

  return (
    <main className="relative min-h-screen flex flex-col selection:bg-amber-400/30 selection:text-amber-200 overflow-x-hidden">

      {/* ─── TOP NAVBAR ─── */}
      <AladdinNavbar
        onOpenGenie={handleOpenGenie}
        onNavigateSection={(id) => {
          const el = document.getElementById(id);
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }}
      />

      {/* ─── HERO SECTION WITH WILL SMITH ALADDIN BACKGROUND & 3D LAMP ─── */}
      <AladdinHero
        onOpenGenie={handleOpenGenie}
        onOpenDemo={() => setIsDemoModalOpen(true)}
        onTaskCreated={(taskId) => setActiveTaskId(taskId)}
        onTriggerCall={handleTriggerCall}
      />

      {/* ─── 3D FLASHCARDS SECTIONS ─── */}
      <FlashcardsGrid
        onSelectLead={(id) => setSelectedLeadId(id)}
        onTriggerCall={handleTriggerCall}
        onOpenGenie={handleOpenGenie}
      />

      {/* ─── INTERACTIVE DEMO SHOWCASE MODAL ─── */}
      <DemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onOpenGenie={handleOpenGenie}
      />

      {/* ─── PERSISTENT FLOATING 3D ALADDIN LAMP (Always visible, slides panel on click) ─── */}
      <AladdinLampChatbot
        isOpenExternal={isGenieOpen}
        onToggleExternal={() => setIsGenieOpen(!isGenieOpen)}
        onTaskCreated={(taskId) => setActiveTaskId(taskId)}
        onTriggerCall={handleTriggerCall}
      />

      {/* ─── LUXURY FOOTER ─── */}
      <footer
        className="w-full py-10 px-6 sm:px-12 mt-16 z-10"
        style={{
          background: "rgba(3,6,20,0.8)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(245,158,11,0.2)",
        }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(6,182,212,0.2))",
                border: "1px solid rgba(245,158,11,0.3)",
              }}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <span className="font-cinzel text-lg font-bold gold-gradient-text">
                AladdinAI
              </span>
              <p className="text-xs text-slate-400">
                Work Like Magic • 24/7 Autonomous Lead Generation & Calling
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400">
            <span className="hover:text-amber-300 transition cursor-pointer">Privacy Policy</span>
            <span className="hover:text-amber-300 transition cursor-pointer">Terms of Service</span>
            <span className="hover:text-amber-300 transition cursor-pointer">CALL-E Compliance</span>
            <span className="text-amber-400 font-semibold">● 100% Operational</span>
          </div>
        </div>
      </footer>

    </main>
  );
}