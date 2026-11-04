import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Heart, RefreshCw, ShoppingBag } from "lucide-react";
import { LookBoard, MatchRing } from "@/components/look-board";
import { Sheet } from "@/components/sheet";
import { Shell } from "@/components/shell";
import { Button, Chip, inputClass } from "@/components/ui";
import { defaultOccasion } from "@/lib/dates";
import { CLIMATES, COLOR_BOOK, missingTip, OCCASIONS, paletteFor, resolveColor, scoreLook, slotOf, suggest, type Occasion } from "@/lib/engine";
import { useCloset } from "@/lib/store";
import { CATEGORIES, type Category, type Climate, type Item, type Look, type Slot } from "@/lib/types";

export const Route = createFileRoute("/studio")({ component: OutfitStudioPage });

const climateLabels: Record<Climate, string> = { warm: "Warm", mild: "Mild", cool: "Cool" };
const neutralColors = ["black", "white", "ivory", "cream", "sand", "beige", "charcoal", "grey", "navy"];

type Mode = "create" | "check" | "buy";

function OutfitStudioPage() {
  const profile = useCloset((state) => state.profile);
  const items = useCloset((state) => state.items);
  const saveLook = useCloset((state) => state.saveLook);
  const logLook = useCloset((state) => state.logLook);
  const [mode, setMode] = useState<Mode>("create");
  const [occasion, setOccasion] = useState<Occasion>(defaultOccasion());
  const [climate, setClimate] = useState<Climate>("mild");
  const [seed, setSeed] = useState(0);
  const [index, setIndex] = useState(0);
  const [manual, setManual] = useState<Partial<Record<Slot, Item>>>({});
  const [pickerSlot, setPickerSlot] = useState<Category | null>(null);
  const [notice, setNotice] = useState("");
  const [buyName, setBuyName] = useState("");
  const [buyCategory, setBuyCategory] = useState<Category>("Tops");
  const [buyColor, setBuyColor] = useState("sage");
  const [buyRun, setBuyRun] = useState(false);

  const context = { occasion, undertone: profile.undertone, climate, face: profile.face, seed };
  const looks = useMemo(() => suggest(items, context), [items, occasion, profile.undertone, profile.face, climate, seed]);
  const manualParts = Object.entries(manual).map(([slot, item]) => ({ ...item!, slot: slot as Slot }));
  const manualLook = manualParts.length ? scoreLook(manualParts, context) : null;
  const allLooks = manualLook ? [...looks, manualLook] : looks;
  const current = allLooks[Math.min(index, Math.max(0, allLooks.length - 1))] ?? null;
  const tip = missingTip(items, occasion);

  function choose(item: Item) {
    const slot = slotOf(item.category);
    setManual((previous) => {
      const next = { ...previous };
      if (next[slot]?.id === item.id) delete next[slot];
      else next[slot] = item;
      if (slot === "dress" && next.dress) { delete next.top; delete next.bottom; }
      if ((slot === "top" || slot === "bottom") && next[slot]) delete next.dress;
      return next;
    });
    setIndex(looks.length);
    setNotice("");
  }

  const buyResult = useMemo(() => {
    const wardrobe = items.filter((item) => item.clean);
    const categoryItems = wardrobe.filter((item) => item.category === buyCategory);
    const candidate = resolveColor({ color: buyColor, name: buyName });
    const known = wardrobe.map((item) => ({ item, color: resolveColor(item) })).filter((entry) => entry.color);
    const sameColor = candidate ? known.filter((entry) => entry.color?.name === candidate.name) : [];
    const neutralMatch = candidate ? known.filter((entry) => neutralColors.includes(entry.color!.name)) : known;
    const versatile = !candidate || neutralColors.includes(candidate.name) || sameColor.length > 0 || neutralMatch.length >= 2;
    const missingCategory = categoryItems.length === 0;
    const pairings = known.filter((entry) => entry.item.category !== buyCategory && (
      !candidate || neutralColors.includes(entry.color!.name) || neutralColors.includes(candidate.name) || entry.color!.name === candidate.name
    )).slice(0, 5).map((entry) => entry.item);
    return { missingCategory, versatile, sameColor, pairings, count: categoryItems.length };
  }, [items, buyCategory, buyColor, buyName]);

  const buyVerdict = buyResult.missingCategory ? "A useful wardrobe gap" : buyResult.versatile ? "Likely to work with your closet" : "Pause and plan three outfits";

  return (
    <Shell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Wearly / Personal styling</p>
          <h1 className="mt-1 font-display text-4xl font-semibold">Outfit Studio</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">A practical styling space built around your real wardrobe, your colours and your day.</p>
        </div>
        <div className="rounded-full border border-line px-3 py-2 text-xs text-muted">{items.length} wardrobe pieces</div>
      </div>

      <div className="mt-6 grid grid-cols-3 rounded-full border border-line bg-surface p-1" role="tablist" aria-label="Outfit Studio tools">
        {([ ["create", "Create"], ["check", "Outfit check"], ["buy", "Should I buy?"] ] as const).map(([key, label]) => (
          <button key={key} type="button" role="tab" aria-selected={mode === key} onClick={() => { setMode(key); setNotice(""); }} className={`min-h-10 rounded-full px-2 text-xs font-semibold transition-colors sm:text-sm ${mode === key ? "bg-ink text-bg" : "text-muted hover:text-ink"}`}>
            {label}
          </button>
        ))}
      </div>

      {mode === "buy" ? (
        <section className="mt-6 max-w-3xl">
          <div className="rounded-md bg-tile p-5 sm:p-7">
            <div className="flex items-center gap-2 text-muted"><ShoppingBag className="size-4"/><span className="text-xs font-semibold uppercase tracking-[0.16em]">Wardrobe purchase check</span></div>
            <h2 className="mt-3 font-display text-3xl font-semibold">Will it earn a place?</h2>
            <p className="mt-2 max-w-xl text-sm text-muted">Check whether a new piece fills a gap and how easily it could combine with clothes you already own. No shopping API or paid AI needed.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-semibold">Item name<input className={inputClass} value={buyName} onChange={(event) => { setBuyName(event.target.value); setBuyRun(false); }} placeholder="e.g. Sage overshirt"/></label>
              <label className="flex flex-col gap-2 text-sm font-semibold">Category<select className={inputClass} value={buyCategory} onChange={(event) => { setBuyCategory(event.target.value as Category); setBuyRun(false); }}>{CATEGORIES.map((entry) => <option key={entry}>{entry}</option>)}</select></label>
              <label className="flex flex-col gap-2 text-sm font-semibold sm:col-span-2">Main colour<div className="flex gap-2"><input className={inputClass} value={buyColor} onChange={(event) => { setBuyColor(event.target.value); setBuyRun(false); }} placeholder="sage, navy, cream, mocha"/><span className="size-11 shrink-0 rounded-md border border-line" style={{ background: COLOR_BOOK[buyColor.trim().toLowerCase()] ?? "var(--wearly-tile)" }}/></div><span className="text-xs font-normal text-muted">Use a simple colour name for the best result.</span></label>
            </div>
            <Button tone="brand" className="mt-5 w-full sm:w-auto" onClick={() => setBuyRun(true)} disabled={!buyColor.trim()}>Check compatibility</Button>
          </div>
          {buyRun && <div className="mt-5 rounded-md border border-line bg-surface p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Wearly's take</p>
            <h3 className="mt-2 font-display text-2xl font-semibold">{buyVerdict}</h3>
            <p className="mt-2 text-sm text-muted">{buyResult.missingCategory ? `You do not currently have a clean ${buyCategory.toLowerCase()} item. This could add a missing option.` : buyResult.sameColor.length ? `You already own ${buyResult.sameColor.length} piece(s) in a similar colour, so this shade has known pairing options.` : buyResult.versatile ? "Your closet has enough neutral or compatible colours to give this item several possible pairings." : "Your closet has fewer obvious colour pairings for this shade. Before buying, try to identify at least three complete outfits."}</p>
            {buyResult.pairings.length > 0 && <><h4 className="mt-5 text-sm font-semibold">Possible pairings from your closet</h4><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">{buyResult.pairings.map((item) => <div key={item.id} className="min-w-0"><div className="flex aspect-square items-center justify-center overflow-hidden rounded-md bg-tile"><img src={item.image} alt={item.name} className="h-full w-full object-contain p-2"/></div><p className="mt-1 truncate text-xs font-semibold">{item.name}</p><p className="text-xs text-muted">{item.color}</p></div>)}</div></>}
            <p className="mt-4 text-xs text-muted">This checks wardrobe compatibility only; it cannot judge fabric quality, fit, price or whether you genuinely need the item.</p>
          </div>}
        </section>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Occasion">{OCCASIONS.map((entry) => <Chip key={entry} pressed={occasion === entry} onClick={() => { setOccasion(entry); setIndex(0); setNotice(""); }}>{entry}</Chip>)}</div>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Weather">{CLIMATES.map((entry) => <Chip key={entry} pressed={climate === entry} onClick={() => { setClimate(entry); setIndex(0); }}>{climateLabels[entry]}</Chip>)}</div>
          <div className="mt-6 grid gap-7 lg:grid-cols-[minmax(280px,390px)_1fr] lg:items-start">
            <section>
              {current ? <LookBoard parts={current.parts} label="Outfit suggestion from your wardrobe"/> : <div className="rounded-md bg-tile p-6"><h2 className="font-display text-2xl font-semibold">Your next look starts here.</h2><p className="mt-2 text-sm text-muted">{tip || "Add a top and bottom, or a dress, to start creating looks."}</p></div>}
              {current && <div className="mt-3 flex flex-wrap items-center gap-2">{allLooks.map((look, i) => <Chip key={look === manualLook ? "mine" : `${i}-${look.parts[0]?.id}`} pressed={index === i} onClick={() => { setIndex(i); setNotice(""); }}>{look === manualLook ? "My edit" : `Look ${i + 1}`}</Chip>)}</div>}
              <div className="mt-3 flex flex-wrap gap-2"><Button tone="outline" onClick={() => { setSeed((value) => value + 1); setIndex(0); setManual({}); setNotice("Fresh combinations generated from your clean wardrobe."); }}><RefreshCw className="size-4"/> Shuffle looks</Button><Button tone="outline" onClick={() => setPickerSlot("Tops")}>Mix my pieces</Button></div>
            </section>
            <section>
              {current ? <>
                <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{mode === "check" ? "Outfit review" : "Your suggested look"}</p><h2 className="mt-1 font-display text-2xl font-semibold">{manualLook && current === manualLook ? "Your combination" : `${occasion} edit`}</h2><p className="mt-1 text-sm text-muted">{current.parts.map((part) => part.name).join(" · ")}</p></div><MatchRing pct={current.pct}/></div>
                <ul className="mt-4 space-y-2">{current.why.map((line) => <li key={line} className="border-b border-line pb-2 text-sm">{line}</li>)}</ul>
                {mode === "check" && <OutfitCheck look={current} occasion={occasion} climate={climate} undertone={profile.undertone}/>}
                <div className="mt-5 flex flex-wrap gap-2"><Button tone="brand" onClick={() => { const result = logLook({ occasion, itemIds: current.parts.map((part) => part.id), note: current.why[0] ?? "" }); setNotice(result === "logged" ? "Outfit logged. Your wear counts have been updated." : "Today's outfit log has been updated."); }}>Wear today</Button><Button tone="outline" onClick={() => { saveLook({ id: current.parts.map((part) => part.id).sort().join("-"), name: `${occasion} look`, occasion, itemIds: current.parts.map((part) => part.id), why: current.why[0] ?? "", createdAt: Date.now() }); setNotice("Saved to your looks."); }}><Heart className="size-4"/> Save look</Button><Button tone="ghost" onClick={() => setPickerSlot("Tops")}>Edit pieces</Button></div>
                {notice && <p className="mt-3 text-sm" role="status">{notice}</p>}
              </> : <p className="rounded-md border border-line p-5 text-sm text-muted">{tip || "Add more clean clothes to create a complete look."}</p>}
              {mode === "check" && !current && <p className="mt-4 text-sm text-muted">Once you have a look, Wearly will check colour balance, your personal palette, weather and finishing pieces.</p>}
            </section>
          </div>
        </>
      )}
      {pickerSlot && <PiecePicker items={items.filter((item) => item.clean)} selected={manual} initialCategory={pickerSlot} onChoose={choose} onClose={() => setPickerSlot(null)}/>}
    </Shell>
  );
}

function OutfitCheck({ look, occasion, climate, undertone }: { look: Look; occasion: Occasion; climate: Climate; undertone: "warm" | "cool" | "neutral" }) {
  const palette = paletteFor(undertone);
  const nearFace = look.parts.filter((part) => ["top", "dress", "outer", "glasses"].includes(part.slot));
  const nearColors = nearFace.map((part) => resolveColor(part)).filter(Boolean);
  const toneMatch = undertone === "neutral" || nearColors.some((entry) => palette.wear.some((swatch) => swatch.name.toLowerCase() === entry?.name));
  const loud = [...new Set(look.parts.map((part) => resolveColor(part)?.name).filter((name): name is string => Boolean(name) && !neutralColors.includes(name!)))];
  const colorBalance = loud.length <= 2;
  const weatherFit = climate === "warm" ? !look.parts.some((part) => part.weight === "heavy") : climate === "cool" ? look.parts.some((part) => part.slot === "outer" || part.weight === "heavy") : true;
  const footwear = look.parts.some((part) => part.slot === "shoes");
  const checks = [
    { label: "Colour balance", ok: colorBalance, note: colorBalance ? "The palette stays focused." : "Try reducing the number of statement colours." },
    { label: "Personal palette", ok: toneMatch, note: toneMatch ? `A colour near your face suits your ${undertone} undertone.` : `Try a ${undertone}-friendly shade closer to your face.` },
    { label: "Occasion & weather", ok: weatherFit && look.pct >= 75, note: `${occasion} · ${climate} conditions. ${weatherFit ? "The outfit weight looks suitable." : "Consider changing the layers."}` },
    { label: "Finishing touch", ok: footwear, note: footwear ? "Footwear is included." : "Add shoes to finish the outfit." },
  ];
  const passed = checks.filter((entry) => entry.ok).length;
  return <div className="mt-6 rounded-md border border-line bg-surface p-4"><div className="flex items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Wearly outfit check</p><h3 className="mt-1 font-display text-xl font-semibold">{passed === 4 ? "Ready to wear" : passed >= 2 ? "A strong starting point" : "Room to refine"}</h3></div><p className="font-display text-3xl font-semibold tabular-nums">{Math.round(passed / 4 * 100)}%</p></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-tile"><div className="h-full bg-brand" style={{ width: `${passed / 4 * 100}%` }}/></div><ul className="mt-3 divide-y divide-line">{checks.map((entry) => <li key={entry.label} className="flex gap-3 py-3"><span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-xs ${entry.ok ? "bg-brand text-on-brand" : "bg-tile text-muted"}`}>{entry.ok ? "✓" : "–"}</span><span><strong className="block text-sm">{entry.label}</strong><span className="mt-0.5 block text-sm text-muted">{entry.note}</span></span></li>)}</ul><p className="mt-2 text-xs text-muted">A practical checklist, not an objective judgement of how you look.</p></div>;
}

function PiecePicker({ items, selected, initialCategory, onChoose, onClose }: { items: Item[]; selected: Partial<Record<Slot, Item>>; initialCategory: Category; onChoose: (item: Item) => void; onClose: () => void }) {
  const [category, setCategory] = useState<Category>(initialCategory);
  const shown = items.filter((item) => item.category === category);
  return <Sheet title="Mix your pieces" onClose={onClose}><div className="chips mb-4 flex gap-2 overflow-x-auto">{CATEGORIES.map((entry) => <Chip key={entry} pressed={category === entry} onClick={() => setCategory(entry)}>{entry}</Chip>)}</div>{shown.length ? <div className="grid grid-cols-3 gap-3">{shown.map((item) => { const active = selected[slotOf(item.category)]?.id === item.id; return <button key={item.id} type="button" aria-pressed={active} onClick={() => onChoose(item)} className="min-w-0 text-left"><span className={`flex aspect-square items-center justify-center overflow-hidden rounded-md bg-tile ${active ? "outline-2 outline-ink" : ""}`}><img src={item.image} alt="" className="h-full w-full object-contain p-2"/></span><span className="mt-1 block truncate text-xs font-semibold">{item.name}</span></button>; })}</div> : <p className="text-sm text-muted">No clean {category.toLowerCase()} in your wardrobe yet.</p>}<p className="mt-4 text-xs text-muted">Tap a piece to add or remove it from your edit. You can switch categories to build a full look.</p><Button tone="brand" className="mt-4 w-full" onClick={onClose}>Done editing</Button></Sheet>;
}
