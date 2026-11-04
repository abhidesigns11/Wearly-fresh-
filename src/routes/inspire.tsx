import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bookmark, Heart, MessageCircle, Plus, Send, Shirt, Sparkles } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { LookBoard } from "@/components/look-board";
import { Shell } from "@/components/shell";
import { Button, Chip, inputClass } from "@/components/ui";
import { Sheet } from "@/components/sheet";
import { slotOf } from "@/lib/engine";
import { useCloset } from "@/lib/store";
import type { CommunityPost, Part } from "@/lib/types";

export const Route = createFileRoute("/inspire")({ component: CommunityPage });

function CommunityPage() {
  return <Shell><CommunityBody /></Shell>;
}

function CommunityBody() {
  const profile = useCloset((state) => state.profile);
  const items = useCloset((state) => state.items);
  const posts = useCloset((state) => state.posts);
  const createPost = useCloset((state) => state.createPost);
  const togglePostLike = useCloset((state) => state.togglePostLike);
  const togglePostSave = useCloset((state) => state.togglePostSave);
  const addPostComment = useCloset((state) => state.addPostComment);
  const [tab, setTab] = useState("For you");
  const [composerOpen, setComposerOpen] = useState(false);
  const [activeComment, setActiveComment] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [notice, setNotice] = useState("");

  const feed = useMemo(() => {
    const sorted = [...posts].sort((a, b) => b.createdAt - a.createdAt);
    if (tab === "Saved") return sorted.filter((post) => post.saved);
    if (tab === "Following") return sorted.filter((post) => post.featured || post.author === profile.name);
    return sorted;
  }, [posts, tab, profile.name]);

  function partsFor(ids: string[]): Part[] {
    return ids.flatMap((id) => {
      const item = items.find((entry) => entry.id === id);
      return item ? [{ ...item, slot: slotOf(item.category) }] : [];
    });
  }

  function submitComment(event: FormEvent, post: CommunityPost) {
    event.preventDefault();
    const text = commentDraft.trim();
    if (!text) return;
    addPostComment(post.id, text, profile.name || "You");
    setCommentDraft("");
    setActiveComment(null);
  }

  function sharePost(post: CommunityPost) {
    const shareText = `${post.caption}\n\nShared with Wearly — your personal style companion.`;
    if (navigator.share) {
      void navigator.share({ title: "Wearly outfit", text: shareText }).catch(() => undefined);
    } else if (navigator.clipboard) {
      void navigator.clipboard.writeText(shareText).then(() => setNotice("Post caption copied to clipboard."));
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Wearly community</p>
          <h1 className="mt-2 font-display text-4xl font-semibold">Style, shared.</h1>
          <p className="mt-2 max-w-lg text-muted">Real outfits, fresh ideas and little details worth saving.</p>
        </div>
        <Button tone="brand" onClick={() => setComposerOpen(true)}><Plus className="size-4" /> Create post</Button>
      </div>

      <div className="mt-7 flex items-center gap-3 rounded-md border border-line bg-surface p-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-tile font-display font-semibold">{(profile.name || "W").slice(0, 1).toUpperCase()}</div>
        <button className="min-h-11 flex-1 rounded-full bg-bg px-4 text-left text-sm text-muted" onClick={() => setComposerOpen(true)}>Share what you're wearing today…</button>
        <button aria-label="Create post" onClick={() => setComposerOpen(true)} className="flex size-11 items-center justify-center rounded-full text-brand"><Plus className="size-5" /></button>
      </div>

      <div className="chips mt-6 flex gap-2 overflow-x-auto pb-1" aria-label="Feed filters">
        {["For you", "Following", "Saved"].map((name) => <Chip key={name} pressed={tab === name} onClick={() => setTab(name)}>{name}</Chip>)}
      </div>

      {notice && <p className="mt-3 text-sm text-muted" role="status">{notice}</p>}

      <div className="mt-5 space-y-7">
        {feed.map((post) => {
          const parts = partsFor(post.itemIds);
          return (
            <article key={post.id} className="overflow-hidden rounded-lg border border-line bg-surface">
              <header className="flex items-center gap-3 px-4 py-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-tile font-display text-sm font-semibold">{post.author.slice(0, 1)}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{post.author}</p>
                  <p className="text-xs text-muted">{post.handle} · {post.occasion}</p>
                </div>
                {post.featured && <span className="rounded-full bg-tile px-3 py-1 text-xs text-muted">Wearly pick</span>}
              </header>
              <div className="px-3 pb-3">
                {parts.length > 0 ? <LookBoard parts={parts} label={`${post.author}'s outfit`} /> : <div className="rounded-md bg-tile p-8 text-center text-sm text-muted">Some wardrobe pieces are no longer available.</div>}
              </div>
              <div className="px-4 pb-4">
                <p className="text-sm leading-relaxed">{post.caption}</p>
                <div className="mt-4 flex items-center gap-5 border-t border-line pt-3">
                  <button onClick={() => togglePostLike(post.id)} aria-pressed={post.liked} className={`inline-flex min-h-11 items-center gap-2 text-sm ${post.liked ? "font-semibold text-brand" : "text-ink"}`}>
                    <Heart className={`size-5 ${post.liked ? "fill-current" : ""}`} /> {post.likes}
                  </button>
                  <button onClick={() => setActiveComment(activeComment === post.id ? null : post.id)} className="inline-flex min-h-11 items-center gap-2 text-sm text-ink">
                    <MessageCircle className="size-5" /> {post.comments.length}
                  </button>
                  <button onClick={() => togglePostSave(post.id)} aria-pressed={post.saved} className={`ml-auto inline-flex min-h-11 items-center gap-2 text-sm ${post.saved ? "font-semibold text-brand" : "text-ink"}`}>
                    <Bookmark className={`size-5 ${post.saved ? "fill-current" : ""}`} /> {post.saved ? "Saved" : "Save"}
                  </button>
                  <button aria-label="Share post" onClick={() => sharePost(post)} className="flex size-11 items-center justify-center text-ink"><Send className="size-5" /></button>
                </div>
                {post.comments.length > 0 && <div className="space-y-2 border-t border-line pt-3">{post.comments.slice(-2).map((comment) => <p key={comment.id} className="text-sm"><span className="font-semibold">{comment.author}</span> <span className="text-muted">{comment.text}</span></p>)}</div>}
                {activeComment === post.id && <form onSubmit={(event) => submitComment(event, post)} className="mt-3 flex gap-2"><input autoFocus value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} placeholder="Add a thoughtful comment…" className={`${inputClass} min-w-0 rounded-full`} /><Button tone="ink" type="submit" disabled={!commentDraft.trim()}>Send</Button></form>}
              </div>
            </article>
          );
        })}
        {feed.length === 0 && <div className="rounded-lg border border-dashed border-line px-6 py-12 text-center"><Bookmark className="mx-auto size-6 text-muted" /><h2 className="mt-3 font-display text-xl font-semibold">Nothing saved here yet</h2><p className="mt-1 text-sm text-muted">Save an outfit from the feed and it will be waiting here.</p></div>}
      </div>
      <p className="mt-8 text-center text-xs text-muted">Preview mode: posts, likes and comments are stored on this device. Shared community accounts will be connected in a later phase.</p>
      {composerOpen && <CreatePostSheet onClose={() => setComposerOpen(false)} onCreate={createPost} />}
    </div>
  );
}

