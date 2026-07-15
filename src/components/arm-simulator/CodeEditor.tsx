"use client";

import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";

export function CodeEditor({
  value,
  onChange,
  readOnly,
}: {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}) {
  return (
    <CodeMirror
      value={value}
      height="360px"
      extensions={[javascript()]}
      onChange={onChange}
      readOnly={readOnly}
      basicSetup={{ lineNumbers: true, foldGutter: false }}
      className="overflow-hidden rounded-lg border border-gray-300 text-sm"
    />
  );
}
