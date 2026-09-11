import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `+${cleaned}`;
  }
  return phone.startsWith("+") ? phone : `+${cleaned}`;
}

export function generateIdempotencyKey(prefix: string, ...parts: string[]): string {
  return `${prefix}_${parts.join("_")}_${Date.now()}`;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + "...";
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  if (score >= 40) return "text-orange-600";
  return "text-red-600";
}

export function getScoreBgColor(score: number): string {
  if (score >= 80) return "bg-emerald-50 border-emerald-200";
  if (score >= 60) return "bg-amber-50 border-amber-200";
  if (score >= 40) return "bg-orange-50 border-orange-200";
  return "bg-red-50 border-red-200";
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    COMPLETED: "text-emerald-600 bg-emerald-50",
    IN_PROGRESS: "text-blue-600 bg-blue-50",
    QUEUED: "text-slate-600 bg-slate-50",
    PENDING: "text-slate-500 bg-slate-50",
    FAILED: "text-red-600 bg-red-50",
    CANCELLED: "text-gray-500 bg-gray-50",
    VERIFIED: "text-emerald-700 bg-emerald-50",
    POTENTIAL: "text-amber-700 bg-amber-50",
    NOT_QUALIFIED: "text-red-600 bg-red-50",
    NEEDS_FOLLOW_UP: "text-blue-600 bg-blue-50",
  };
  return colors[status] || "text-gray-600 bg-gray-50";
}

export function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
