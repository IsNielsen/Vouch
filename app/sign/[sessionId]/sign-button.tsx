"use client";

import { Button } from "@/components/ui/button";
import { PenLine } from "lucide-react";

export function SignButton({ sessionId }: { sessionId: string }) {
  return (
    <Button
      size="lg"
      className="w-full gap-2"
      onClick={() => console.log("Sign document", sessionId)}
    >
      <PenLine className="h-5 w-5" />
      Sign
    </Button>
  );
}
