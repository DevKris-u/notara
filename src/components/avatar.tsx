import { avatarStyle, initials } from "@/lib/utils";

export function Avatar({
  name,
  hue,
  size = "md",
  className,
}: {
  name: string;
  hue: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const cls = size === "lg" ? "avatar avatar-lg" : size === "sm" ? "avatar avatar-sm" : "avatar";
  return (
    <span className={[cls, className].filter(Boolean).join(" ")} style={avatarStyle(hue)} title={name}>
      {initials(name)}
    </span>
  );
}
