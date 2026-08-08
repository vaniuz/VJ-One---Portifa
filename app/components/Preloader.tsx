"use client";

import { SITE } from "../site.config";

/**
 * Ported from the original project. The two halves of the lockup fly in from
 * opposite edges and close their tracking; on `is-leaving` the dock descends
 * into its hero position at full scale, and only then does the curtain drop
 * to uncover the film. The dock is blended with `difference`, so it reads
 * against whatever the film is doing underneath.
 */
export default function Preloader({ leaving }: { leaving: boolean }) {
  return (
    <div
      className={`preloader${leaving ? " is-leaving" : ""}`}
      aria-hidden="true"
    >
      <div className="preloader-brand-dock">
        <span className="preloader-brand-display">
          <span className="preloader-brand-vj">{SITE.brandMark[0]}</span>
          <span className="preloader-brand-one">{SITE.brandMark[1]}</span>
        </span>
      </div>

      <span className="preloader-meta">{SITE.tagline}</span>

      <div className="preloader-curtain" />
    </div>
  );
}
