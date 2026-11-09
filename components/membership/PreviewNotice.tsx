export function PreviewNotice() {
  if (process.env.VERCEL_ENV !== "preview") return null;
  return (
    <p role="status" className="rounded-md border border-copper-500 bg-ink-100 px-4 py-3 text-sm leading-6 text-ink-900">
      Review preview. This is not www.manhaironline.com. A signup here is a test payment, not a live customer charge. Emails send when this preview’s email settings are turned on.
    </p>
  );
}
