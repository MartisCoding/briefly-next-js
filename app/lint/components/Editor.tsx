
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
}


function Editor ({
    value,
    onChange,
    issues,
    onInspect,
    debounceMs = 350,
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

    return (
        <div className="w-full relative">
            <div className="relative w-full">
                <textarea
                    ref={taRef}
                    className={
                        [
                            "relative w-full h-80 resize-y bg-transparent",
                            "text-transparent caret-black z-20 p-4 border border-gray-200",
                            "leading-6 font-sans whitespace-pre-wrap overflow-auto outline-none",
                        ].join(" ")
                    }
                    value={localValue}
                    onChange={onInput}
                    spellCheck={false}
                />
                <div
                    ref={overlayRef}
                    className="absolute inset-0 pointer-events-none z-10 p-4 overflow-auto"
                    onMouseOver={onOverlayMouseOver}
                    onMouseOut={onOverlayMouseOut}
                    onClick={onIssueClick}
                    aria-hidden="true"
                >
                    <pre className="m-0 whitespace-pre-wrap wrap-break-word leading-6 text-sm font-sans text-gray-900">
                        {segments.map((s, idx) =>
                            s.issue ? (
                                <span
                                key={idx}
                                data-issue-id={s.issue.id}
                                data-start={s.start}
                                data-end={s.end}
                                className={[
                                    "pointer-events-auto rounded-px-1",
                                    s.issue.severity === "error" ? "bg-red-50" : "",
                                    s.issue.severity === "warning" ? "bg-yellow-50" : "",
                                    s.issue.severity === "info" ? "bg-blue-50" : "",
                                    hoveredId === s.issue.id ? "ring-2 ring-gray-300": "",
                                ].join(" ")}
                                >
                                {s.text}
                                </span>
                            ) : (
                                <span key={idx} className="text-current">
                                {s.text}
                                </span>
                            )
                        )}
                    </pre>
                </div>
            </div>

            {tooltip && (
                <Tooltip target={tooltip.target} text={tooltip.issue.message} onClose={() => setTooltip(null)} />
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