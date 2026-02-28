import { PasskeyAuth } from "@/components/passkey-auth";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <h1 className="text-2xl font-semibold">Welcome to Vouch</h1>
        <PasskeyAuth />
      </div>
    </div>
  );
}
