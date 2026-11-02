import React, { useLayoutEffect, useRef, useState } from "react";
import { Clipboard, Play, WrapText } from "lucide-react";
import { toast } from "sonner";

const CLOSING_FOR = {
  "(": ")",
  "[": "]",
  "{": "}",
  '"': '"',
  "'": "'",
  "`": "`",
};
const CLOSING_CHARACTERS = new Set([")", "]", "}"]);
const LANGUAGE_LABELS = {
  c: "C",
  "c++": "C++",
  python: "Python",
  java: "Java",
  javascript: "JavaScript",
};

function getCommentPrefix(language) {
  return language === "python" ? "#" : "//";
}

function replaceSelection(value, applyEdit, insert, selectionStart, selectionEnd = selectionStart) {
  const nextValue = `${value.slice(0, selectionStart)}${insert}${value.slice(selectionEnd)}`;
  applyEdit(nextValue, selectionStart + insert.length);
}

function indentSelection(textarea, value, applyEdit, outdent = false) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const selectionEnd = end > start && value[end - 1] === "\n" ? end - 1 : end;
  const lineEnd = value.indexOf("\n", selectionEnd);
  const blockEnd = lineEnd === -1 ? value.length : lineEnd;
  const block = value.slice(lineStart, blockEnd);
  const lines = block.split("\n");
  let removedBeforeSelection = 0;
  const transformed = lines.map((line, index) => {
    if (outdent) {
      const match = line.match(/^( {1,4}|\t)/);
      if (!match) return line;
      if (index === 0) removedBeforeSelection = match[0].length;
      return line.slice(match[0].length);
    }
    return `    ${line}`;
  });
  const nextBlock = transformed.join("\n");
  const nextValue = `${value.slice(0, lineStart)}${nextBlock}${value.slice(blockEnd)}`;
  const selectionOffset = outdent ? Math.max(0, start - lineStart - removedBeforeSelection) : start - lineStart + 4;
  const selectionLength = end - start + (outdent ? 0 : lines.length * 4);

  applyEdit(nextValue, lineStart + selectionOffset, lineStart + selectionOffset + selectionLength);
}

function toggleComments(textarea, value, applyEdit, language) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const selectionEnd = end > start && value[end - 1] === "\n" ? end - 1 : end;
  const lastLineBreak = value.indexOf("\n", selectionEnd);
  const blockEnd = lastLineBreak === -1 ? value.length : lastLineBreak;
  const block = value.slice(lineStart, blockEnd);
  const lines = block.split("\n");
  const commentPrefix = getCommentPrefix(language);
  const allCommented = lines.every((line) => !line.trim() || line.trimStart().startsWith(commentPrefix));
  let changedCharactersBeforeSelection = 0;

  const transformed = lines.map((line, index) => {
    if (!line.trim()) return line;
    const indentation = line.match(/^\s*/)[0];
    if (allCommented) {
      const commentStart = indentation.length;
      const removeLength = line.startsWith(`${commentPrefix} `, commentStart) ? 3 : commentPrefix.length;
      if (index === 0) changedCharactersBeforeSelection = -removeLength;
      return `${line.slice(0, commentStart)}${line.slice(commentStart + removeLength)}`;
    }
    if (index === 0) changedCharactersBeforeSelection = commentPrefix.length + 1;
    return `${indentation}${commentPrefix} ${line.slice(indentation.length)}`;
  });

  const nextBlock = transformed.join("\n");
  applyEdit(
    `${value.slice(0, lineStart)}${nextBlock}${value.slice(blockEnd)}`,
    Math.max(lineStart, start + changedCharactersBeforeSelection),
    Math.max(lineStart, end + changedCharactersBeforeSelection)
  );
}

