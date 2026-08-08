"use client";

import { useEffect, useRef } from "react";

/** Fine-pointer only: a lagging ring that swells over interactive targets. */
export default function Cursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const node = ref.current;
    if (!node) return;

    document.body.classList.add("has-cursor");

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const current = { ...target };
    let frame = 0;

    const move = (event: PointerEvent) => {
      target.x = event.clientX;
      target.y = event.clientY;
      node.classList.add("is-visible");
      const hit = (event.target as HTMLElement | null)?.closest(
        "a, button, [data-cursor]",
      );
      node.classList.toggle("is-active", Boolean(hit));
    };
    const leave = () => node.classList.remove("is-visible");

    const loop = () => {
      frame = requestAnimationFrame(loop);
      current.x += (target.x - current.x) * 0.18;
      current.y += (target.y - current.y) * 0.18;
      node.style.transform = `translate3d(${current.x}px, ${current.y}px, 0) translate(-50%, -50%)`;
    };
    loop();

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerleave", leave);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerleave", leave);
      document.body.classList.remove("has-cursor");
    };
  }, []);

  return <div className="cursor" ref={ref} aria-hidden="true" />;
}
