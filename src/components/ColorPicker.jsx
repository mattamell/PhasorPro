import { useEffect, useRef, useState } from "react";

export default function ColorPicker({
  value,
  onChange,
  mode = "fine",
  palette = [],
  ariaLabel = "Change color",
}) {
  const [open, setOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const pickerRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (!pickerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  if (mode === "palette") {
    function togglePopover() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) {
        setPopoverPosition({
          top: rect.bottom + 8,
          left: Math.min(rect.left, window.innerWidth - 180),
        });
      }
      setOpen((current) => !current);
    }

    return (
      <div className="color-popover-wrap" ref={pickerRef}>
        <button
          ref={triggerRef}
          type="button"
          className="color-popover-trigger"
          style={{ background: value }}
          onClick={togglePopover}
          aria-label={ariaLabel}
          aria-expanded={open}
        />
        {open && (
          <div
            className="color-popover"
            role="dialog"
            aria-label={ariaLabel}
            style={{ top: popoverPosition.top, left: popoverPosition.left }}
          >
            {palette.map((color) => (
          <button
            key={color}
            type="button"
            className={`color-swatch ${value?.toLowerCase() === color.toLowerCase() ? "active" : ""}`}
            style={{ background: color }}
                onClick={() => {
                  onChange(color);
                  setOpen(false);
                }}
            aria-label={`Use ${color}`}
          />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <input
      type="color"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={ariaLabel}
    />
  );
}
