import { useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";

type Props = {
    target: HTMLElement | null;
    text: string;
    onClose?: () => void;
}

export default function Tooltip({
    target,
    text,
    onClose,
}: Props) {
    const tooltipRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (!target) return;

        const updatePosition = () => {
            if (!target || !tooltipRef.current) return;
            const rect = target.getBoundingClientRect();
            const ref = tooltipRef.current;

            ref.style.top = `${rect.top + window.scrollY - 80}px`;
            ref.style.left = `${rect.left + window.scrollX}px`;
            ref.style.width = `${rect.width}px`;
        }

        updatePosition();

        window.addEventListener("scroll", updatePosition);
        window.addEventListener("resize", updatePosition);

        return () => {
            window.removeEventListener("scroll", updatePosition);
            window.removeEventListener("resize", updatePosition);
        };
    }, [target]);

    useEffect(() => {
        if (!target || !onClose) return;
        
        const handleClickOutside = (event: MouseEvent) => {
            if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [target, onClose]);

    useEffect(() => {
        if (!target || !onClose) return;

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        }

        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("keydown", handleEscape);
        };
    }, [target, onClose]);

    if (!target) return null;

    return createPortal(
        <div
            ref={tooltipRef}
            className="absolute z-50 -translate-x-1/2 -translate-y-full rounded-xl bg-gray-900 px-3 py-2 text-sm text-white shadow-xl borer border-gray-700 max-w-sm"
            onClick={(e) => {e.stopPropagation()}}
        >
            <p className="leading-snug whitespace-pre-wrap">{text}</p>
        </div>,
        document.body
    )
}