import type { ContentBlock } from "@/lib/types";

export function ModuleContent({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((block, i) => (
        <ContentBlockView key={i} block={block} />
      ))}
    </div>
  );
}

function ContentBlockView({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "text":
      return (
        <div className="space-y-3 text-[#233242]">
          {block.content.split("\n\n").map((paragraph, i) => (
            <p key={i} className="leading-relaxed whitespace-pre-line">
              {paragraph}
            </p>
          ))}
        </div>
      );
    case "code":
      return (
        <div>
          {block.language && (
            <div className="rounded-t-md bg-gray-800 px-4 py-1 text-xs text-gray-300">
              {block.language}
            </div>
          )}
          <pre
            className={`overflow-x-auto bg-gray-900 p-4 text-sm text-gray-100 ${block.language ? "rounded-b-md" : "rounded-md"}`}
          >
            <code>{block.content}</code>
          </pre>
        </div>
      );
    case "image":
      // eslint-disable-next-line @next/next/no-img-element -- admin-authored arbitrary external URLs, not a fixed set of domains
      return <img src={block.url} alt={block.alt ?? ""} className="w-full rounded-lg" />;
    case "video":
      return <video src={block.url} controls className="w-full rounded-lg" />;
    case "pdf":
      return (
        <a
          href={block.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-primary hover:border-primary"
        >
          Open PDF
        </a>
      );
    default:
      return null;
  }
}
