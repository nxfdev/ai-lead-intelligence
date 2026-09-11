"use client";

import { useState } from "react";
import { CallLogPanel } from "@/components/calls/call-log-panel";
import { LeadDashboardPanel } from "@/components/leads/lead-dashboard-panel";
import { ChatPanel } from "@/components/chat/chat-panel";
import { DashboardHeader } from "@/components/dashboard/header";

export default function DashboardPage() {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  return (
    <div className="h-screen flex flex-col">
      <DashboardHeader
        activeTaskId={activeTaskId}
        onTaskCreated={(taskId) => setActiveTaskId(taskId)}
      />
      <div className="dashboard-grid flex-1">
        <CallLogPanel
          onSelectLead={(leadId) => setSelectedLeadId(leadId)}
        />
        <LeadDashboardPanel
          taskId={activeTaskId}
          selectedLeadId={selectedLeadId}
          onSelectLead={(leadId) => setSelectedLeadId(leadId)}
        />
        <ChatPanel
          taskId={activeTaskId}
          selectedLeadId={selectedLeadId}
          onTaskCreated={(taskId) => setActiveTaskId(taskId)}
        />
      </div>
    </div>
  );
}
