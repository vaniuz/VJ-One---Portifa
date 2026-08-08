"use client";

import HeroCanvas from "./HeroCanvas";

type Props = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  revealed: boolean;
  webglFailed: boolean;
  onWebglUnsupported: () => void;
  /** True while a film is open — pushes the backdrop out of focus. */
  defocused: boolean;
};

/**
 * The film sits fixed behind everything and never unmounts, so the page reads
 * as one continuous shot rather than separate sections.
 */
export default function Backdrop({
  videoRef,
  revealed,
  webglFailed,
  onWebglUnsupported,
  defocused,
}: Props) {
  return (
    <div className={`backdrop${defocused ? " is-defocused" : ""}`}>
      <div className="backdrop__media">
        {/* Stays mounted either way: WebGL texture source, and the visible
            layer when WebGL is unavailable. */}
        <video
          className={`backdrop__video${webglFailed ? " is-visible" : ""}${
            revealed ? " is-revealed" : ""
          }`}
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        />
        {!webglFailed && (
          <HeroCanvas
            videoRef={videoRef}
            revealed={revealed}
            onUnsupported={onWebglUnsupported}
          />
        )}
      </div>
      <div className="backdrop__scrim" aria-hidden="true" />
    </div>
  );
}
