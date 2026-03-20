"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

export function MobileMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
        className="p-1"
      >
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>
      {open && (
        <div className="absolute top-16 left-0 right-0 bg-[#0a0a0f] border-b border-[#1a1a2e] px-5 py-4 flex flex-col gap-4 z-50">
          {children}
        </div>
      )}
    </div>
  );
}
