import type { ReactNode } from "react";

function inline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyPrefix}-i${i}`;
    if (token.startsWith("**")) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`")) {
      nodes.push(<code key={key}>{token.slice(1, -1)}</code>);
    } else {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    }
    last = match.index + token.length;
    i += 1;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

/** Small dependency-free markdown renderer for study notes. */
export function Markdown({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  let listOrdered = false;
  let paragraph: string[] = [];
  let key = 0;

  const flushList = () => {
    if (!list.length) return;
    const items = list.map((item, index) => <li key={index}>{inline(item, `l${key}-${index}`)}</li>);
    blocks.push(
      listOrdered ? (
        <ol key={`ol-${key}`}>{items}</ol>
      ) : (
        <ul key={`ul-${key}`}>{items}</ul>
      ),
    );
    key += 1;
    list = [];
  };

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const textBlock = paragraph.join(" ");
    blocks.push(<p key={`p-${key}`}>{inline(textBlock, `p${key}`)}</p>);
    key += 1;
    paragraph = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushList();
      flushParagraph();
      continue;
    }
    if (line.startsWith("### ")) {
      flushList();
      flushParagraph();
      blocks.push(<h3 key={`h-${key}`}>{inline(line.slice(4), `h${key}`)}</h3>);
      key += 1;
      continue;
    }
    if (line.startsWith("## ")) {
      flushList();
      flushParagraph();
      blocks.push(<h2 key={`h-${key}`}>{inline(line.slice(3), `h${key}`)}</h2>);
      key += 1;
      continue;
    }
    if (line.startsWith("# ")) {
      flushList();
      flushParagraph();
      blocks.push(<h1 key={`h-${key}`}>{inline(line.slice(2), `h${key}`)}</h1>);
      key += 1;
      continue;
    }
    if (line.startsWith("> ")) {
      flushList();
      flushParagraph();
      blocks.push(<blockquote key={`q-${key}`}>{inline(line.slice(2), `q${key}`)}</blockquote>);
      key += 1;
      continue;
    }
    const ordered = /^\d+\.\s+/.test(line);
    const bullet = /^[-*]\s+/.test(line);
    if (ordered || bullet) {
      flushParagraph();
      if (list.length && listOrdered !== ordered) flushList();
      listOrdered = ordered;
      list.push(line.replace(/^(\d+\.|[-*])\s+/, ""));
      continue;
    }
    flushList();
    paragraph.push(line);
  }
  flushList();
  flushParagraph();

  return <div className="prose-note">{blocks}</div>;
}
