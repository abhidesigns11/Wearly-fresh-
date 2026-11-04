import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Heart, Search } from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Sheet } from "@/components/sheet";
import { Shell } from "@/components/shell";
import { Button, Field, inputClass } from "@/components/ui";
import { CATEGORIES } from "@/lib/types";
import { COLOR_BOOK } from "@/lib/engine";
import { useCloset } from "@/lib/store";
import type { Category, Frame, Item } from "@/lib/types";

export const Route = createFileRoute("/wardrobe")({
  validateSearch: (search: Record<string, unknown>) => ({
    add: search.add === true || search.add === "1" || search.add === "true",
  }),
  component: WardrobePage,
});

const COLORS = Object.keys(COLOR_BOOK);

function WardrobePage() {
  const { add } = Route.useSearch();
  const navigate = useNavigate();
  const items = useCloset((state) => state.items);
  const updateItem = useCloset((state) => state.updateItem);
  const [tab, setTab] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!add) return;
    setAdding(true);
    navigate({ to: "/wardrobe", search: { add: false }, replace: true });
  }, [add, navigate]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const tabOk = tab === "All" || (tab === "Favorites" ? item.favorite : item.category === tab);
      const text = `${item.name} ${item.color} ${item.category}`.toLowerCase();
      return tabOk && (!q || text.includes(q));
    });
  }, [items, tab, query]);

  const open = items.find((item) => item.id === openId);

  return (
    <Shell>
      <h1 className="font-display text-4xl font-semibold">Wardrobe</h1>
      <p className="mt-1 text-sm text-muted">
        {items.length} {items.length === 1 ? "piece" : "pieces"}. Starter pieces are here so you can try a look before you photograph your own.
      </p>
      <label className="relative mt-5 block">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          className={`${inputClass} rounded-full pl-11`}
          type="search"
          placeholder="Search by name or color"
          aria-label="Search wardrobe"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <div className="chips mt-4 flex w-full min-w-0 gap-5 overflow-x-auto border-b border-line" role="tablist">
        {["All", "Favorites", ...CATEGORIES].map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={tab === name}
            onClick={() => setTab(name)}
            className={`min-h-11 shrink-0 border-b-2 text-sm ${tab === name ? "border-ink font-semibold text-ink" : "border-transparent text-muted"}`}
          >
            {name}
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <div className="max-w-md py-12">
          <h2 className="font-display text-2xl font-semibold">{items.length ? "Nothing matches." : "Nothing here yet."}</h2>
          <p className="mt-2 text-muted">
            {items.length ? "Try another category or a different word." : "Use the plus to photograph a piece you own."}
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-4">
          {shown.map((item) => (
            <article key={item.id} className="relative">
              <button type="button" onClick={() => setOpenId(item.id)} className="flex w-full flex-col gap-1 text-left">
                <span className="relative flex aspect-garment items-center justify-center overflow-hidden rounded-md bg-tile">
                  <img src={item.image} alt="" className="h-full w-full object-contain p-3" />
                  {!item.clean && (
                    <span className="absolute top-2 left-2 rounded-full bg-surface px-2 py-1 text-xs text-muted">In laundry</span>
                  )}
                </span>
                <span className="truncate font-semibold">{item.name}</span>
                <span className="text-sm text-muted">
                  {item.category} · worn {item.wearCount}×
                </span>
              </button>
              <button
                type="button"
                aria-label={item.favorite ? "Remove from favorites" : "Add to favorites"}
                aria-pressed={item.favorite}
                onClick={() => updateItem(item.id, { favorite: !item.favorite })}
                className="absolute top-1 right-1 flex size-11 items-center justify-center"
              >
                <Heart className={`size-5 ${item.favorite ? "fill-ink text-ink" : "text-ink"}`} aria-hidden="true" />
              </button>
            </article>
          ))}
        </div>
      )}
      {adding && <AddSheet onClose={() => setAdding(false)} />}
      {open && <ItemSheet item={open} onClose={() => setOpenId(null)} />}
    </Shell>
  );
}