function CreatePostSheet({ onClose, onCreate }: { onClose: () => void; onCreate: (post: CommunityPost) => void }) {
  const profile = useCloset((state) => state.profile);
  const items = useCloset((state) => state.items);
  const [selected, setSelected] = useState<string[]>(items.filter((item) => item.favorite).slice(0, 4).map((item) => item.id));
  const [caption, setCaption] = useState("");
  const [occasion, setOccasion] = useState("Everyday style");
  const [error, setError] = useState("");

  function toggle(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((entry) => entry !== id) : current.length < 6 ? [...current, id] : current);
  }

  function publish(event: FormEvent) {
    event.preventDefault();
    if (selected.length < 2) { setError("Choose at least two pieces to share an outfit."); return; }
    if (!caption.trim()) { setError("Add a short caption before sharing."); return; }
    onCreate({
      id: crypto.randomUUID(), author: profile.name || "You", handle: "@yourstyle", caption: caption.trim(), occasion,
      itemIds: selected, createdAt: Date.now(), likes: 0, liked: false, saved: false, comments: [],
    });
    onClose();
  }

  return (
    <Sheet title="Share an outfit" onClose={onClose}>
      <form onSubmit={publish} className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm text-muted"><Shirt className="size-4" /> Choose pieces from your wardrobe</div>
        <div className="grid grid-cols-3 gap-2">
          {items.map((item) => {
            const active = selected.includes(item.id);
            return <button key={item.id} type="button" aria-pressed={active} onClick={() => toggle(item.id)} className={`overflow-hidden rounded-md border text-left ${active ? "border-brand bg-tile" : "border-line bg-surface"}`}>
              <span className="flex aspect-square items-center justify-center bg-bg p-2"><img src={item.image} alt="" className="h-full w-full object-contain" /></span>
              <span className="block truncate px-2 py-2 text-xs font-medium">{item.name}</span>
            </button>;
          })}
        </div>
        <label className="flex flex-col gap-2 text-sm font-semibold">Occasion
          <select value={occasion} onChange={(event) => setOccasion(event.target.value)} className={inputClass}><option>Everyday style</option><option>College</option><option>Office</option><option>Date night</option><option>Weekend</option><option>Party</option></select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold">Your caption
          <textarea value={caption} onChange={(event) => setCaption(event.target.value)} rows={3} maxLength={240} placeholder="What makes this outfit work for you?" className={`${inputClass} resize-none py-3`} />
        </label>
        {error && <p className="text-sm text-muted" role="alert">{error}</p>}
        <Button tone="brand" type="submit"><Sparkles className="size-4" /> Publish post</Button>
        <p className="text-xs text-muted">This prototype saves your post on this device. Public posting will be enabled with user accounts.</p>
      </form>
    </Sheet>
  );
}
