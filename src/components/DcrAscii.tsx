// src/components/DcrAscii.tsx
export default function DcrAscii({ className = "" }: { className?: string }) {
  return (
    <pre
      className={`inline-block text-[11px] sm:text-xs leading-[1.1] text-pure/70 ${className}`}
      style={{
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        whiteSpace: "pre",
        letterSpacing: "0",
      }}
    >{String.raw`██████╗  ██████╗██████╗
██╔══██╗██╔════╝██╔══██╗
██║  ██║██║     ██████╔╝
██║  ██║██║     ██╔══██╗
██████╔╝╚██████╗██║  ██║
╚═════╝  ╚═════╝╚═╝  ╚═╝`}</pre>
  );
}
