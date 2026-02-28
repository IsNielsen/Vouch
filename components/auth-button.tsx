import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";
import { Fingerprint } from "lucide-react";

export async function AuthButton() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  return user ? (
    <div className="flex items-center gap-4">
      <Fingerprint className="h-4 w-4 text-muted-foreground" />
      <LogoutButton />
    </div>
  ) : (
    <Button asChild size="sm" variant="outline" className="gap-2">
      <Link href="/auth/login">
        <Fingerprint className="h-4 w-4" />
        Sign in
      </Link>
    </Button>
  );
}
