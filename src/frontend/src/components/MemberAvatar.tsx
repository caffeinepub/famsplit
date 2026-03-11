import { cn } from "@/lib/utils";
import type { Member } from "../types";

export function MemberAvatar({
  member,
  size = "md",
  className,
}: { member: Member; size?: "sm" | "md" | "lg"; className?: string }) {
  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sizeClass = {
    sm: "w-7 h-7 text-[10px]",
    md: "w-9 h-9 text-xs",
    lg: "w-12 h-12 text-sm",
  }[size];

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold text-white flex-shrink-0",
        sizeClass,
        className,
      )}
      style={{ backgroundColor: member.color }}
    >
      {initials}
    </div>
  );
}
