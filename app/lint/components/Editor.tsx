
import { useEffect, useMemo, useRef, useState } from "react";
import Tooltip from "./Tooltip";


type Severity = "error" | "warning" | "info";

export type Issue = {
    id: string;
    start: number;
    end: number;
    message: string;
    severity: Severity;
    category?: string;
};

type Proprs = {
    value: string;
    onChange: (v: string) => void;
    issues: Issue[];
    onInspect?: (issue: Issue) => void;
    debounceMs?: number;

    onLint?: (text: string) => void;
    lintOnEnter?: boolean;
    lintOnPause?: boolean;
    lintPauseDelayMs?: number;
}


function Editor ({
    value,
    onChange,
    issues,
    onInspect,
    debounceMs = 350,
    onLint,
    lintOnEnter = true,
    // lintOnPause = false,
    // lintPauseDelayMs = 1000,
}: Proprs) {
    const taRef = useRef<HTMLTextAreaElement | null>(null);
    const overlayRef = useRef<HTMLDivElement | null>(null);
    const [localValue, setLocalValue] =  useState(value);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [tooltip, setTooltip] = useState<{
        issue: Issue;
        target: HTMLElement | null;
    } | null>(null);
    const debounceTimer = useRef<number | null>(null);
    // const lintTimer = useRef<number | null>(null);

    useEffect(() => { setLocalValue(value); }, [value]);

    useEffect(() => {
        const ta = taRef.current;
        const ov = overlayRef.current;
        if (!ta || !ov) return;

        const onScroll = () => {
            ov.scrollTop = ta.scrollTop;
            ov.scrollLeft = ta.scrollLeft;
        };

        ta.addEventListener("scroll", onScroll);
        return () => {
            ta.removeEventListener("scroll", onScroll);
        };
    }, []);

    useEffect(() => {
        if (!onLint || !lintOnEnter) return;

        const ta = taRef.current;
        if (!ta) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Enter" && !( e.shiftKey || e.ctrlKey || e.altKey || e.metaKey )) {
                const text = ta.value;
                const cursorPosition = ta.selectionStart;

                const textBeforeCursor = text.slice(0, cursorPosition).trim();
                if (textBeforeCursor) {
                    onLint(textBeforeCursor);
                }
            }
        };
        ta.addEventListener("keydown", handleKeyDown);
        return () => {
            ta.removeEventListener("keydown", handleKeyDown);
        };
    }, [onLint, lintOnEnter]);


    const schedulePropagate = (v: string) => {
        if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
        debounceTimer.current = window.setTimeout(() => {
            onChange(v);
            debounceTimer.current = null;
        }, debounceMs) as unknown as number;
    }

    const onInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const v = e.target.value;
        setLocalValue(v);
        schedulePropagate(v);
    };

    // const escapeHtml = (s: string) => 
    //     s
    //         .replace(/&/g, "&amp;")
    //         .replace(/</g, "&lt;")
    //         .replace(/>/g, "&gt;")
    //         .replace(/"/g, "&quot;")
    //         .replace(/'/g, "&#039;")
    //         .replace(/\n/g, "\n");
    

    const normalized = useMemo(() => {
        if (!issues || issues.length === 0) return [] as Issue[];

        const sorted = [...issues].sort((a, b) => a.start - b.start);

        const out: Issue[] = [];
        for (const it of sorted) {
            if (out.length === 0) {
                out.push({...it});
                continue;
            }
            const last = out[out.length - 1];
            if (it.start >= last.end) {
                out.push({...it});
                continue
            }

            const merged: Issue = {
                id: '${last.id}__${it.id}',
                start: Math.min(last.start, it.start),
                end: Math.max(last.end, it.end),
                message: last.message + "; " + it.message,
                severity: severityPriority(last.severity, it.severity),
            };
            out[out.length - 1] = merged;
        }
        return out;
    }, [issues]);

    const segments = useMemo(() => {
        const segs: { text: string; issue?: Issue; start?: number; end?: number; }[] = [];
        if (!normalized.length) {
            segs.push({
                text: localValue
            });
            return segs;
        }

        let cursor = 0;
        for (const issue of normalized) {
            if (cursor < issue.start) {
                segs.push({
                    text: localValue.slice(cursor, issue.end),
                });
            }
            segs.push({
                text: localValue.slice(issue.start, issue.end),
                issue,
                start: issue.start,
                end: issue.end,
            });
            cursor = issue.end;
        }

        if (cursor < localValue.length) {
            segs.push({
                text: localValue.slice(cursor),
            });
        }
        return segs;
    }, [localValue, normalized]);

    const onOverlayMouseOver = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement | null;
        if (!target) return;
        const id = target.getAttribute("data-issue-id");
        setHoveredId(id);
    };

    const onOverlayMouseOut = (e: React.MouseEvent) => {
        const related = e.relatedTarget as HTMLElement | null;
        if (related && related.getAttribute && related.getAttribute("data-issue-id")) return;
        setHoveredId(null);
    };

    const onIssueClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement | null;
        if (!target) return;
        const startAttr = target.getAttribute("data-start");
        const endAttr = target.getAttribute("data-end");
        const id = target.getAttribute("data-issue-id");
        if (!startAttr || !endAttr || !id) return;
        const start = parseInt(startAttr, 10);
        const end = parseInt(endAttr, 10);

        const ta = taRef.current;
        if (ta) {
            ta.focus();
            ta.setSelectionRange(start, end);
        }

        const issue = normalized.find((it) => it.id === id);
        if (issue) {
            if (onInspect) onInspect(issue);
            setTooltip({
                issue,
                target,
            });
        }
    };

    const textStyles = "font-mono text-base leading-6 whitespace-pre-wrap break-words";

    return (
        <div className="w-full h-full relative">
            <div className="relative w-full h-full">
                {/* Textarea - невидимый, но с курсором */}
                <textarea
                    ref={taRef}
                    className={`absolute inset-0 w-full h-full resize-none bg-transparent text-transparent caret-foreground z-20 p-4 border border-border rounded-lg overflow-auto outline-none ${textStyles}`}
                    value={localValue}
                    onChange={onInput}
                    spellCheck={false}
                    style={{
                        caretColor: 'var(--color-foreground)',
                    }}
                />
                {/* Overlay - видимый текст с подсветкой */}
                <div
                    ref={overlayRef}
                    className={`absolute inset-0 pointer-events-none z-10 p-4 overflow-auto rounded-lg ${textStyles}`}
                    onMouseOver={onOverlayMouseOver}
                    onMouseOut={onOverlayMouseOut}
                    onClick={onIssueClick}
                    aria-hidden="true"
                    style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                    }}
                >
                    <pre className={`m-0 ${textStyles} text-foreground`}>
                        {segments.map((s, idx) =>
                            s.issue ? (
                                <span
                                    key={idx}
                                    data-issue-id={s.issue.id}
                                    data-start={s.start}
                                    data-end={s.end}
                                    className={[
                                        "pointer-events-auto cursor-pointer rounded px-0.5",
                                        s.issue.severity === "error" ? "bg-destructive/10 underline decoration-wavy decoration-destructive decoration-2" : "",
                                        s.issue.severity === "warning" ? "bg-warning/10 underline decoration-wavy decoration-warning decoration-2" : "",
                                        s.issue.severity === "info" ? "bg-primary/10 underline decoration-wavy decoration-primary decoration-2" : "",
                                        hoveredId === s.issue.id ? "ring-2 ring-border" : "",
                                    ].join(" ")}
                                >
                                    {s.text}
                                </span>
                            ) : (
                                <span key={idx}>
                                    {s.text}
                                </span>
                            )
                        )}
                    </pre>
                </div>
            </div>

            {tooltip && (
                <Tooltip 
                    target={tooltip.target} 
                    text={tooltip.issue.message} 
                    onClose={() => setTooltip(null)} 
                />
            )}
        </div>
    );
};

function severityPriority(a: Severity, b: Severity): Severity {
    const p: Record<Severity, number> = {
        "error": 3,
        "warning": 2,
        "info": 1,
    };
    return p[a] >= p[b] ? a : b;
}

export default Editor;