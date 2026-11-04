import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { LookBoard, MatchRing } from "@/components/look-board";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui";
import { defaultOccasion, greeting, streakCount, todayKey } from "@/lib/dates";
import { paletteFor, readAsk, suggest, type Occasion } from "@/lib/engine";
import { useCloset } from "@/lib/store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <Shell>
      <HomeBody />
    </Shell>
  );
}

function HomeBody() {
  const profile = useCloset((state) => state.profile);
  const items = useCloset((state) => state.items);
  const logs = useCloset((state) => state.logs);
  const logLook = useCloset((state) => state.logLook);
  const navigate = useNavigate();
  const [ask, setAsk] = useState("");
  const [note, setNote] = useState("");
  const occasion = defaultOccasion();
  const daySeed = Number(todayKey().replaceAll("-", ""));
  const look = useMemo(
    () =>
      suggest(items, {
        occasion,
        undertone: profile.undertone,
        climate: "mild",
        face: profile.face,
        seed: daySeed,
      })[0],
    [items, occasion, profile.undertone, profile.face, daySeed],
  );
  const palette = paletteFor(profile.undertone);
  const streak = streakCount(logs.map((entry) => entry.date));
  const logged = logs.some((entry) => entry.date === todayKey());
  const clean = items.filter((item) => item.clean).length;

  function onAsk(event: FormEvent) {
    event.preventDefault();
    const parsed = readAsk(ask, occasion);
    navigate({ to: "/stylist", search: { occasion: parsed.occasion, climate: parsed.climate } });
  }

  function wear() {
    if (!look) return;
    const result = logLook({
      occasion,
      itemIds: look.parts.map((part) => part.id),
      note: look.why[0] ?? "",
    });
    setNote(result === "logged" ? "Logged. Your streak moved." : "Today's log now uses this look.");
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
      <section>
        <p className="text-sm text-muted">
          {occasion} · {clean} pieces ready
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold">{greeting(profile.name)}.</h1>
        <p className="mt-3 max-w-md text-muted">One look from your closet, matched to your colors. Ask if the day is different.</p>
        <form onSubmit={onAsk} className="mt-6 flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="ask">
            Ask Wearly
          </label>
          <input
            id="ask"
            value={ask}
            onChange={(event) => setAsk(event.target.value)}
            placeholder="Office, and it's warm"
            className="min-h-11 flex-1 rounded-full border border-line bg-surface px-4 text-base outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          />
          <Button tone="brand" type="submit">
            Ask Wearly
          </Button>
        </form>
        <dl className="mt-8 flex gap-10">
          <div>
            <dt className="text-sm text-muted">Streak</dt>
            <dd className="font-display text-3xl font-semibold tabular-nums">{streak}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Worn today</dt>
            <dd className="font-display text-3xl font-semibold">{logged ? "Yes" : "Not yet"}</dd>
          </div>
        </dl>
        <div className="mt-10 border-t border-line pt-5">
          <p className="text-sm font-semibold">Colors that suit you</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {palette.wear.slice(0, 5).map((swatch) => (
              <span key={swatch.name} className="inline-flex items-center gap-2 text-sm">
                <span className="size-4 rounded-full outline outline-line" style={{ background: swatch.hex }} />
                {swatch.name}
              </span>
            ))}
            <Link to="/colors" className="text-sm font-semibold underline underline-offset-4">
              Full palette
            </Link>
          </div>
        </div>
      </section>

      <section>
        {look ? (
          <>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-semibold">Today's fit</h2>
                <p className="text-sm text-muted">{look.parts.map((part) => part.name).join(" · ")}</p>
              </div>
              <MatchRing pct={look.pct} />
            </div>
            <LookBoard parts={look.parts} label={`Today's ${occasion} outfit`} />
            <ul className="mt-4 flex flex-col gap-2 text-sm">
              {look.why.map((line) => (
                <li key={line} className="border-b border-line pb-2">
                  {line}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button tone="outline" onClick={wear}>
                {logged ? "Update today" : "Wear this"}
              </Button>
              <Link
                to="/stylist"
                search={{ occasion: occasion as Occasion, climate: "mild" }}
                className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4"
              >
                See other looks
              </Link>
            </div>
            {note && (
              <p className="mt-3 text-sm" role="status">
                {note}
              </p>
            )}
          </>
        ) : (
          <div className="rounded-md bg-tile p-6">
            <h2 className="font-display text-2xl font-semibold">Not enough pieces yet.</h2>
            <p className="mt-2 text-muted">Add a top and a bottom, or a dress, and Wearly will dress you from what you own.</p>
            <Link to="/wardrobe" search={{ add: true }} className="mt-4 inline-flex min-h-11 items-center font-semibold underline underline-offset-4">
              Add a piece
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
