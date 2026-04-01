interface DemoChallenge {
  id: string;
  webauthn_challenge: string;
  transaction_context: unknown;
  expires_at: string;
  status: "pending" | "verified";
}

export const demoChallenges = new Map<string, DemoChallenge>();
