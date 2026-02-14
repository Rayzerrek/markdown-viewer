import { memo } from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

const MarkdownViewer = memo(function MarkdownViewer({
  content,
  className,
}: MarkdownViewerProps) {
  return (
    <div
      className={cn(
        "max-w-none space-y-4",
        "[&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:text-foreground [&_h1]:mb-4 [&_h1]:mt-6",
        "[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mb-3 [&_h2]:mt-5",
        "[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mb-2 [&_h3]:mt-4",
        "[&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-foreground [&_h4]:mb-2 [&_h4]:mt-3",
        "[&_p]:text-foreground [&_p]:leading-relaxed [&_p]:mb-4",
        "[&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline",
        "[&_strong]:text-foreground [&_strong]:font-semibold",
        "[&_em]:italic",
        "[&_code]:text-foreground [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono",
        "[&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:mb-4",
        "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-sm",
        "[&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-4",
        "[&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-4",
        "[&_li]:text-foreground [&_li]:mb-1",
        "[&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:mb-4",
        "[&_hr]:border-border [&_hr]:my-6",
        "[&_table]:w-full [&_table]:border-collapse [&_table]:mb-4",
        "[&_th]:border [&_th]:border-border [&_th]:p-2 [&_th]:bg-muted [&_th]:text-left [&_th]:font-semibold",
        "[&_td]:border [&_td]:border-border [&_td]:p-2",
        "[&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-4",
        "[&_input[type=checkbox]]:mr-2",
        className
      )}
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
});

export { MarkdownViewer };
