"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions";
import { Avatar } from "@/components/avatar";
import {
  BoardIcon,
  ChatIcon,
  CommunityIcon,
  HomeIcon,
  LibraryIcon,
  PlanIcon,
  PracticeIcon,
  SettingsIcon,
  SparkIcon,
  TrophyIcon,
  FlameIcon,
  ArrowIcon,
} from "@/components/icons";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; width?: number; height?: number }>;
};

const MAIN: NavItem[] = [
  { href: "/home", label: "Start", icon: HomeIcon },
  { href: "/chat", label: "Czat z AI", icon: ChatIcon },
  { href: "/whiteboard", label: "Tablica AI", icon: BoardIcon },
  { href: "/plans", label: "Plan nauki", icon: PlanIcon },
  { href: "/practice", label: "Ćwiczenia", icon: PracticeIcon },
];

const SOCIAL: NavItem[] = [
  { href: "/community", label: "Notatki", icon: CommunityIcon },
  { href: "/questions", label: "Pytania", icon: SparkIcon },
  { href: "/leaderboard", label: "Ranking", icon: TrophyIcon },
];

const YOU: NavItem[] = [
  { href: "/library", label: "Biblioteka", icon: LibraryIcon },
  { href: "/pricing", label: "Plan i limity", icon: SparkIcon },
  { href: "/settings", label: "Ustawienia", icon: SettingsIcon },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/home") return pathname === "/home";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Group({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <div className="rail-group">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} className="rail-link" data-active={isActive(pathname, item.href)}>
            <Icon className="ico" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export function RailNav({
  user,
  unread,
  boardsLeft,
}: {
  user: {
    display_name: string;
    username: string;
    avatar_hue: number;
    streak: number;
    xp: number;
    plan: string;
  };
  unread: number;
  boardsLeft: number | null;
}) {
  const pathname = usePathname() ?? "/home";

  return (
    <>
      <aside className="rail">
        <Link href="/home" className="brand">
          <span className="brand-mark">n</span>
          <span className="brand-name">
            notara<span>.</span>
          </span>
        </Link>

        <Group items={MAIN} pathname={pathname} />
        <div>
          <div className="rail-label">Społeczność</div>
          <Group items={SOCIAL} pathname={pathname} />
        </div>
        <div>
          <div className="rail-label">Twoje</div>
          <Group items={YOU} pathname={pathname} />
        </div>

        <div className="rail-cta">
          <div className="row" style={{ gap: 6 }}>
            <FlameIcon width={15} height={15} />
            <b style={{ fontSize: 14 }}>{user.streak} dni z rzędu</b>
          </div>
          <p className="small" style={{ margin: "4px 0 9px" }}>
            {boardsLeft === null
              ? "Nielimitowane lekcje na tablicy"
              : boardsLeft > 0
                ? `Tablica AI: ${boardsLeft} lekcje do wykorzystania`
                : "Limit tablicy wykorzystany"}
          </p>
          <Link href="/pricing" className="btn btn-sm btn-gold" style={{ width: "100%" }}>
            {user.plan === "free" ? "Przejdź na Pro" : "Twój plan"} <ArrowIcon width={14} height={14} />
          </Link>
        </div>

        <div style={{ marginTop: 2 }}>
          <Link href="/settings" className="rail-user">
            <Avatar name={user.display_name} hue={user.avatar_hue} size="sm" />
            <span style={{ minWidth: 0, flex: 1 }}>
              <span style={{ display: "block", fontSize: 13, fontWeight: 650, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.display_name}
              </span>
              <span className="small" style={{ display: "block" }}>
                {user.xp} XP {unread > 0 ? `· ${unread} nowe` : ""}
              </span>
            </span>
          </Link>
          <form action={logoutAction} style={{ marginTop: 6 }}>
            <button type="submit" className="btn btn-ghost btn-sm" style={{ width: "100%" }}>
              Wyloguj
            </button>
          </form>
        </div>
      </aside>

      <nav className="mobile-nav">
        {[MAIN[0], MAIN[1], MAIN[2], MAIN[4], SOCIAL[0]].map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} data-active={isActive(pathname, item.href)}>
              <Icon width={20} height={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
