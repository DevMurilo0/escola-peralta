import { createContext, useContext, useLayoutEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

const MotionContext = createContext({ paused: false, toggle: () => {} });

export function MotionToggle() {
  const { paused, toggle } = useContext(MotionContext);
  return (
    <button
      type="button"
      className="motion-toggle"
      aria-pressed={paused}
      onClick={toggle}
    >
      {paused ? <Play size={15} /> : <Pause size={15} />}
      {paused ? "Retomar movimento" : "Pausar movimento"}
    </button>
  );
}

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
  const [paused, setPaused] = useState(false);

  // useLayoutEffect prepara o estado de entrada antes do primeiro paint do React:
  // evita o flash de conteúdo totalmente visível que ocorria com useEffect.
  useLayoutEffect(() => {
    const container = root.current;
    if (!container) return;

    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const coarsePointer = matchMedia("(pointer: coarse)");
    let observer: IntersectionObserver | undefined;
    let frame = 0;
    let disposed = false;
    const cleanups: Array<() => void> = [];

    const animations = new Set<Animation>();
    const animate = (element: HTMLElement, delay = 0, hero = false) => {
      if (
        paused ||
        reducedMotion.matches ||
        typeof element.animate !== "function"
      ) {
        element.dataset.motionState = "complete";
        return;
      }
      const kind = element.dataset.reveal;
      const isPhoto =
        kind?.startsWith("clip") ||
        element.classList.contains("hero-main-print");
      const fromClip =
        kind === "clip-left"
          ? "inset(0 100% 0 0)"
          : kind === "clip-right"
            ? "inset(0 0 0 100%)"
            : "inset(0 0 100% 0)";
      const frames: Keyframe[] = element.classList.contains("pencil-line")
        ? [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0)" }]
        : kind === "doodle"
          ? [
              { opacity: 0, translate: "0 14px", rotate: "-8deg" },
              { opacity: 1, translate: "0 0", rotate: "0deg" },
            ]
          : kind === "blur"
            ? [
                { opacity: 0, filter: "blur(3px)", translate: "0 10px" },
                { opacity: 1, filter: "blur(0px)", translate: "0 0" },
              ]
            : isPhoto
              ? [
                  { clipPath: fromClip, opacity: 0 },
                  { clipPath: "inset(0)", opacity: 1 },
                ]
              : [
                  { opacity: 0, translate: `0 ${hero ? 30 : 20}px` },
                  { opacity: 1, translate: "0 0" },
                ];
      // O elemento já está invisível desde o layout effect via CSS. A animação
      // assume o estado visual imediatamente, sem uma pintura intermediária.
      element.dataset.motionState = "running";
      let animation: Animation;
      try {
        animation = element.animate(frames, {
          duration: isPhoto || hero ? 700 : 540,
          delay,
          easing: "cubic-bezier(.22,1,.36,1)",
          // Preserva o primeiro frame durante o delay, sem esconder após terminar.
          fill: "backwards",
        });
      } catch {
        // Fallback progressivo: nunca deixe textos invisíveis se WAAPI falhar.
        element.dataset.motionState = "complete";
        return;
      }
      animations.add(animation);
      animation.finished
        .then(() => {
          animations.delete(animation);
          element.dataset.motionState = "complete";
          if (disposed) return;
          const floating = element.querySelector<HTMLElement>("[data-float]");
          if (!floating || paused || reducedMotion.matches) return;
          const drift = floating.animate(
            [
              { translate: "0 0", rotate: "0deg" },
              { translate: "0 -6px", rotate: "2deg", offset: 0.5 },
              { translate: "0 0", rotate: "0deg" },
            ],
            { duration: 3600, iterations: 3, easing: "ease-in-out" },
          );
          animations.add(drift);
          drift.finished.then(() => animations.delete(drift)).catch(() => {});
        })
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
        !paused &&
        !reducedMotion.matches &&
        innerWidth > 800 &&
        !coarsePointer.matches;
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
      // Primeiro desativa qualquer máscara anterior para preservar conteúdo
      // em pause, reduced motion, browsers sem IO/WAAPI e navegação sem JS.
      container.classList.remove("motion-ready");
      observer?.disconnect();
      animations.forEach((animation) => animation.cancel());
      animations.clear();

      const canAnimate =
        !paused &&
        !reducedMotion.matches &&
        "IntersectionObserver" in window &&
        typeof Element.prototype.animate === "function";
      if (!canAnimate) {
        updateScrollMotion();
        return;
      }

      const heroParts = Array.from(
        container.querySelectorAll<HTMLElement>(
          ".hero-line-ink, .hero-description, .hero-actions, .hero-facts, .hero-main-print, .hero-small-print, .hero-round-print, .hero-handnote",
        ),
      );
      const candidates = Array.from(
        container.querySelectorAll<HTMLElement>(
          "[data-reveal], .pencil-line, .paper-edge, section:not(.opening-scene) h2, section:not(.opening-scene) h3, section:not(.opening-scene) p, section:not(.opening-scene) .site-text-link, section:not(.opening-scene) .site-button, section:not(.opening-scene) .peralta-flower, .footer-opening, .footer-main, .footer-word",
        ),
      );
      // Não fade um texto duas vezes quando ele já está dentro de um bloco
      // que ganha reveal. Isso elimina ghosting em cards, fotos e rodapé.
      const candidateSet = new Set(candidates);
      const revealTargets = candidates.filter((element) => {
        let ancestor = element.parentElement;
        while (ancestor && ancestor !== container) {
          if (candidateSet.has(ancestor)) return false;
          ancestor = ancestor.parentElement;
        }
        return !heroParts.some((hero) => hero.contains(element));
      });
      const targets = [...heroParts, ...revealTargets];
      targets.forEach((element) => {
        element.dataset.motionState = "pending";
      });
      // Aplicar CSS pending + habilitar a máscara acontece na mesma fase
      // de layout anterior ao primeiro paint do conteúdo do React.
      container.classList.add("motion-ready");

      heroParts.forEach((element, index) =>
        animate(element, Math.min(index * 60, 360), true),
      );

      observer = new IntersectionObserver(
        (entries) => {
          let sequence = 0;
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const element = entry.target as HTMLElement;
            observer?.unobserve(element);
            animate(element, (sequence++ % 4) * 60);
            element.classList.add("is-revealed");
          });
        },
        { threshold: 0.08, rootMargin: "0px 0px -4%" },
      );
      revealTargets.forEach((element) => observer?.observe(element));
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
      disposed = true;
      observer?.disconnect();
      animations.forEach((animation) => animation.cancel());
      if (frame) cancelAnimationFrame(frame);
      container.classList.remove("motion-ready");
      removeEventListener("scroll", requestScrollUpdate);
      removeEventListener("resize", requestScrollUpdate);
      reducedMotion.removeEventListener("change", startRevealSystem);
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [paused]);

  return (
    <MotionContext.Provider
      value={{ paused, toggle: () => setPaused((value) => !value) }}
    >
      <div
        className={className}
        ref={root}
        data-motion-paused={paused || undefined}
      >
        {children}
      </div>
    </MotionContext.Provider>
  );
}
