"use client";

import { useState } from "react";
import { Search, Plus, Zap } from "lucide-react";

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
    <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-5 flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-[15px] tracking-tight text-slate-900">
            LeadIntel
          </span>
        </div>
        <span className="text-xs text-slate-400 font-medium ml-1">
          AI Lead Intelligence
        </span>
      </div>

      <div className="flex items-center gap-3">
        {activeTaskId && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 pulse-dot" />
            <span className="text-xs font-medium text-blue-700">
              Task active
            </span>
          </div>
        )}

        {showNewTask ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g., Find dental practices in Austin that need AI receptionists"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateTask()}
              className="w-[420px] px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
              autoFocus
            />
            <button
              onClick={handleCreateTask}
              disabled={loading || !goal.trim()}
              className="btn btn-primary btn-sm"
            >
              {loading ? "Starting..." : "Start"}
            </button>
            <button
              onClick={() => setShowNewTask(false)}
              className="btn btn-ghost btn-sm"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewTask(true)}
            className="btn btn-primary btn-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            New Research
          </button>
        )}

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-48 focus:outline-none focus:border-blue-400"
          />
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200">
          <span>🧪</span>
          <span>Synthetic Mode</span>
        </div>
      </div>
    </header>
  );
}
