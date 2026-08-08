"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EASE, ScrollTrigger, gsap } from "../lib/gsap";
import { SITE } from "../site.config";

type Props = {
  /** True once the preloader curtain has cleared. */
  revealed: boolean;
  active: number | null;
  onSelect: (index: number, origin: DOMRect) => void;
  /**
   * Rendered as the first child of the sticky viewport. It has to live inside
   * this element — `mix-blend-mode` only reaches backdrops within the same
   * stacking context, and `position: sticky` creates one. Kept outside, the
   * blended type would silently composite against nothing.
   */
  backdrop: React.ReactNode;
};

export default function Reel({
  revealed,
  active,
  onSelect,
  backdrop,
}: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const hoveredRef = useRef<number | null>(null);
  const introRef = useRef<gsap.core.Timeline | null>(null);
  const [live, setLive] = useState(false);

  const setVideoRef = useCallback(
    (index: number) => (el: HTMLVideoElement | null) => {
      videoRefs.current[index] = el;
    },
    [],
  );

  // Park each film on a real frame so the grid reads as stills, not black
  // boxes — cheaper than shipping four poster images.
  useEffect(() => {
    const cleanups = videoRefs.current.map((video) => {
      if (!video) return () => {};
      const seek = () => {
        if (video.currentTime < 0.05) video.currentTime = 0.1;
      };
      video.addEventListener("loadedmetadata", seek);
      if (video.readyState >= 1) seek();
      return () => video.removeEventListener("loadedmetadata", seek);
    });
    return () => cleanups.forEach((fn) => fn());
  }, []);

  // Nothing plays behind the viewer: the open film is the only sound and
  // motion on screen.
  useEffect(() => {
    if (active === null) return;
    videoRefs.current.forEach((video) => {
      if (!video) return;
      video.pause();
      video.currentTime = 0.1;
    });
  }, [active]);

  const preview = useCallback(
    (index: number, on: boolean) => {
      hoveredRef.current = on ? index : null;
      if (active !== null) return;
      const video = videoRefs.current[index];
      if (!video) return;
      if (on) {
        video.muted = true;
        void video.play().catch(() => undefined);
      } else {
        video.pause();
        video.currentTime = 0.1;
      }
    },
    [active],
  );

  const open = useCallback(
    (index: number, element: HTMLElement) => {
      onSelect(index, element.getBoundingClientRect());
    },
    [onSelect],
  );

  /**
   * Picks up exactly where the preloader left off: the lockup is already
   * sitting in its landed position over the film, holds a beat, drops out of
   * frame, and the headline curtains in behind it.
   *
   * Built **paused at mount**, not on reveal. `from`/`fromTo` render their
   * start state the moment they are created, which is what keeps the headline
   * hidden. Waiting for reveal left it unstyled — and the preloader curtain
   * opens ~500ms before the handoff, so it flashed on screen next to the
   * lockup.
   */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      introRef.current = gsap
        .timeline({ paused: true, defaults: { ease: EASE.out } })
        // The film plays clean under the brand before anything moves.
        .to(".reel__brand-display > span", {
          yPercent: 110,
          duration: 0.95,
          ease: EASE.inOut,
          stagger: 0.07,
          delay: 1.15,
        })
        .set(".reel__brand", { autoAlpha: 0 })
        .from(".reel__chapter--one", { autoAlpha: 0, y: 16, duration: 0.9 })
        .fromTo(
          ".reel__line",
          { clipPath: "inset(105% 0% 0% 0%)", yPercent: 6 },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            yPercent: 0,
            duration: 1.6,
            stagger: 0.18,
          },
          "-=0.55",
        )
        .from(
          ".reel__foot > *",
          { autoAlpha: 0, y: 20, duration: 1, stagger: 0.12 },
          "-=1.05",
        );
    }, root);

    return () => {
      introRef.current = null;
      ctx.revert();
    };
  }, []);

  useEffect(() => {
    if (revealed) introRef.current?.play();
  }, [revealed]);

  // Scroll choreography: the headline leaves, the grid arrives.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      gsap
        .timeline({
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.7,
          },
        })
        // Each child fades on its own. Fading `.reel__intro` instead put
        // opacity < 1 on an ancestor of the blended headline, which makes it a
        // stacking context mid-scroll — that is what dropped the difference
        // blend part-way down. Opacity on the blended element itself is fine;
        // on anything above it is not.
        .to(
          [
            ".reel__chapter--one",
            ".reel__line--lead",
            ".reel__line--trail",
            ".reel__foot",
          ],
          { autoAlpha: 0, ease: "none" },
          0,
        )
        .fromTo(
          ".reel__grid",
          { autoAlpha: 0 },
          { autoAlpha: 1, ease: "none" },
          0.2,
        )
        .fromTo(
          ".card__hit",
          { clipPath: "inset(0% 0% 100% 0%)", yPercent: 16 },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            yPercent: 0,
            stagger: 0.07,
            ease: "none",
          },
          0.24,
        );

      ScrollTrigger.create({
        trigger: root,
        start: "35% top",
        onEnter: () => setLive(true),
        onLeaveBack: () => setLive(false),
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      className={`reel${revealed ? " is-ready" : ""}`}
      id="film"
      ref={rootRef}
    >
      <div className="reel__viewport">
        {backdrop}

        {/* Sits exactly where the preloader dock lands, so the handoff between
            the two elements is invisible. */}
        <div className="reel__brand" aria-hidden="true">
          <span className="reel__brand-display">
            <span>{SITE.brandMark[0]}</span>
            <span>{SITE.brandMark[1]}</span>
          </span>
        </div>

        <div className="reel__intro">
          <p className="reel__chapter reel__chapter--one">
            {SITE.hero.chapter}
          </p>

          <h1 className="reel__headline">
            <span className="reel__line reel__line--lead">
              {SITE.hero.lineOne}
            </span>
            <span className="reel__line reel__line--trail">
              {SITE.hero.lineTwo}
            </span>
          </h1>

          <div className="reel__foot">
            <p className="reel__statement">
              {SITE.statement.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </p>
            <span className="reel__scroll">
              <span>{SITE.hero.scrollCue}</span>
              <span className="reel__scroll-dot" aria-hidden="true" />
            </span>
          </div>
        </div>

        <div
          className={`reel__grid${live ? " is-live" : ""}${
            active !== null ? " is-behind" : ""
          }`}
        >
          <p className="reel__chapter reel__chapter--two">
            {SITE.reel.chapter}
          </p>

          <div className="cards">
            {SITE.takes.map((take, index) => (
              <article
                className={`card${active === index ? " is-active" : ""}`}
                key={take.id}
                onPointerEnter={() => preview(index, true)}
                onPointerLeave={() => preview(index, false)}
              >
                <button
                  className="card__hit"
                  type="button"
                  aria-label={`Play ${take.title} fullscreen`}
                  onClick={(event) => open(index, event.currentTarget)}
                >
                  <span className="card__media">
                    <video
                      ref={setVideoRef(index)}
                      src={take.src}
                      muted
                      loop
                      playsInline
                      preload="metadata"
                    />
                  </span>
                  <span className="card__frost" aria-hidden="true" />
                  <span className="card__index">{take.index}</span>
                  <span className="card__title">{take.title}</span>
                  <span className="card__meta">{take.meta}</span>
                </button>
              </article>
            ))}
          </div>

          <p className="cards__hint">{SITE.reel.hint}</p>
        </div>
      </div>
    </section>
  );
}
