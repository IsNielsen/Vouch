import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import vouchLogo from "@/app/vouchLogo.png";
import { createClient } from "@/lib/supabase/server";
import { AuthButton } from "./auth-button";
import { hasEnvVars } from "@/lib/utils";
import { EnvVarWarning } from "./env-var-warning";
import { MobileMenu } from "./mobile-menu";

async function AuthNavLinks() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (!user) return null;

  return (
    <Link href="/protected/dashboard" className="text-sm text-[#8888a8] hover:text-[#f0f0fa] transition-colors duration-150">
      Dashboard
    </Link>
  );
}

export function Navbar() {
  return (
    <nav className="w-full flex justify-center border-b border-[#1a1a2e] h-16 relative bg-[#0a0a0f] z-40">
      <div className="w-full max-w-7xl flex justify-between items-center px-4 md:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 text-[#f0f0fa] font-semibold text-lg">
            <Image src={vouchLogo} alt="Vouch logo" width={28} height={28} className="invert" />
            Vouch
          </Link>
          <div className="hidden md:flex items-center gap-5">
            <Link href="/demo" className="text-sm text-[#8888a8] hover:text-[#f0f0fa] transition-colors duration-150">
              Demo
            </Link>
            <Suspense>
              <AuthNavLinks />
            </Suspense>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {!hasEnvVars ? (
            <EnvVarWarning />
          ) : (
            <Suspense>
              <AuthButton />
            </Suspense>
          )}
          <Link
            href="/early-access"
            className="bg-[#5577ff] hover:bg-[#3344cc] text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 hover:-translate-y-px"
          >
            Early Access
          </Link>
        </div>

        <div className="flex md:hidden items-center gap-2">
          <MobileMenu>
            <Link href="/demo" className="text-sm text-[#8888a8]">Demo</Link>
            <Link href="/early-access" className="text-sm text-[#5577ff]">Early Access</Link>
            <Suspense>
              <AuthNavLinks />
            </Suspense>
            {!hasEnvVars ? (
              <EnvVarWarning />
            ) : (
              <Suspense>
                <AuthButton />
              </Suspense>
            )}
          </MobileMenu>
        </div>
      </div>
    </nav>
  );
}
