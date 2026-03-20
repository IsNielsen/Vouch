import { cn } from "@/lib/utils";

interface Props {
  label: string;
  center?: boolean;
  className?: string;
}

export function SectionEyebrow({ label, center, className }: Props) {
  return (
    <div className={cn("flex items-center gap-3", center && "justify-center", className)}>
      <div className="w-4 h-px bg-[#5577ff]" />
      <span className="text-[11px] uppercase tracking-widest text-[#444466]">{label}</span>
      {center && <div className="w-4 h-px bg-[#5577ff]" />}
    </div>
  );
}
