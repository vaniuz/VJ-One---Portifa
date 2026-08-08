"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { ScrollTrigger } from "../lib/gsap";
import { useLenis } from "../lib/useLenis";
import { SITE } from "../site.config";
import Backdrop from "./Backdrop";
import Cursor from "./Cursor";
import Preloader from "./Preloader";
import Reel from "./Reel";
import Viewer from "./Viewer";

/** Original intro beats: brand holds, then the curtain clears. */
const LEAVE_AT_MS = 1550;
const COMPLETE_AT_MS = 3040;

const SEEN_KEY = "vj-one-seen-v1";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const getReducedMotion = () => window.matchMedia(REDUCED_MOTION).matches;
/** The server cannot know the preference; assume motion is welcome. */
const getReducedMotionOnServer = () => false;

/** Fixed for the life of the tab, so there is nothing to subscribe to. */
const subscribeNever = () => () => {};

const getReturning = () => {
  try {
    return window.sessionStorage.getItem(SEEN_KEY) === "true";
  } catch {
    return false;
  }
};
const getReturningOnServer = () => false;

export default function Experience() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [leaving, setLeaving] = useState(false);
  const [introDoneState, setIntroDone] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);
  // Index plus the rect it expanded from, kept together so the viewer never
  // renders from a ref that React did not see change.
  const [selection, setSelection] = useState<{
    index: number;
    origin: DOMRect;
  } | null>(null);
  const active = selection?.index ?? null;

  const prefersReduced = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getReducedMotionOnServer,
  );
  const returning = useSyncExternalStore(
    subscribeNever,
    getReturning,
    getReturningOnServer,
  );

  const introDone = prefersReduced || returning || introDoneState;

  useLenis(introDone && active === null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Guard the zero-width case: a viewport that has not been measured yet
    // reports as narrow and would lock a desktop visitor to the 720p cut.
    const width = window.innerWidth;
    const narrow = width > 0 && width <= 900;
    // The film streams rather than fully preloading: the intro is on a timer,
    // so there is nothing to wait for and quality need not be traded for size.
    video.src = narrow ? SITE.hero.video.mobile : SITE.hero.video.desktop;

    // Calling play() in the same tick as the src assignment loses the race
    // with the load it just kicked off, leaving the WebGL texture frozen on a
    // black frame. Retry once there is something to play.
    const tryPlay = () => void video.play().catch(() => undefined);
    tryPlay();
    video.addEventListener("canplay", tryPlay);
    return () => video.removeEventListener("canplay", tryPlay);
  }, []);

  useEffect(() => {
    if (prefersReduced || returning) return;

    document.body.classList.add("is-locked");
    const leaveTimer = window.setTimeout(() => setLeaving(true), LEAVE_AT_MS);
    const doneTimer = window.setTimeout(() => {
      setIntroDone(true);
      document.body.classList.remove("is-locked");
      try {
        window.sessionStorage.setItem(SEEN_KEY, "true");
      } catch {
        /* private mode — the intro simply replays */
      }
    }, COMPLETE_AT_MS);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(doneTimer);
      document.body.classList.remove("is-locked");
    };
  }, [prefersReduced, returning]);

  /**
   * Triggers below the fold are measured while the preloader still has the
   * body scroll-locked, so their start positions refer to a document that
   * could not scroll. Without this re-measure the cards never reveal.
   */
  useEffect(() => {
    if (!introDone) return;
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [introDone]);

  // The viewer is modal; the page behind it must not scroll away.
  useEffect(() => {
    document.body.classList.toggle("is-viewing", active !== null);
    return () => document.body.classList.remove("is-viewing");
  }, [active]);

  const handleSelect = useCallback((index: number, origin: DOMRect) => {
    setSelection({ index, origin });
  }, []);

  const handleClose = useCallback(() => setSelection(null), []);
  const handleWebglUnsupported = useCallback(() => setWebglFailed(true), []);

  return (
    <>
      {!introDone && <Preloader leaving={leaving} />}

      <header className="topbar">
        <a className="topbar__brand" href="#film">
          <span className="topbar__brand-vj">{SITE.brandMark[0]}</span>
          <span className="topbar__brand-one">{SITE.brandMark[1]}</span>
        </a>
        <nav className="topbar__nav" aria-label="Primary">
          <a
            className="topbar__link"
            href={SITE.whatsapp}
            target="_blank"
            rel="noreferrer"
          >
            <span>WhatsApp</span>
            <i aria-hidden="true">↗</i>
          </a>
        </nav>
      </header>

      <main className="stage">
        <Reel
          revealed={introDone}
          active={active}
          onSelect={handleSelect}
          backdrop={
            <Backdrop
              videoRef={videoRef}
              revealed={introDone}
              webglFailed={webglFailed}
              onWebglUnsupported={handleWebglUnsupported}
              defocused={active !== null}
            />
          }
        />
      </main>

      {selection && (
        <Viewer
          index={selection.index}
          origin={selection.origin}
          onClose={handleClose}
        />
      )}

      <Cursor />
    </>
  );
}
