declare module "@call-e/calle" {
  export interface CalleClientConfig {
    apiKey: string;
    baseUrl?: string;
  }

  export interface CallCreateInput {
    task: string;
    recipients: Array<{ phones: string[] }>;
    resultSchema?: Record<string, unknown>;
  }

  export interface CallCreateOptions {
    idempotencyKey?: string;
    timeoutMs?: number;
    intervalMs?: number;
  }

  export interface CallObject {
    id: string;
    status: string;
    structuredResult?: Record<string, unknown>;
    taskCompleted?: boolean;
    completionConfidence?: { score: number; label: string };
    evidence?: string[];
  }

  export class CalleClient {
    constructor(config: CalleClientConfig);
    calls: {
      create(input: CallCreateInput, options?: CallCreateOptions): Promise<CallObject>;
      createAndWait(input: CallCreateInput, options?: { timeoutMs?: number; intervalMs?: number }): Promise<CallObject>;
      get(id: string): Promise<CallObject>;
      waitForResult(id: string, options?: { timeoutMs?: number; intervalMs?: number }): Promise<CallObject>;
      listEvents(id: string, options?: { limit?: number }): Promise<Array<Record<string, unknown>>>;
    };
  }
}
