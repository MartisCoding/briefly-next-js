
import { useEffect, useMemo, useRef, useState } from "react";
import Tooltip from "./Tooltip";


type Severity = "error" | "warning" | "info";

export type Issue = {
    id: number;
    start: number;
    end: number;
    message: string;
    severity: Severity;
    category?: string;
    originalText?: string;
};

type Props = {
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
}: Props) {
    const taRef = useRef<HTMLTextAreaElement | null>(null);
    const overlayRef = useRef<HTMLDivElement | null>(null);
    const [localValue, setLocalValue] =  useState(value);
    const [localIssues, setLocalIssues] = useState<Issue[]>(issues);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [tooltip, setTooltip] = useState<{
        issue: Issue;
        target: HTMLElement | null;
    } | null>(null);
    const debounceTimer = useRef<number | null>(null);
    const prevIssuesRef = useRef<Issue[]>([]);
    // const lintTimer = useRef<number | null>(null);
    useEffect(() => { setLocalValue(value); }, [value]);

    // Обновляем localIssues только когда issues действительно изменились (новый lint)
    useEffect(() => {
        // Проверяем, изменились ли issues по количеству или id
        const issuesChanged = 
            issues.length !== prevIssuesRef.current.length ||
            issues.some((issue, idx) => 
                !prevIssuesRef.current[idx] || 
                issue.id !== prevIssuesRef.current[idx].id
            );

        if (issuesChanged) {
            const issuesWithOriginal = issues.map((it) => ({
                ...it,
                originalText: it.originalText || value.slice(it.start, it.end),
            }));
            setLocalIssues(issuesWithOriginal);
            prevIssuesRef.current = issues;
        }
    }, [issues, value]);

    useEffect(() => {
        if (localIssues.length === 0) return;

        const updatedIssues: Issue[] = [];
        let hasChanges = false;

        for (const it of localIssues) {
            if (!it.originalText) continue;

            // Ищем все вхождения originalText
            const indices: number[] = [];
            let searchIndex = 0;
            while (true) {
                const idx = localValue.indexOf(it.originalText, searchIndex);
                if (idx === -1) break;
                indices.push(idx);
                searchIndex = idx + 1;
            }

            // Если не найдено ни одного вхождения - удаляем issue
            if (indices.length === 0) {
                hasChanges = true;
                continue;
            }

            // Находим ближайшее к оригинальной позиции
            let bestIndex = indices[0];
            let minDistance = Math.abs(indices[0] - it.start);
            
            for (const idx of indices) {
                const distance = Math.abs(idx - it.start);
                if (distance < minDistance) {
                    minDistance = distance;
                    bestIndex = idx;
                }
            }

            const newStart = bestIndex;
            const newEnd = bestIndex + it.originalText.length;

            // Проверяем, изменились ли позиции
            if (newStart !== it.start || newEnd !== it.end) {
                hasChanges = true;
            }

            updatedIssues.push({
                ...it,
                start: newStart,
                end: newEnd,
            });
        }
        // Обновляем только если есть изменения
        if (hasChanges) {
            setLocalIssues(updatedIssues);
        }
    }, [localValue]);

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

    const normalized = useMemo(() => {
        console.log("Normalizing issues:", localIssues);
        if (!localIssues || localIssues.length === 0) return [] as Issue[];

        const sorted = [...localIssues].sort((a, b) => a.start - b.start);

        const out: Issue[] = [];
        for (const it of sorted) {
            if (out.length === 0) {
                out.push({...it});
                continue;
            }

            const last = out[out.length - 1];

            if (it.start >= last.end) {
                out.push({...it});
                continue;
            }

            const combinedText = localValue.slice(
                Math.min(last.start, it.start),
                Math.max(last.end, it.end)
            );

            const merged: Issue = {
                id: it.id > last.id ? it.id : last.id,
                start: Math.min(last.start, it.start),
                end: Math.max(last.end, it.end),
                message: last.message + "; " + it.message,
                severity: severityPriority(last.severity, it.severity),
                originalText: combinedText,
            };
            out[out.length - 1] = merged;
        }
        console.log("Normalized issues:", out);
        return out;
    }, [localValue, localIssues]);

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
                    text: localValue.slice(cursor, issue.start),
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
        console.log("Segments computed:", segs);
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
        console.log("Issue click target:", target);
        if (!target) return;
        const startAttr = target.getAttribute("data-start");
        const endAttr = target.getAttribute("data-end");
        const idAttr = target.getAttribute("data-issue-id");
        if (!startAttr || !endAttr || !idAttr) return;
        console.log("Issue click attrs:", { startAttr, endAttr, idAttr });
        const start = parseInt(startAttr, 10);
        const end = parseInt(endAttr, 10);
        const id = parseInt(idAttr, 10);
        const ta = taRef.current;
        if (ta) {
            ta.focus();
            ta.setSelectionRange(start, end);
        }

        const issue = normalized.find((it) => it.id === id);
        console.log("Found issue on click:", issue);
        if (issue) {
            console.log("Clicked issue:", issue);
            if (onInspect) onInspect(issue);
            setTooltip({
                issue,
                target,
            });
        }
    };

    const textStyles = "font-mono text-xl leading-6 whitespace-pre-wrap break-words ";

    return (
        <div className="w-full h-full relative">
            <div className="relative w-full h-full">
                {/* Textarea - невидимый, но с курсором */}
                <textarea
                    ref={taRef}
                    className={`absolute inset-0 w-full h-full resize-none bg-transparent text-transparent caret-foreground z-10 p-4 border border-border rounded-lg overflow-auto outline-none ${textStyles}`}
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
                    className={`absolute inset-0 pointer-events-none z-20 p-4 overflow-auto rounded-lg ${textStyles}`}
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
                                        "pointer-events-auto cursor-pointer rounded",
                                        s.issue.severity === "error" ? "bg-destructive/10 underline decoration-wavy decoration-destructive decoration-2" : "",
                                        s.issue.severity === "warning" ? "bg-warning/10 underline decoration-wavy decoration-warning decoration-2" : "",
                                        s.issue.severity === "info" ? "bg-primary/10 underline decoration-wavy decoration-primary decoration-2" : "",
                                        hoveredId && parseInt(hoveredId) === s.issue.id ? "ring-2 ring-border" : "",
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