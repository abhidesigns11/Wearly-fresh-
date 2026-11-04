import { useState } from "react";
import { ArrowRight, Check, Shirt, Sparkles, Palette, ChevronLeft } from "lucide-react";
import { FACES, SKIN_TONES } from "@/lib/engine";
import { useCloset } from "@/lib/store";
import type { Face, Gender, Undertone } from "@/lib/types";
import { Button, Chip } from "./ui";

export function Onboarding() {
  const finish = useCloset((state) => state.finishOnboarding);
  const [step, setStep] = useState(0);
  const [tourIndex, setTourIndex] = useState(0);
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender>("women");
  const [skin, setSkin] = useState<string>(SKIN_TONES[2].hex);
  const [undertone, setUndertone] = useState<Undertone>("warm");
  const [face, setFace] = useState<Face>("oval");

  return (
    <main className="grid min-h-dvh bg-bg text-ink lg:grid-cols-[1.1fr_1fr]">
      <aside className="hidden items-center justify-center bg-tile p-12 lg:flex">
        <img src="/brand/logo-lockup.webp" alt="" className="brand-logo w-full max-w-md" />
      </aside>
      <section className="mx-auto flex w-full max-w-md flex-col justify-center gap-6 px-6 py-12">
        <img src="/brand/logo-mark.webp" alt="Wearly" className="brand-logo h-16 w-auto lg:hidden" />
        {step === 0 && (
          <>
            <h1 className="font-display text-4xl font-semibold">Know what to wear, every day.</h1>
            <p className="text-muted">
              Add your clothes once. Wearly builds outfits that suit your colors, the day, and the occasion — from your closet, not a catalog.
            </p>
            <Button tone="brand" className="w-full" onClick={() => setStep(1)}>
              Get started
            </Button>
          </>
        )}
        {step === 1 && (
          <FeatureTour index={tourIndex} onNext={() => tourIndex < 2 ? setTourIndex(tourIndex + 1) : setStep(2)} onBack={() => tourIndex > 0 ? setTourIndex(tourIndex - 1) : setStep(0)} />
        )}
        {step === 2 && (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Your profile · 1 of 3</p>
            <h1 className="font-display text-4xl font-semibold">What should we call you?</h1>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              First name
              <input
                className="min-h-11 rounded-md border border-line bg-surface px-3 text-base font-normal"
                value={name}
                autoFocus
                onChange={(event) => setName(event.target.value)}
                placeholder="Maya"
              />
            </label>
            <div className="flex gap-2" role="group" aria-label="Wardrobe focus">
              {(["women", "men"] as const).map((value) => (
                <Chip key={value} pressed={gender === value} onClick={() => setGender(value)}>
                  {value === "women" ? "Women" : "Men"}
                </Chip>
              ))}
            </div>
            <p className="text-sm text-muted">Used for how looks are described. The closet itself stays yours to fill.</p>
            <Button tone="brand" className="w-full" disabled={name.trim().length < 2} onClick={() => setStep(3)}>
              Continue
            </Button>
          </>
        )}
        {step === 3 && (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Your profile · 2 of 3</p>
            <h1 className="font-display text-4xl font-semibold">Your colors</h1>
            <p className="text-muted">Skin tone sets the model. Undertone decides which colors sit well next to your face.</p>
            <div className="flex flex-wrap gap-3" role="group" aria-label="Skin tone">
              {SKIN_TONES.map((tone) => (
                <button
                  key={tone.hex}
                  type="button"
                  aria-label={tone.name}
                  aria-pressed={skin === tone.hex}
                  onClick={() => setSkin(tone.hex)}
                  className={`size-11 rounded-full border-2 border-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                    skin === tone.hex ? "outline-2 outline-ink" : "outline outline-line"
                  }`}
                  style={{ background: tone.hex }}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Undertone">
              {(["warm", "cool", "neutral"] as const).map((value) => (
                <Chip key={value} pressed={undertone === value} onClick={() => setUndertone(value)}>
                  {value[0].toUpperCase() + value.slice(1)}
                </Chip>
              ))}
            </div>
            <Button tone="brand" className="w-full" onClick={() => setStep(4)}>
              Continue
            </Button>
          </>
        )}
        {step === 4 && (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Your profile · 3 of 3</p>
            <h1 className="font-display text-4xl font-semibold">Face shape</h1>
            <p className="text-muted">This is how Wearly chooses glasses. You can change it later.</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Face shape">
              {FACES.map((entry) => (
                <Chip key={entry.id} pressed={face === entry.id} onClick={() => setFace(entry.id)}>
                  {entry.label}
                </Chip>
              ))}
            </div>
            <p className="text-sm text-muted">{FACES.find((entry) => entry.id === face)?.line}</p>
            <Button
              tone="brand"
              className="w-full"
              onClick={() => finish({ name: name.trim(), gender, skin, undertone, face })}
            >
              Open my closet
            </Button>
          </>
        )}
      </section>
    </main>
  );
}


const TOUR = [
  { icon: Shirt, eyebrow: "01 / Your closet", title: "Start with what you own.", body: "Photograph your clothes and build a digital wardrobe. Mark favourites, track wears and keep laundry status up to date.", points: ["Add pieces in seconds", "Find items by category or colour"] },
  { icon: Sparkles, eyebrow: "02 / Outfit Studio", title: "Make getting dressed easier.", body: "Build outfit combinations for your plans and weather. Check colour balance and see whether a new purchase fills a real gap.", points: ["Create and refine looks", "Check outfits before you head out"] },
  { icon: Palette, eyebrow: "03 / Your style", title: "Make it feel like you.", body: "Explore colours, glasses and accessories that work with your preferences. Save outfits, keep a streak and share inspiration.", points: ["Personal colour guidance", "Community ideas and saved looks"] },
];

function FeatureTour({ index, onNext, onBack }: { index: number; onNext: () => void; onBack: () => void }) {
  const feature = TOUR[index];
  const Icon = feature.icon;
  return (
    <div className="flex flex-col">
      <div className="mb-7 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">A quick tour</span>
        <span className="text-xs tabular-nums text-muted">{index + 1} / 3</span>
      </div>
      <div className="mb-7 flex aspect-[5/3] items-center justify-center overflow-hidden rounded-2xl border border-line bg-tile">
        <div className="relative flex size-40 items-center justify-center rounded-full border border-brand/20 bg-surface">
          <div className="absolute inset-4 rounded-full border border-line" />
          <Icon className="size-16 text-brand" strokeWidth={1.25} />
          <span className="absolute -right-2 top-5 flex size-9 items-center justify-center rounded-full bg-brand text-on-brand"><Check size={16}/></span>
        </div>
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{feature.eyebrow}</p>
      <h1 className="mt-2 font-display text-4xl font-semibold leading-tight">{feature.title}</h1>
      <p className="mt-3 text-sm leading-6 text-muted">{feature.body}</p>
      <ul className="mt-5 space-y-2">
        {feature.points.map((point) => <li key={point} className="flex items-center gap-2 text-sm"><Check className="size-4 text-brand"/>{point}</li>)}
      </ul>
      <div className="mt-8 flex items-center justify-between">
        <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center gap-1 text-sm text-muted"><ChevronLeft size={16}/> Back</button>
        <div className="flex items-center gap-1.5">{TOUR.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-brand" : "w-1.5 bg-line"}`} />)}</div>
        <Button tone="brand" onClick={onNext}>{index === 2 ? "Set up profile" : "Next"} <ArrowRight size={16}/></Button>
      </div>
    </div>
  );
}
