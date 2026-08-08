/**
 * Single source of truth for brand copy, links and media paths.
 * Swap the files in `public/media/` keeping the same names to change the reel.
 */

const WHATSAPP_NUMBER = "553123420754"; // +55 31 2342-0754
const WHATSAPP_MESSAGE =
  "Hi VJ One — I'd like a cinematic film for my property.";

export const SITE = {
  name: "VJ One",
  brandMark: ["VJ", "ONE"] as const,
  tagline: "Cinematic film for luxury villas & real estate",

  whatsapp: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    WHATSAPP_MESSAGE,
  )}`,

  hero: {
    chapter: "01 / The film",
    lineOne: "Beyond",
    lineTwo: "the still.",
    scrollCue: "Scroll to explore",
    /** Phones get the 720p cut: same film, a third of the bytes. */
    video: {
      desktop: "/media/hero-desktop.mp4",
      mobile: "/media/hero-mobile.mp4",
    },
  },

  /** Static line in the hero foot — deliberately not a link. */
  statement: ["From listing", "to longing."] as const,

  reel: {
    chapter: "02 / The possible",
    hint: "Hover to preview · click to open",
  },

  takes: [
    {
      id: "take-1",
      index: "/01",
      title: "Arrival",
      meta: "Villa / Golden hour",
      src: "/media/take-1.mp4",
    },
    {
      id: "take-2",
      index: "/02",
      title: "Water",
      meta: "Infinity pool / Dusk",
      src: "/media/take-2.mp4",
    },
    {
      id: "take-3",
      index: "/03",
      title: "Interiors",
      meta: "Penthouse / Natural light",
      src: "/media/take-3.mp4",
    },
    {
      id: "take-4",
      index: "/04",
      title: "Atmosphere",
      meta: "Details / Blue hour",
      src: "/media/take-4.mp4",
    },
  ],
} as const;

export type Take = (typeof SITE.takes)[number];
