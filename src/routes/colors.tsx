import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { Chip } from "@/components/ui";
import { FACES, frameAdvice, paletteFor, SKIN_TONES } from "@/lib/engine";
import { useCloset } from "@/lib/store";
import type { Face, Undertone } from "@/lib/types";

export const Route = createFileRoute("/colors")({ component: ColorsPage });

function ColorsPage() {
  return (
    <Shell>
      <ColorsBody />
    </Shell>
  );
}

function ColorsBody() {
  const profile = useCloset((state) => state.profile);
  const setProfile = useCloset((state) => state.setProfile);
  const palette = paletteFor(profile.undertone);
  const face = frameAdvice(profile.face);
  const skinName = SKIN_TONES.find((tone) => tone.hex === profile.skin)?.name ?? "Custom";

  return (
    <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
      <section>
        <p className="text-sm text-muted">Skin tone and color match</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">Colors that sit well on you.</h1>
        <p className="mt-3 max-w-md text-muted">
          {skinName} skin, {profile.undertone} undertone. Wearly uses this when it scores a top, a dress, or a coat — the pieces closest to your face.
        </p>
        <h2 className="mt-8 font-display text-2xl font-semibold">Skin</h2>
        <div className="mt-3 flex flex-wrap gap-3" role="group" aria-label="Skin tone">
          {SKIN_TONES.map((tone) => (
            <button
              key={tone.hex}
              type="button"
              aria-label={tone.name}
              aria-pressed={profile.skin === tone.hex}
              onClick={() => setProfile({ skin: tone.hex })}
              className={`size-11 rounded-full border-2 border-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                profile.skin === tone.hex ? "outline-2 outline-ink" : "outline outline-line"
              }`}
              style={{ background: tone.hex }}
            />
          ))}
        </div>
        <h2 className="mt-8 font-display text-2xl font-semibold">Undertone</h2>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Undertone">
          {(["warm", "cool", "neutral"] as const).map((value) => (
            <Chip key={value} pressed={profile.undertone === value} onClick={() => setProfile({ undertone: value as Undertone })}>
              {value[0].toUpperCase() + value.slice(1)}
            </Chip>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted">{palette.metal}</p>
      </section>

      <section className="flex flex-col gap-8">
        <div>
          <h2 className="font-display text-2xl font-semibold">Wear</h2>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {palette.wear.map((swatch) => (
              <li key={swatch.name} className="flex items-center gap-3 py-3">
                <span className="size-8 rounded-full outline outline-line" style={{ background: swatch.hex }} />
                <span className="font-medium">{swatch.name}</span>
              </li>
            ))}
          </ul>
        </div>
        {palette.skip.length > 0 && (
          <div>
            <h2 className="font-display text-2xl font-semibold">Leave these off the face</h2>
            <ul className="mt-3 flex flex-wrap gap-4">
              {palette.skip.map((swatch) => (
                <li key={swatch.name} className="flex items-center gap-2 text-sm text-muted">
                  <span className="size-4 rounded-full outline outline-line" style={{ background: swatch.hex }} />
                  {swatch.name}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <h2 className="font-display text-2xl font-semibold">Glasses</h2>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Face shape">
            {FACES.map((entry) => (
              <Chip key={entry.id} pressed={profile.face === entry.id} onClick={() => setProfile({ face: entry.id as Face })}>
                {entry.label}
              </Chip>
            ))}
          </div>
          <p className="mt-4 text-sm">{face.line}</p>
          <p className="mt-2 text-sm text-muted">
            Best frames: {face.frames.join(", ")}. Add a pair under Glasses in your wardrobe and the stylist will keep a match, or skip a frame that fights your face.
          </p>
        </div>
      </section>
    </div>
  );
}
