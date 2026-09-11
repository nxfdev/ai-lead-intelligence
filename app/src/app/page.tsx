"use client";

import { useState } from "react";
import { CallLogPanel } from "@/components/calls/call-log-panel";
import { LeadDashboardPanel } from "@/components/leads/lead-dashboard-panel";
import { ChatPanel } from "@/components/chat/chat-panel";
import { DashboardHeader } from "@/components/dashboard/header";
import { ToolsStatusPanel } from "@/components/tools/tools-status-panel";

export default function DashboardPage() {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [chatActive, setChatActive] = useState(false);

  return (
    <div className="h-screen flex flex-col">
      <DashboardHeader
        activeTaskId={activeTaskId}
        onTaskCreated={(taskId) => setActiveTaskId(taskId)}
      />
      <ToolsStatusPanel />
      <div className={`dashboard-grid flex-1 ${chatActive ? "chat-active" : ""}`}>
        <CallLogPanel onSelectLead={(leadId) => setSelectedLeadId(leadId)} />
        <LeadDashboardPanel
          taskId={activeTaskId}
          selectedLeadId={selectedLeadId}
          onSelectLead={(leadId) => setSelectedLeadId(leadId)}
        />
        <ChatPanel
          taskId={activeTaskId}
          selectedLeadId={selectedLeadId}
          onTaskCreated={(taskId) => setActiveTaskId(taskId)}
          onActive={() => setChatActive(true)}
        />
      </div>
    </div>
  );
}