function ItemSheet({ item, onClose }: { item: Item; onClose: () => void }) {
  const updateItem = useCloset((state) => state.updateItem);
  const removeItem = useCloset((state) => state.removeItem);
  return (
    <Sheet title={item.name} onClose={onClose}>
      <div className="mb-4 flex aspect-garment max-h-80 items-center justify-center overflow-hidden rounded-md bg-tile">
        <img src={item.image} alt={item.name} className="h-full w-full object-contain p-4" />
      </div>
      <p className="text-sm text-muted">
        {item.category} · {item.color}
      </p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p>Worn {item.wearCount} {item.wearCount === 1 ? "time" : "times"}</p>
        <Button tone="outline" onClick={() => updateItem(item.id, { wearCount: item.wearCount + 1 })}>
          Wore it
        </Button>
      </div>
      <label className="mt-4 flex min-h-11 items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!item.clean}
          onChange={(event) => updateItem(item.id, { clean: !event.target.checked })}
        />
        In laundry
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={item.favorite}
          onChange={(event) => updateItem(item.id, { favorite: event.target.checked })}
        />
        Favorite
      </label>
      <button
        type="button"
        className="mt-2 min-h-11 text-sm underline underline-offset-4"
        onClick={() => {
          removeItem(item.id);
          onClose();
        }}
      >
        Delete item
      </button>
    </Sheet>
  );
}

function AddSheet({ onClose }: { onClose: () => void }) {
  const addItem = useCloset((state) => state.addItem);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("Tops");
  const [color, setColor] = useState("black");
  const [frame, setFrame] = useState<Frame>("rectangle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      const data = await shrinkImage(file);
      setPreview(data);
      setFileName(file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that photo.");
    }
    setBusy(false);
  }

  function save(event: FormEvent) {
    event.preventDefault();
    if (!preview || !name.trim()) return;
    const formality = category === "Shoes" ? 2.5 : category === "Outerwear" ? 3.8 : category === "Dresses" ? 3.5 : 3;
    addItem({
      id: crypto.randomUUID(),
      name: name.trim(),
      category,
      color,
      formality,
      weight: category === "Outerwear" ? "heavy" : "mid",
      image: preview,
      wearCount: 0,
      clean: true,
      favorite: false,
      frame: category === "Glasses" ? frame : undefined,
    });
    onClose();
  }

  return (
    <Sheet title="Add item" onClose={onClose}>
      <form className="flex flex-col gap-4" onSubmit={save}>
        <label className="flex min-h-40 cursor-pointer items-center justify-center overflow-hidden rounded-sm border border-dashed border-muted bg-bg text-sm text-muted">
          {preview ? <img src={preview} alt="Preview" className="max-h-64 w-full object-contain" /> : <span>Tap to take or choose a photo</span>}
          <input type="file" accept="image/*" className="sr-only" onChange={onFile} />
        </label>
        {fileName && <p className="text-xs text-muted">{busy ? "Preparing photo…" : fileName}</p>}
        <Field label="Name">
          <input className={inputClass} required value={name} onChange={(event) => setName(event.target.value)} placeholder="White poplin shirt" />
        </Field>
        <Field label="Category">
          <select className={inputClass} value={category} onChange={(event) => setCategory(event.target.value as Category)}>
            {CATEGORIES.map((entry) => (
              <option key={entry}>{entry}</option>
            ))}
          </select>
        </Field>
        <Field label="Main color">
          <select className={inputClass} value={color} onChange={(event) => setColor(event.target.value)}>
            {COLORS.map((entry) => (
              <option key={entry} value={entry}>
                {entry[0].toUpperCase() + entry.slice(1)}
              </option>
            ))}
          </select>
        </Field>
        {category === "Glasses" && (
          <Field label="Frame">
            <select className={inputClass} value={frame} onChange={(event) => setFrame(event.target.value as Frame)}>
              {(["rectangle", "round", "oval", "aviator"] as const).map((entry) => (
                <option key={entry} value={entry}>
                  {entry[0].toUpperCase() + entry.slice(1)}
                </option>
              ))}
            </select>
          </Field>
        )}
        {error && (
          <p className="text-sm" role="alert">
            {error}
          </p>
        )}
        <Button tone="brand" type="submit" disabled={busy || !preview}>
          Save item
        </Button>
      </form>
    </Sheet>
  );
}

function shrinkImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const max = 720;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Could not read that photo."));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that photo."));
    };
    img.src = url;
  });
}
