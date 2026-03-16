"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { PenLine, Loader2 } from "lucide-react";

interface Props {
  onConsented: () => void;
  isLoading: boolean;
  disabled?: boolean;
  primaryColor?: string;
}

export function ConsentDisclosure({ onConsented, isLoading, disabled, primaryColor }: Props) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="border rounded-lg p-4 text-sm text-muted-foreground space-y-2">
        <p className="font-medium text-foreground">Consumer Disclosure</p>
        <p>
          Electronic records and signatures on this document are legally binding under the
          Electronic Signatures in Global and National Commerce Act (ESIGN) and the Uniform
          Electronic Transactions Act (UETA).
        </p>
        <p>
          <span className="font-medium text-foreground">Hardware/software:</span> A modern
          browser with biometric (passkey) support is required to sign electronically.
        </p>
        <p>
          <span className="font-medium text-foreground">Right to withdraw:</span> Contact
          the document owner before signing if you prefer not to use electronic records.
        </p>
        <p>
          <span className="font-medium text-foreground">Paper copy:</span> Contact the
          document owner to request a paper copy of this document.
        </p>
      </div>

      <div className="flex items-start gap-3">
        <Checkbox
          id="consent"
          checked={checked}
          onCheckedChange={(v) => setChecked(v === true)}
        />
        <label htmlFor="consent" className="text-sm leading-snug cursor-pointer">
          I consent to conduct this transaction using electronic records and signatures.
        </label>
      </div>

      <Button
        size="lg"
        className="w-full gap-2"
        disabled={!checked || isLoading || !!disabled}
        onClick={onConsented}
        style={primaryColor ? { backgroundColor: primaryColor, borderColor: primaryColor } : undefined}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <PenLine className="h-5 w-5" />
        )}
        {isLoading ? "Signing..." : "Adopt and Sign"}
      </Button>
    </div>
  );
}
