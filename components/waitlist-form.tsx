"use client";

import { useState } from "react";
import { joinWaitlist } from "@/app/actions/waitlist";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    const result = await joinWaitlist(email);
    if (result.error) {
      setStatus("error");
      setMessage(result.error);
    } else {
      setStatus("success");
      setMessage("You're on the list! We'll be in touch soon.");
      setEmail("");
    }
  }

  if (status === "success") {
    return <p className="text-green-600 dark:text-green-400 font-medium">{message}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="flex-1 px-4 py-2.5 rounded-lg border border-foreground/20 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="px-6 py-2.5 rounded-lg bg-foreground text-background font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
        >
          {status === "loading" ? "Joining..." : "Notify Me"}
        </button>
      </form>
      {status === "error" && (
        <p className="text-sm text-red-500">{message}</p>
      )}
    </div>
  );
}
