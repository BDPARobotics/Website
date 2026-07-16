import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Shared markdown renderer for tutor chat messages and module text blocks.
// Sizes are relative (em) so it inherits the wrapper's text size.
export function Markdown({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: (props) => <p className="mb-2 leading-relaxed last:mb-0" {...props} />,
        ul: (props) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0" {...props} />,
        ol: (props) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0" {...props} />,
        li: (props) => <li className="leading-relaxed" {...props} />,
        h1: (props) => <p className="mb-2 text-[1.25em] font-semibold" {...props} />,
        h2: (props) => <p className="mb-2 text-[1.15em] font-semibold" {...props} />,
        h3: (props) => <p className="mb-2 text-[1.05em] font-semibold" {...props} />,
        h4: (props) => <p className="mb-2 font-semibold" {...props} />,
        a: (props) => (
          <a className="text-primary underline" target="_blank" rel="noreferrer" {...props} />
        ),
        blockquote: (props) => (
          <blockquote className="mb-2 border-l-2 border-gray-300 pl-3 text-gray-500" {...props} />
        ),
        pre: (props) => (
          <pre
            className="mb-2 overflow-x-auto rounded-lg bg-gray-900 p-3 text-[0.85em] leading-relaxed text-gray-100 last:mb-0 [&_code]:rounded-none [&_code]:bg-transparent [&_code]:p-0"
            {...props}
          />
        ),
        code: (props) => (
          <code className="rounded bg-gray-200/70 px-1 py-0.5 font-mono text-[0.85em]" {...props} />
        ),
        table: (props) => (
          <div className="mb-2 overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-[0.85em]" {...props} />
          </div>
        ),
        th: (props) => <th className="border-b border-gray-300 px-2 py-1 font-semibold" {...props} />,
        td: (props) => <td className="border-b border-gray-100 px-2 py-1" {...props} />,
      }}
    >
      {text}
    </ReactMarkdown>
  );
}
