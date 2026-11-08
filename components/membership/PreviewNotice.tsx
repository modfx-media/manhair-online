export function PreviewNotice() {
  if (process.env.VERCEL_ENV !== "preview") return null;
  return (
    <p role="status" className="rounded-md border border-copper-500 bg-ink-100 px-4 py-3 text-sm leading-6 text-ink-900">
      Review preview. This is not www.manhaironline.com. A membership signup on this preview is not a real charge, and no customer or staff message is sent from here.
    </p>
  );
}
