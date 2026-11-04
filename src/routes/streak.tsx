import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { addDays, streakCount, todayKey } from "@/lib/dates";
import { openStylist } from "@/lib/search";
import { useCloset } from "@/lib/store";

export const Route = createFileRoute("/streak")({ component: StreakPage });

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function StreakPage() {
  return (
    <Shell>
      <StreakBody />
    </Shell>
  );
}

function StreakBody() {
  const logs = useCloset((state) => state.logs);
  const items = useCloset((state) => state.items);
  const streak = streakCount(logs.map((log) => log.date));
  const dates = new Set(logs.map((log) => log.date));
  const today = todayKey();
  const mondayOffset = (new Date().getDay() + 6) % 7;
  const monday = addDays(today, -mondayOffset);
  const days = WEEK.map((label, index) => {
    const key = addDays(monday, index);
    return { label, key, on: dates.has(key), today: key === today };
  });

  const monthStart = new Date();
  monthStart.setDate(1);
  const cells: { key: string; day: number; on: boolean }[] = [];
  const pad = (monthStart.getDay() + 6) % 7;
  for (let i = 0; i < pad; i += 1) cells.push({ key: `pad-${i}`, day: 0, on: false });
  const last = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  for (let day = 1; day <= last; day += 1) {
    const key = todayKey(new Date(monthStart.getFullYear(), monthStart.getMonth(), day));
    cells.push({ key, day, on: dates.has(key) });
  }

  return (
    <div className="max-w-xl">
      <p className="text-sm text-muted">Style streak</p>
      <h1 className="mt-2 font-display text-4xl font-semibold">
        <span className="tabular-nums">{streak}</span> {streak === 1 ? "day" : "days"}
      </h1>
      <p className="mt-3 text-muted">
        Log one outfit a day from the stylist. Miss today and the streak still holds until midnight. Logging again updates the look without counting the clothes twice.
      </p>
      <ol className="mt-8 grid grid-cols-7 gap-2">
        {days.map((day) => (
          <li key={day.key} className="text-center">
            <p className="text-xs text-muted">{day.label}</p>
            <span
              className={`mt-2 flex h-11 items-center justify-center rounded-full text-sm tabular-nums ${
                day.on ? "bg-ink text-bg" : "bg-tile text-ink"
              } ${day.today ? "outline-2 outline-ink" : ""}`}
            >
              {Number(day.key.slice(-2))}
            </span>
          </li>
        ))}
      </ol>
      <h2 className="mt-12 font-display text-2xl font-semibold">This month</h2>
      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-sm">
        {WEEK.map((label) => (
          <p key={label} className="text-xs text-muted">
            {label.slice(0, 1)}
          </p>
        ))}
        {cells.map((cell) =>
          cell.day === 0 ? (
            <span key={cell.key} />
          ) : (
            <span key={cell.key} className={`flex h-10 items-center justify-center rounded-full tabular-nums ${cell.on ? "bg-ink text-bg" : ""}`}>
              {cell.day}
            </span>
          ),
        )}
      </div>
      <h2 className="mt-12 font-display text-2xl font-semibold">Logged looks</h2>
      {logs.length === 0 ? (
        <p className="mt-3 text-muted">
          Nothing logged yet.{" "}
          <Link to="/stylist" search={openStylist} className="font-semibold text-ink underline underline-offset-4">
            Wear something today
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {logs.map((log) => (
            <li key={log.date} className="py-3">
              <p className="text-sm text-muted">{log.date}</p>
              <p className="font-medium">
                {log.occasion} · {log.itemIds.map((id) => items.find((item) => item.id === id)?.name ?? "Removed piece").join(", ")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
