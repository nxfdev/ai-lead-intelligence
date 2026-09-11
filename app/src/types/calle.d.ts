declare module "@call-e/calle" {
  export interface CallEConfig {
    apiKey: string;
  }

  export interface CallCreateInput {
    task: string;
    recipients: Array<{ phones: string[] }>;
    resultSchema?: Record<string, unknown>;
  }

  export interface CallCreateOptions {
    idempotencyKey?: string;
  }

  export interface CallObject {
    id: string;
    status: string;
    result?: Record<string, unknown>;
  }

  export class CallE {
    constructor(config: CallEConfig);
    calls: {
      create(input: CallCreateInput, options?: CallCreateOptions): Promise<CallObject>;
      get(id: string): Promise<CallObject>;
      waitForResult(id: string, options?: { timeoutMs?: number; intervalMs?: number }): Promise<CallObject>;
    };
  }
}
