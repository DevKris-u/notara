import { requireUser } from "@/lib/auth";
import { unreadNotifications, whiteboardRemaining } from "@/lib/points";
import { RailNav } from "@/components/rail-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [unread, remaining] = await Promise.all([unreadNotifications(user.id), whiteboardRemaining(user)]);
  return (
    <div className="shell">
      <RailNav
        user={{
          display_name: user.display_name,
          username: user.username,
          avatar_hue: user.avatar_hue,
          streak: user.streak,
          xp: user.xp,
          plan: user.plan,
        }}
        unread={unread}
        boardsLeft={remaining.unlimited ? null : remaining.left}
      />
      <main className="main">{children}</main>
    </div>
  );
}