export default function CodeEditor({ value, onChange, language, onRun, disabled = false }) {
  const textareaRef = useRef(null);
  const gutterRef = useRef(null);
  const pendingSelectionRef = useRef(null);
  const [wrapLines, setWrapLines] = useState(false);
  const [position, setPosition] = useState({ line: 1, column: 1 });
  const languageLabel = LANGUAGE_LABELS[language] || language;

  const applyEdit = (nextValue, selectionStart, selectionEnd = selectionStart) => {
    pendingSelectionRef.current = { start: selectionStart, end: selectionEnd };
    onChange(nextValue);
  };

  useLayoutEffect(() => {
    const pendingSelection = pendingSelectionRef.current;
    const textarea = textareaRef.current;
    if (!pendingSelection || !textarea) return;

    pendingSelectionRef.current = null;
    textarea.focus();
    textarea.setSelectionRange(pendingSelection.start, pendingSelection.end);
    updatePosition(textarea);
  }, [value]);

  const updatePosition = (textarea) => {
    const beforeCursor = textarea.value.slice(0, textarea.selectionStart);
    const lines = beforeCursor.split("\n");
    setPosition({ line: lines.length, column: lines[lines.length - 1].length + 1 });
  };

  const handleKeyDown = (event) => {
    const textarea = event.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.slice(start, end);

    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      onRun();
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key === "/") {
      event.preventDefault();
      toggleComments(textarea, value, applyEdit, language);
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      if (start !== end || event.shiftKey) {
        indentSelection(textarea, value, applyEdit, event.shiftKey);
      } else {
        replaceSelection(value, applyEdit, "    ", start, end);
      }
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const beforeCursor = value.slice(0, start);
      const afterCursor = value.slice(end);
      const lineStart = beforeCursor.lastIndexOf("\n") + 1;
      const currentLinePrefix = beforeCursor.slice(lineStart);
      const currentIndent = currentLinePrefix.match(/^[ \t]*/)[0];
      const previousCharacter = beforeCursor.trimEnd().slice(-1);
      const nextCharacter = afterCursor.trimStart()[0];
      const matchingClose = CLOSING_FOR[previousCharacter];
      const opensPythonBlock = language === "python" && currentLinePrefix.trimEnd().endsWith(":");
      const addIndent = matchingClose || opensPythonBlock ? "    " : "";

      if (matchingClose && nextCharacter === matchingClose) {
        const alreadyOnNewLine = currentLinePrefix.trim() === "";
        const inserted = `${alreadyOnNewLine ? "" : "\n"}${currentIndent}${addIndent}\n${currentIndent}`;
        const cursor = start + (alreadyOnNewLine ? 0 : 1) + currentIndent.length + addIndent.length;
        applyEdit(`${beforeCursor}${inserted}${afterCursor}`, cursor);
      } else {
        const inserted = `\n${currentIndent}${addIndent}`;
        replaceSelection(value, applyEdit, inserted, start, end);
      }
      return;
    }

    if (event.key === "Backspace" && start === end && start > 0) {
      const previousCharacter = value[start - 1];
      const matchingClose = CLOSING_FOR[previousCharacter];
      if (matchingClose && value[start] === matchingClose) {
        event.preventDefault();
        const nextValue = `${value.slice(0, start - 1)}${value.slice(start + 1)}`;
        applyEdit(nextValue, start - 1);
      }
      return;
    }

    if (start === end && (CLOSING_FOR[event.key] || CLOSING_CHARACTERS.has(event.key)) && event.key.length === 1) {
      const closingCharacter = CLOSING_FOR[event.key];
      if (CLOSING_CHARACTERS.has(event.key)) {
        event.preventDefault();
        if (value[start] === event.key) {
          textarea.setSelectionRange(start + 1, start + 1);
          updatePosition(textarea);
        } else {
          applyEdit(`${value.slice(0, start)}${event.key}${value.slice(end)}`, start + 1);
        }
        return;
      }

      if (closingCharacter && event.key === closingCharacter && value[start] === event.key) {
        event.preventDefault();
        textarea.setSelectionRange(start + 1, start + 1);
        updatePosition(textarea);
        return;
      }

      if (selectedText) return;
      event.preventDefault();
      const nextValue = `${value.slice(0, start)}${event.key}${closingCharacter}${value.slice(end)}`;
      applyEdit(nextValue, start + 1);
    } else if (start !== end && CLOSING_FOR[event.key] && event.key.length === 1 && event.key !== CLOSING_FOR[event.key]) {
      event.preventDefault();
      const insertion = `${event.key}${selectedText}${CLOSING_FOR[event.key]}`;
      const nextValue = `${value.slice(0, start)}${insertion}${value.slice(end)}`;
      applyEdit(nextValue, start + 1, start + 1 + selectedText.length);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Code copied to clipboard.");
    } catch {
      toast.error("Clipboard access failed. Select the code and copy it manually.");
    }
  };

  const lineCount = value.split("\n").length;

  return (
    <section
      className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-sm"
      aria-label="Code editor"
      data-testid="code-editor"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900 px-3 py-2">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
          <span className="font-medium text-slate-200">{languageLabel}</span>
          <span className="hidden text-slate-600 sm:inline">·</span>
          <span className="hidden sm:inline">4 spaces</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setWrapLines((wrapped) => !wrapped)}
            aria-pressed={wrapLines}
            className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
              wrapLines ? "bg-slate-700 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            }`}
            title="Toggle line wrapping"
            data-testid="code-editor-wrap"
          >
            <WrapText className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Wrap</span>
          </button>
          <button
            type="button"
            onClick={copyCode}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            title="Copy code"
            data-testid="code-editor-copy"
          >
            <Clipboard className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Copy</span>
          </button>
          <button
            type="button"
            onClick={onRun}
            disabled={disabled}
            className="inline-flex items-center gap-1 rounded bg-emerald-700 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            title="Run code (Ctrl+Enter)"
            data-testid="code-editor-run"
          >
            <Play className="h-3 w-3" /> Run
          </button>
        </div>
      </div>

      <div className="relative flex h-[26rem] min-h-[18rem] resize-y overflow-hidden">
        <div
          ref={gutterRef}
          aria-hidden="true"
          className="w-12 shrink-0 overflow-hidden border-r border-slate-800 bg-slate-950 py-3 text-right font-mono text-xs leading-[1.65rem] text-slate-600 select-none"
        >
          {Array.from({ length: lineCount }, (_, index) => (
            <div key={index} className="h-[1.65rem] pr-3">
              {index + 1}
            </div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          data-testid="iv-answer"
          aria-label={`${languageLabel} code editor`}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            updatePosition(event.target);
          }}
          onKeyDown={handleKeyDown}
          onClick={(event) => updatePosition(event.currentTarget)}
          onKeyUp={(event) => updatePosition(event.currentTarget)}
          onScroll={(event) => {
            if (gutterRef.current) gutterRef.current.scrollTop = event.currentTarget.scrollTop;
          }}
          placeholder="Write your solution here..."
          disabled={disabled}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          wrap={wrapLines ? "soft" : "off"}
          className={`h-full min-w-0 flex-1 resize-none overflow-auto bg-slate-950 py-3 pr-4 font-mono text-sm leading-[1.65rem] text-green-300 caret-emerald-300 outline-none placeholder:text-slate-600 focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-60 ${
            wrapLines ? "whitespace-pre-wrap break-words pl-3" : "whitespace-pre pl-3"
          }`}
        />
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 bg-slate-900 px-3 py-1.5 font-mono text-[10px] text-slate-400">
        <div className="flex items-center gap-3">
          <span>Ln {position.line}, Col {position.column}</span>
          <span>{lineCount} lines</span>
        </div>
        <div className="flex items-center gap-2" aria-label="Editor keyboard shortcuts">
          <span className="hidden sm:inline"><kbd className="rounded border border-slate-700 px-1">Tab</kbd> indent</span>
          <span><kbd className="rounded border border-slate-700 px-1">Ctrl+/</kbd> comment</span>
          <span><kbd className="rounded border border-slate-700 px-1">Ctrl+Enter</kbd> run</span>
        </div>
      </footer>
    </section>
  );
}
