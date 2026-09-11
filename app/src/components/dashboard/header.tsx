"use client";

import { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { AIAvatar } from "@/components/ai-avatar";

interface DashboardHeaderProps {
  activeTaskId: string | null;
  onTaskCreated: (taskId: string) => void;
}

export function DashboardHeader({ activeTaskId, onTaskCreated }: DashboardHeaderProps) {
  const [showNewTask, setShowNewTask] = useState(false);
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateTask = async () => {
    if (!goal.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal }),
      });
      const data = await res.json();
      if (data.success) {
        onTaskCreated(data.data.taskId);
        setShowNewTask(false);
        setGoal("");
      }
    } catch (e) {
      console.error("Failed to create task:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="h-16 flex items-center justify-between px-5 flex-shrink-0 relative">
      {/* Left: brand with female AI merchant avatar */}
      <div className="flex items-center gap-3">
        <div className="border-gradient rounded-2xl p-[1px]">
          <div className="glass-strong rounded-2xl px-3 py-1.5 flex items-center gap-2.5">
            <AIAvatar size={40} />
            <div className="flex flex-col items-start">
              <span className="font-bold text-[15px] tracking-tight leading-none flex items-center gap-1.5">
                <span className="gradient-text">LeadIntel</span>
                <span className="bg-[#f0b429]/15 text-[#f0b429] text-[9px] font-bold px-1.5 py-0.5 rounded border border-[#f0b429]/30 uppercase tracking-wider">
                  Elite
                </span>
              </span>
              <span className="text-[10px] text-[#7c7199] font-medium mt-1">
                AI Lead Intelligence & CALL-E
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {activeTaskId && (
          <div className="glass rounded-xl px-3 py-2 flex items-center gap-2 shimmer-sweep">
            <span className="w-2 h-2 rounded-full bg-[#34f5c5] pulse-dot" />
            <span className="text-xs font-medium text-[#34f5c5]">Task orchestrating</span>
          </div>
        )}

        {showNewTask ? (
          <div className="flex items-center gap-2 animate-fade-in-scale">
            <input
              type="text"
              placeholder="e.g., Find dental practices in Austin that need AI receptionists"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateTask()}
              autoFocus
              className="w-[420px] px-3 py-2 text-sm premium-input"
            />
            <button onClick={handleCreateTask} disabled={loading || !goal.trim()} className="btn btn-primary btn-sm">
              {loading ? "Starting..." : "Start"}
            </button>
            <button onClick={() => setShowNewTask(false)} className="btn btn-ghost btn-sm">
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewTask(true)}
            className="btn btn-primary btn-sm"
            title="Launch a new autonomous research pipeline"
          >
            <Sparkles className="w-3.5 h-3.5" />
            New Research
          </button>
        )}

        <div className="relative hidden md:block">
          <Search className="w-4 h-4 text-[#7c7199] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-3 py-2 text-sm premium-input w-52"
          />
        </div>

        <div className="border-gradient-gold rounded-xl p-[1px]">
          <div className="glass-strong rounded-xl px-3 py-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#f0b429] pulse-dot" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#f0b429]">
              · Live
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}