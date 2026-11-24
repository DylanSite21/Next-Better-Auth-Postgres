"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";

gsap.registerPlugin(useGSAP);

export function CatalogAnimation() {
  useGSAP(() => {
    const timeline = gsap.timeline({
      defaults: {
        ease: "power3.out",
      },
    });

    const cards = gsap.utils.toArray(".book-card");

    timeline
      .from(".catalog-header", {
        opacity: 0,
        y: 30,
        duration: 0.7,
      })
      .from(
        ".catalog-search",
        {
          opacity: 0,
          y: 25,
          duration: 0.6,
        },
        "-=0.35",
      )
      .from(
        ".catalog-results",
        {
          opacity: 0,
          y: 20,
          duration: 0.5,
        },
        "-=0.3",
      )
      .from(
        cards,
        {
          opacity: 0,
          y: 35,
          scale: 0.96,
          duration: 0.6,
          stagger: 0.08,
        },
        "-=0.2",
      );
  });

  return null;
}
