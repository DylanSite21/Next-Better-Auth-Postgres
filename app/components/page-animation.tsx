"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";

gsap.registerPlugin(useGSAP);

export function PageAnimation() {
  useGSAP(() => {
    const timeline = gsap.timeline({
      defaults: {
        ease: "power3.out",
      },
    });

    // Home page
    timeline
      .from(".home-hero", {
        opacity: 0,
        y: 40,
        duration: 0.8,
      })
      .from(
        ".home-feature",
        {
          opacity: 0,
          y: 35,
          duration: 0.6,
          stagger: 0.15,
        },
        "-=0.3",
      );

    // Catalog page
    timeline
      .from(
        ".catalog-header",
        {
          opacity: 0,
          y: 30,
          duration: 0.7,
        },
        0,
      )
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
        ".book-card",
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
