import { useRef, useState } from "react";

function decimalsForStep(step) {
  if (step === "any" || step == null || step === "") return 3;
  const text = String(step);
  if (!text.includes(".")) return 0;
  return text.split(".")[1].length;
}

function clamp(value, min, max) {
  let next = value;
  if (min !== undefined && min !== "" && Number.isFinite(Number(min))) {
    next = Math.max(Number(min), next);
  }
  if (max !== undefined && max !== "" && Number.isFinite(Number(max))) {
    next = Math.min(Number(max), next);
  }
  return next;
}

function emitChange(onChange, value) {
  onChange?.({ target: { value: String(value) } });
}

export default function DragNumberInput({
  value,
  onChange,
  step = "any",
  dragStep,
  min,
  max,
  disabled,
  className = "",
  ...props
}) {
  const dragRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const numericStep = Number(dragStep ?? (step === "any" ? 1 : step)) || 1;
  const decimals = Math.max(decimalsForStep(dragStep ?? step), 0);

  function formatValue(next) {
    const rounded = Number(next.toFixed(Math.min(decimals + 2, 6)));
    return clamp(rounded, min, max);
  }

  function handlePointerDown(event) {
    if (disabled || event.button !== 0) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startValue: Number(value) || 0,
      moved: false,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handlePointerMove(event) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || disabled) return;

    const deltaY = event.clientY - drag.startY;
    if (Math.abs(deltaY) < 3 && !drag.moved) return;

    drag.moved = true;
    setDragging(true);
    event.preventDefault();

    const steps = -deltaY / 4;
    emitChange(onChange, formatValue(drag.startValue + steps * numericStep));
  }

  function finishDrag(event) {
    const drag = dragRef.current;
    if (drag?.pointerId === event.pointerId) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }
    dragRef.current = null;
    setDragging(false);
  }

  return (
    <input
      {...props}
      type="number"
      value={value}
      step={step}
      min={min}
      max={max}
      disabled={disabled}
      className={`${className} drag-number-input ${dragging ? "dragging" : ""}`.trim()}
      title="Type a value, or drag up/down to adjust"
      onChange={onChange}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
    />
  );
}
