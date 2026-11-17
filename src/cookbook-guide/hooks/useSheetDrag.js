import { useRef } from 'react';

// Phone bottom panels (filter + place panel): drag the handle down to close.
// Desktop is untouched — the hook only acts at phone widths.
const PHONE = '(max-width: 600px)';

// Where a flick would come to rest, from Apple's "Designing Fluid Interfaces"
// sample code. velocity in px/s.
export function project(velocity, decelerationRate = 0.998) {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

// Past the edge the panel follows less and less, instead of stopping dead.
export function rubberband(overshoot, dimension, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

export function useSheetDrag(onClose) {
  const sheetRef = useRef(null);
  const drag = useRef(null);

  const onPointerDown = (e) => {
    const sheet = sheetRef.current;
    if (!sheet || !window.matchMedia(PHONE).matches) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId); // keep tracking off the handle
    } catch {
      // capture isn't available for this pointer; dragging still works on the handle
    }
    // Start from where the panel is on screen right now, even mid-animation.
    const current = new DOMMatrix(getComputedStyle(sheet).transform).m42;
    sheet.style.transition = 'none';
    sheet.style.transform = `translateY(${current}px)`;
    drag.current = {
      grabY: e.clientY - current, // keep the finger's offset from where it grabbed
      height: sheet.offsetHeight,
      dy: current,
      samples: [{ y: e.clientY, t: e.timeStamp }],
    };
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    let dy = e.clientY - d.grabY;
    if (dy < 0) dy = -rubberband(-dy, d.height);
    sheetRef.current.style.transform = `translateY(${dy}px)`;
    d.dy = dy;
    d.samples.push({ y: e.clientY, t: e.timeStamp });
    if (d.samples.length > 5) d.samples.shift(); // recent moves only, for velocity
  };

  const onPointerUp = () => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    const sheet = sheetRef.current;

    const first = d.samples[0];
    const last = d.samples[d.samples.length - 1];
    const dt = last.t - first.t;
    const velocity = dt > 0 ? ((last.y - first.y) / dt) * 1000 : 0; // px/s, + is down

    // Decide from where the flick is headed, not where the finger let go.
    const closing = d.dy + project(velocity) > d.height / 2;
    const remaining = closing ? d.height - d.dy : Math.abs(d.dy);
    // Carry the flick's speed into the finish: a faster flick finishes sooner.
    const speed = Math.abs(velocity);
    const duration = Math.min(0.35, Math.max(0.15, speed > 0 ? remaining / speed : 0.3));

    sheet.style.transition = `transform ${duration}s cubic-bezier(0.2, 0.8, 0.2, 1)`;
    sheet.style.transform = ''; // hand back to the CSS open/closed position
    if (closing) onClose();
    sheet.addEventListener('transitionend', () => (sheet.style.transition = ''), { once: true });
  };

  return {
    sheetRef,
    handleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
  };
}
