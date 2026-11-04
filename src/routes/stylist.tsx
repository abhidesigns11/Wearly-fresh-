import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { LookBoard, MatchRing } from "@/components/look-board";
import { Sheet } from "@/components/sheet";
import { Shell } from "@/components/shell";
import { Button, Chip } from "@/components/ui";
import { defaultOccasion } from "@/lib/dates";
import { CLIMATES, missingTip, OCCASIONS, scoreLook, slotOf, suggest, type Occasion } from "@/lib/engine";
import { useCloset } from "@/lib/store";
import { styleNote } from "@/lib/style-note";
import type { Climate, Item, Look, Slot } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";

export const Route = createFileRoute("/stylist")({
  validateSearch: (search: Record<string, unknown>) => ({
    occasion: OCCASIONS.find((entry) => entry === search.occasion),
    climate: CLIMATES.find((entry) => entry === search.climate),
  }),
  component: StylistPage,
});

const CLIMATE_LABEL: Record<Climate, string> = { warm: "Warm day", mild: "Mild", cool: "Cool day" };

function StylistPage() {
  return (
    <Shell>
      <StylistBody />
    </Shell>
  );
}

function StylistBody() {
  const search = Route.useSearch();
  const profile = useCloset((state) => state.profile);
  const items = useCloset((state) => state.items);
  const logLook = useCloset((state) => state.logLook);
  const saveLook = useCloset((state) => state.saveLook);
  const draftIds = useCloset((state) => state.draftIds);
  const setDraft = useCloset((state) => state.setDraft);
  const ask = useServerFn(styleNote);

  const [occasion, setOccasion] = useState<Occasion>(search.occasion ?? defaultOccasion());
  const [climate, setClimate] = useState<Climate>(search.climate ?? "mild");
  const [seed, setSeed] = useState(0);
  const [index, setIndex] = useState(0);
  const [manual, setManual] = useState<Partial<Record<Slot, Item>>>({});
  const [picking, setPicking] = useState(false);
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState("");
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    if (search.occasion) setOccasion(search.occasion);
    if (search.climate) setClimate(search.climate);
  }, [search.occasion, search.climate]);

  useEffect(() => {
    if (!draftIds?.length) return;
    const next: Partial<Record<Slot, Item>> = {};
    for (const id of draftIds) {
      const item = items.find((entry) => entry.id === id);
      if (item) next[slotOf(item.category)] = item;
    }
    setManual(next);
    setIndex(99);
    setDraft(null);
  }, [draftIds, items, setDraft]);

  const looks = useMemo(
    () => suggest(items, { occasion, undertone: profile.undertone, climate, face: profile.face, seed }),
    [items, occasion, profile.undertone, profile.face, climate, seed],
  );

  const manualParts = Object.entries(manual).map(([slot, item]) => ({ ...item!, slot: slot as Slot }));
  const manualLook: Look | null = manualParts.length
    ? scoreLook(manualParts, { occasion, undertone: profile.undertone, climate, face: profile.face })
    : null;
  const all = manualLook ? [...looks, manualLook] : looks;
  const current = all[Math.min(index, Math.max(0, all.length - 1))];
  const tip = missingTip(items, occasion);

  function choose(item: Item) {
    const slot = slotOf(item.category);
    setManual((prev) => {
      const next = { ...prev };
      if (next[slot]?.id === item.id) delete next[slot];
      else next[slot] = item;
      if (slot === "dress" && next.dress) {
        delete next.top;
        delete next.bottom;
      }
      if ((slot === "top" || slot === "bottom") && next[slot]) delete next.dress;
      return next;
    });
    setIndex(looks.length);
    setNote("");
    setStatus("");
  }

  async function onAsk() {
    if (!current) return;
    setAsking(true);
    setNoteError("");
    const result = await ask({
      data: {
        occasion,
        undertone: profile.undertone,
        climate,
        face: profile.face,
        pieces: current.parts.map((part) => ({ name: part.name, color: part.color, category: part.category })),
      },
    });
    setAsking(false);
    if (result.ok) setNote(result.text);
    else setNoteError(result.error);
  }

  return (
    <>
      <h1 className="font-display text-4xl font-semibold">Stylist</h1>
      <p className="mt-1 max-w-xl text-muted">Looks are built only from pieces you actually own. Shuffle keeps the good ones and changes the hero piece.</p>
      <div className="chips mt-4 flex w-full min-w-0 gap-2 overflow-x-auto" role="group" aria-label="Occasion">
        {OCCASIONS.map((entry) => (
          <Chip
            key={entry}
            pressed={entry === occasion}
            onClick={() => {
              setOccasion(entry);
              setIndex(0);
              setStatus("");
              setNote("");
            }}
          >
            {entry}
          </Chip>
        ))}
      </div>
      <div className="mt-3 flex gap-2" role="group" aria-label="Weather">
        {CLIMATES.map((entry) => (
          <Chip key={entry} pressed={climate === entry} onClick={() => { setClimate(entry); setIndex(0); setNote(""); }}>
            {CLIMATE_LABEL[entry]}
          </Chip>
        ))}
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(280px,380px)_1fr] lg:items-start">
        <section>
          {current ? (
            <LookBoard parts={current.parts} label="Outfit on a look board" />
          ) : (
            <div className="rounded-md bg-tile p-6">
              <h2 className="font-display text-2xl font-semibold">Not enough pieces yet.</h2>
              <p className="mt-2 text-sm text-muted">{tip || "Add a few clothes to get looks."}</p>
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {all.length > 1 &&
              all.map((look, i) => (
                <Chip key={look === manualLook ? "mine" : i} pressed={i === Math.min(index, all.length - 1)} onClick={() => { setIndex(i); setNote(""); setStatus(""); }}>
                  {look === manualLook ? "Mine" : `Look ${i + 1}`}
                </Chip>
              ))}
            <button type="button" className="min-h-11 px-2 text-sm underline underline-offset-4" onClick={() => { setSeed((value) => value + 1); setIndex(0); setNote(""); }}>
              Shuffle
            </button>
            <button type="button" className="min-h-11 px-2 text-sm underline underline-offset-4" onClick={() => setPicking(true)}>
              Pick pieces
            </button>
          </div>
        </section>

        <section>
          {current && (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-semibold">{current === manualLook ? "Your edit" : `Look ${Math.min(index, all.length - 1) + 1}`}</h2>
                  <p className="mt-1 text-sm text-muted">{current.parts.map((part) => part.name).join(", ")}</p>
                </div>
                <MatchRing pct={current.pct} />
              </div>
              <ul className="mt-4 flex flex-col gap-2">
                {current.why.map((line) => (
                  <li key={line} className="border-b border-line pb-2 text-sm">
                    {line}
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  tone="brand"
                  onClick={() => {
                    const result = logLook({
                      occasion,
                      itemIds: current.parts.map((part) => part.id),
                      note: current.why[0] ?? "",
                    });
                    setStatus(result === "logged" ? "Logged for today. Wear counts went up." : "Today's log was updated.");
                  }}
                >
                  Wear today
                </Button>
                <Button
                  tone="outline"
                  onClick={() => {
                    saveLook({
                      id: current.parts.map((part) => part.id).join("-"),
                      name: `${occasion} look`,
                      occasion,
                      itemIds: current.parts.map((part) => part.id),
                      why: current.why[0] ?? "",
                      createdAt: Date.now(),
                    });
                    setStatus("Saved to your looks.");
                  }}
                >
                  Save look
                </Button>
                <Button tone="ghost" onClick={onAsk} disabled={asking}>
                  {asking ? "Asking…" : "Ask why"}
                </Button>
              </div>
              {note && <p className="mt-4 max-w-prose text-sm">{note}</p>}
              {noteError && (
                <p className="mt-4 text-sm" role="alert">
                  {noteError} The match notes above still hold.
                </p>
              )}
              {status && (
                <p className="mt-3 text-sm" role="status">
                  {status}
                </p>
              )}
              {tip && <p className="mt-4 text-sm text-muted">{tip}</p>}
            </>
          )}
        </section>
      </div>
      {picking && <Picker items={items.filter((item) => item.clean)} selected={manual} onChoose={choose} onClose={() => setPicking(false)} />}
    </>
  );
}


function Picker({
  items,
  selected,
  onChoose,
  onClose,
}: {
  items: Item[];
  selected: Partial<Record<Slot, Item>>;
  onChoose: (item: Item) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<(typeof CATEGORIES)[number]>("Tops");
  const shown = items.filter((item) => item.category === tab);
  return (
    <Sheet title="Pick pieces" onClose={onClose}>
      <div className="chips mb-4 flex gap-2 overflow-x-auto">
        {CATEGORIES.map((entry) => (
          <Chip key={entry} pressed={tab === entry} onClick={() => setTab(entry)}>
            {entry}
          </Chip>
        ))}
      </div>
      {shown.length === 0 ? (
        <p className="text-sm text-muted">Nothing clean in {tab.toLowerCase()}.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {shown.map((item) => {
            const pressed = selected[slotOf(item.category)]?.id === item.id;
            return (
              <button key={item.id} type="button" aria-pressed={pressed} onClick={() => onChoose(item)} className="text-left">
                <span className={`flex aspect-square items-center justify-center overflow-hidden rounded-sm bg-tile ${pressed ? "outline-2 outline-ink" : ""}`}>
                  <img src={item.image} alt="" className="h-full w-full object-contain p-1" />
                </span>
                <span className="mt-1 block truncate text-xs">{item.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </Sheet>
  );
}
