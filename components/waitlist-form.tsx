"use client";

import { useState } from "react";
import { joinWaitlist } from "@/app/actions/waitlist";

const inputCls = "w-full px-4 py-2.5 rounded-lg border border-[#1a1a2e] bg-[#111118] text-[#f0f0fa] placeholder:text-[#555570] focus:outline-hidden focus:ring-2 focus:ring-[#5577ff]/50 focus:border-[#5577ff] transition-colors duration-150 text-sm";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [useCase, setUseCase] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    const result = await joinWaitlist({ email, company, useCase });
    if (result.error) {
      setStatus("error");
      setMessage(result.error);
    } else {
      setStatus("success");
      setMessage("You're on the list! We'll be in touch soon.");
      setEmail("");
      setCompany("");
      setUseCase("");
    }
  }

  if (status === "success") {
    return (
      <p className="text-[#44cc88] font-medium text-sm">{message}</p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Work email"
          className={inputCls}
        />
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Company name"
          className={inputCls}
        />
        <input
          type="text"
          value={useCase}
          onChange={(e) => setUseCase(e.target.value)}
          placeholder="What are you protecting? (e.g. payments, withdrawals)"
          className={inputCls}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="px-6 py-2.5 rounded-lg bg-[#5577ff] hover:bg-[#3344cc] text-white font-medium text-sm transition-all duration-150 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {status === "loading" ? "Joining..." : "Join the waitlist"}
        </button>
      </form>
      {status === "error" && (
        <p className="text-sm text-red-400">{message}</p>
      )}
    </div>
  );
}
