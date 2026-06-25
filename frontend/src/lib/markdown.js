// Lightweight markdown renderer using basic regex (no extra deps)
import React from "react";

function renderInline(text) {
  // bold
  let parts = [];
  const regex = /(\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0, m, i = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[2]) parts.push(<strong key={i++}>{m[2]}</strong>);
    else if (m[3]) parts.push(<code key={i++}>{m[3]}</code>);
    else if (m[4]) parts.push(<a key={i++} href={m[5]} target="_blank" rel="noreferrer" className="text-orange-600 underline">{m[4]}</a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export default function ReactMarkdown({ children }) {
  const md = children || "";
  const lines = md.split("\n");
  const blocks = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (/^#{1,6}\s/.test(line)) {
      const level = line.match(/^#+/)[0].length;
      const Tag = `h${Math.min(level, 4)}`;
      blocks.push(<Tag key={key++}>{renderInline(line.replace(/^#+\s/, ""))}</Tag>);
      i++;
    } else if (/^[-*]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        items.push(<li key={key++}>{renderInline(lines[i].replace(/^[-*]\s/, ""))}</li>);
        i++;
      }
      blocks.push(<ul key={key++}>{items}</ul>);
    } else if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(<li key={key++}>{renderInline(lines[i].replace(/^\d+\.\s/, ""))}</li>);
        i++;
      }
      blocks.push(<ol key={key++}>{items}</ol>);
    } else if (line.trim() === "") {
      i++;
    } else {
      // paragraph (may span multiple lines until empty)
      const buf = [line];
      i++;
      while (i < lines.length && lines[i].trim() !== "" && !/^(#{1,6}\s|[-*]\s|\d+\.\s)/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      blocks.push(<p key={key++}>{renderInline(buf.join(" "))}</p>);
    }
  }
  return <>{blocks}</>;
}
