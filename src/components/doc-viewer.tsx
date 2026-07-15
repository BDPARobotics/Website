const OFFICE_RE = /\.(pptx?|docx?|xlsx?)(?:$|\?)/i;

// Inline document viewer: browsers render PDFs natively in an iframe;
// Office files (PowerPoint decks etc.) go through Microsoft's embed viewer,
// which works because our uploaded URLs are publicly fetchable.
export function DocViewer({ url, title }: { url: string; title?: string }) {
  const isOffice = OFFICE_RE.test(decodeURIComponent(url));
  const src = isOffice
    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`
    : url;

  return (
    <div>
      <iframe
        src={src}
        title={title ?? "Document"}
        className="h-[600px] w-full rounded-lg border border-gray-200 bg-white"
        allowFullScreen
      />
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
      >
        Open in new tab ↗
      </a>
    </div>
  );
}
