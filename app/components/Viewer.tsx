"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "../lib/gsap";
import { SITE } from "../site.config";

type Props = {
  index: number;
  /** Screen rect of the card that was clicked, for the expand animation. */
  origin: DOMRect | null;
  onClose: () => void;
};

/**
 * Fullscreen playback. The film is drawn at its native 9:16 with no frost, no
 * grade and no filter — the blurring belongs to the backdrop behind it.
 */
export default function Viewer({ index, origin, onClose }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  const take = SITE.takes[index];

  // Manual FLIP: measure the destination, then play the card's rect into it.
  useLayoutEffect(() => {
    const frame = frameRef.current;
    const root = rootRef.current;
    if (!frame || !root) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(root, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35 });

      if (!origin) {
        gsap.from(frame, { scale: 0.92, duration: 0.8, ease: "expo.out" });
        return;
      }

      const target = frame.getBoundingClientRect();
      gsap.from(frame, {
        x: origin.left + origin.width / 2 - (target.left + target.width / 2),
        y: origin.top + origin.height / 2 - (target.top + target.height / 2),
        scaleX: origin.width / target.width,
        scaleY: origin.height / target.height,
        duration: 0.9,
        ease: "expo.inOut",
      });
    }, root);

    return () => ctx.revert();
  }, [origin]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;

    // The element mounts with its src, so the first play() races the load it
    // triggered. Retry once there is data.
    const tryPlay = () => void video.play().catch(() => undefined);
    tryPlay();
    video.addEventListener("canplay", tryPlay);
    return () => video.removeEventListener("canplay", tryPlay);
  }, [muted]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="viewer" ref={rootRef} role="dialog" aria-modal="true">
      {/* Click-off target; the frame above it stops propagation. */}
      <button
        className="viewer__dismiss"
        type="button"
        aria-label={`Close ${take.title}`}
        onClick={onClose}
      />

      <div className="viewer__frame" ref={frameRef}>
        <video
          ref={videoRef}
          src={take.src}
          loop
          playsInline
          autoPlay
          muted={muted}
        />
      </div>

      <div className="viewer__bar">
        <span className="viewer__title">
          <i>{take.index}</i>
          {take.title}
        </span>
        <span className="viewer__controls">
          <button type="button" onClick={() => setMuted((value) => !value)}>
            {muted ? "Sound on" : "Sound off"}
          </button>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </span>
      </div>
    </div>
  );
}
