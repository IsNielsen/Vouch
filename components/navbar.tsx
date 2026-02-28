import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { AuthButton } from "./auth-button";
import { ThemeSwitcher } from "./theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import { EnvVarWarning } from "./env-var-warning";

async function NavLinks() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (!user) return null;

  return (
    <div className="flex items-center gap-4 text-lg font-medium">
      <Link href="/protected/upload" className="hover:underline">
        Upload
      </Link>
      <Link href="/protected/signed" className="hover:underline">
        My Documents
      </Link>
    </div>
  );
}

export function Navbar() {
  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
      <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-xl">
        <div className="flex gap-5 items-center font-semibold">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/vouchLogo.png" alt="Vouch logo" width={64} height={64} className="brightness-0 dark:invert" />
            Vouch
          </Link>
          <Suspense>
            <NavLinks />
          </Suspense>
        </div>
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          {!hasEnvVars ? (
            <EnvVarWarning />
          ) : (
            <Suspense>
              <AuthButton />
            </Suspense>
          )}
        </div>
      </div>
    </nav>
  );
}
