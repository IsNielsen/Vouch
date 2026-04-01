export interface TransactionContext {
  [key: string]: unknown;
}

export interface Challenge {
  challenge_id: string;
  webauthn_options: unknown;
  expires_in: number;
}

export interface VouchReceipt {
  challenge_id: string;
  verified: boolean;
  verified_at: string;
  credential_id: string;
  device_id: string;
  pqc_public_key: string;
  pqc_signature: string;
  transaction_context: TransactionContext;
}

export class Vouch {
  private apiKey: string;
  private baseUrl: string;

  constructor({ apiKey, baseUrl = "" }: { apiKey: string; baseUrl?: string }) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  readonly challenge = {
    create: async (body: {
      action: string;
      transaction_context: TransactionContext;
      user_id?: string;
      webhook_url?: string;
    }): Promise<Challenge> => {
      const res = await fetch(`${this.baseUrl}/api/vouch/challenge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Challenge creation failed");
      return res.json();
    },

    get: async (challengeId: string) => {
      const res = await fetch(`${this.baseUrl}/api/vouch/challenge/${challengeId}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      if (!res.ok) throw new Error("Challenge not found");
      return res.json();
    },

    verify: async (challengeId: string, body: { assertion: unknown }): Promise<VouchReceipt> => {
      const res = await fetch(`${this.baseUrl}/api/vouch/verify/${challengeId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Verification failed");
      return res.json();
    },
  };
}

export default Vouch;
