import { draftMode } from "next/headers";
import { LivePreviewListener } from "./LivePreviewListener";
import { queryRoutedContentByPath } from "./queries";
import { hasRenderableCMSContent, RenderRoutedContent } from "./RenderRoutedContent";

export async function CMSRoute({
  path,
  children,
}: {
  path: string;
  children: React.ReactNode;
}) {
  const draft = await draftMode()
    .then((d) => d.isEnabled)
    .catch(() => false);
  const [routed] = await Promise.all([
    queryRoutedContentByPath(path, { draft }),
  ]);

  if (!routed) {
    return (
      <>
        {draft ? <LivePreviewListener /> : null}
        {children}
      </>
    );
  }

  if (!hasRenderableCMSContent(routed.doc) && !draft) {
    return children;
  }

  if (!hasRenderableCMSContent(routed.doc)) {
    return (
      <>
        {draft ? <LivePreviewListener /> : null}
        {children}
      </>
    );
  }

  return (
    <>
      {draft ? <LivePreviewListener /> : null}
      <RenderRoutedContent doc={routed.doc} collection={routed.collection} />
    </>
  );
}
