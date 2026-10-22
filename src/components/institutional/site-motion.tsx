import { useEffect, useRef } from "react";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function SiteMotion({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = root.current;
    if (!container) return;

    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const coarsePointer = matchMedia("(pointer: coarse)");
    let observer: IntersectionObserver | undefined;
    let frame = 0;
    const cleanups: Array<() => void> = [];

    const animations = new Set<Animation>();
    const animate = (element: HTMLElement, delay = 0, hero = false) => {
      if (reducedMotion.matches || typeof element.animate !== "function")
        return;
      const kind = element.dataset.reveal;
      const isPhoto =
        kind?.startsWith("clip") ||
        element.classList.contains("hero-main-print");
      const frames: Keyframe[] = isPhoto
        ? [
            { clipPath: "inset(0 0 100% 0)", opacity: 0.5 },
            { clipPath: "inset(0)", opacity: 1 },
          ]
        : [
            { opacity: 0, translate: `0 ${hero ? 30 : 20}px` },
            { opacity: 1, translate: "0 0" },
          ];
      const animation = element.animate(frames, {
        duration: isPhoto || hero ? 700 : 540,
        delay,
        easing: "cubic-bezier(.22,1,.36,1)",
        // No persistent hidden state: cancelled/unsupported animation exposes content.
        fill: "backwards",
      });
      animations.add(animation);
      animation.finished
        .then(() => animations.delete(animation))
        .catch(() => {});
    };

    const updateScrollMotion = () => {
      frame = 0;
      const hero = container.querySelector<HTMLElement>(".opening-scene");
      if (hero) {
        const distance = Math.max(innerHeight * 0.72, 1);
        const progress = clamp(scrollY / distance, 0, 1);
        hero.style.setProperty("--hero-scroll", progress.toFixed(3));
      }

      const allowParallax =
        !reducedMotion.matches && innerWidth > 800 && !coarsePointer.matches;
      container
        .querySelectorAll<HTMLElement>("[data-parallax]")
        .forEach((element) => {
          if (!allowParallax) {
            element.style.setProperty("--photo-parallax", "0px");
            return;
          }
          const rect = element.getBoundingClientRect();
          if (rect.bottom < -100 || rect.top > innerHeight + 100) return;
          const speed = Number(element.dataset.parallax) || 0.025;
          const offset = clamp(
            (innerHeight / 2 - (rect.top + rect.height / 2)) * speed,
            -24,
            24,
          );
          element.style.setProperty(
            "--photo-parallax",
            `${offset.toFixed(2)}px`,
          );
        });
    };

    const requestScrollUpdate = () => {
      if (!frame) frame = requestAnimationFrame(updateScrollMotion);
    };

    const startRevealSystem = () => {
      observer?.disconnect();
      animations.forEach((animation) => animation.cancel());
      animations.clear();
      container.classList.toggle("motion-ready", !reducedMotion.matches);
      if (reducedMotion.matches || !("IntersectionObserver" in window)) {
        updateScrollMotion();
        return;
      }
      const heroParts = container.querySelectorAll<HTMLElement>(
        ".hero-line-ink, .hero-description, .hero-actions, .hero-facts, .hero-main-print, .hero-small-print, .hero-round-print, .hero-flower, .hero-handnote",
      );
      heroParts.forEach((element, index) =>
        animate(element, Math.min(index * 60, 360), true),
      );
      observer = new IntersectionObserver(
        (entries) => {
          let sequence = 0;
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const element = entry.target as HTMLElement;
            animate(element, (sequence++ % 4) * 60);
            element.classList.add("is-revealed");
            observer?.unobserve(element);
          });
        },
        { threshold: 0.08, rootMargin: "0px 0px -4%" },
      );
      container
        .querySelectorAll<HTMLElement>(
          "[data-reveal], section:not(.opening-scene) h2, section:not(.opening-scene) h3, section:not(.opening-scene) p, section:not(.opening-scene) .site-text-link, section:not(.opening-scene) .site-button, section:not(.opening-scene) .peralta-flower, .footer-opening, .footer-main, .footer-word",
        )
        .forEach((element) => observer?.observe(element));
      updateScrollMotion();
    };

    const rail = container.querySelector<HTMLElement>(".life-rail");
    if (rail) {
      let dragging = false;
      let startX = 0;
      let lastX = 0;
      let dragged = false;

      const updateProgress = () => {
        const maximum = rail.scrollWidth - rail.clientWidth;
        const progress = maximum > 0 ? rail.scrollLeft / maximum : 0;
        rail.parentElement?.style.setProperty(
          "--gallery-progress",
          clamp(progress, 0, 1).toFixed(3),
        );
      };
      const onPointerDown = (event: PointerEvent) => {
        if (event.pointerType !== "mouse" || event.button !== 0) return;
        dragging = true;
        dragged = false;
        startX = event.clientX;
        lastX = event.clientX;
        rail.classList.add("is-dragging");
        rail.style.scrollSnapType = "none";
        rail.setPointerCapture(event.pointerId);
      };
      const onPointerMove = (event: PointerEvent) => {
        if (!dragging) return;
        event.preventDefault();
        const distance = event.clientX - startX;
        if (Math.abs(distance) > 4) dragged = true;
        rail.scrollBy({ left: lastX - event.clientX, behavior: "instant" });
        lastX = event.clientX;
      };
      const stopDragging = (event: PointerEvent) => {
        if (!dragging) return;
        dragging = false;
        rail.classList.remove("is-dragging");
        rail.style.removeProperty("scroll-snap-type");
        if (rail.hasPointerCapture(event.pointerId))
          rail.releasePointerCapture(event.pointerId);
      };
      const preventDraggedClick = (event: MouseEvent) => {
        if (dragged) event.preventDefault();
        dragged = false;
      };

      rail.addEventListener("scroll", updateProgress, { passive: true });
      rail.addEventListener("pointerdown", onPointerDown);
      rail.addEventListener("pointermove", onPointerMove);
      rail.addEventListener("pointerup", stopDragging);
      rail.addEventListener("pointercancel", stopDragging);
      rail.addEventListener("click", preventDraggedClick, true);
      updateProgress();
      cleanups.push(() => {
        rail.removeEventListener("scroll", updateProgress);
        rail.removeEventListener("pointerdown", onPointerDown);
        rail.removeEventListener("pointermove", onPointerMove);
        rail.removeEventListener("pointerup", stopDragging);
        rail.removeEventListener("pointercancel", stopDragging);
        rail.removeEventListener("click", preventDraggedClick, true);
      });
    }

    startRevealSystem();
    addEventListener("scroll", requestScrollUpdate, { passive: true });
    addEventListener("resize", requestScrollUpdate, { passive: true });
    reducedMotion.addEventListener("change", startRevealSystem);

    return () => {
      observer?.disconnect();
      animations.forEach((animation) => animation.cancel());
      if (frame) cancelAnimationFrame(frame);
      container.classList.remove("motion-ready");
      removeEventListener("scroll", requestScrollUpdate);
      removeEventListener("resize", requestScrollUpdate);
      reducedMotion.removeEventListener("change", startRevealSystem);
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  return (
    <div className={className} ref={root}>
      {children}
    </div>
  );
}
