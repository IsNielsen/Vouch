"use server";

import { createClient } from "@/lib/supabase/server";

// SQL migration required:
// ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS company text;
// ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS use_case text;

interface WaitlistInput {
  email: string;
  company?: string;
  useCase?: string;
}

export async function joinWaitlist({ email, company, useCase }: WaitlistInput): Promise<{ error?: string }> {
  if (!email || !email.includes("@")) {
    return { error: "Please enter a valid email address." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("waitlist").insert({
    email,
    company: company?.trim() || null,
    use_case: useCase?.trim() || null,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "You're already on the list!" };
    }
    return { error: "Something went wrong. Please try again." };
  }

  return {};
}
