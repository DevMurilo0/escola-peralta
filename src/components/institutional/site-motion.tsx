import { useEffect, useRef } from "react";
export function SiteMotion({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const animations = new Set<Animation>();
    let observer: IntersectionObserver | undefined;
    const clear = () => {
      observer?.disconnect();
      animations.forEach((a) => a.cancel());
      animations.clear();
      root.current
        ?.querySelectorAll<HTMLElement>("[data-reveal]")
        .forEach((e) => {
          e.style.removeProperty("opacity");
        });
    };
    const start = () => {
      clear();
      if (media.matches || !("IntersectionObserver" in window)) return;
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const e = entry.target as HTMLElement;
            e.style.removeProperty("opacity");
            const animation = e.animate(
              [
                { opacity: 0, transform: "translateY(22px)" },
                { opacity: 1, transform: "translateY(0)" },
              ],
              {
                duration: 600,
                delay: Math.min(Number(e.dataset.delay) || 0, 180),
                easing: "cubic-bezier(.2,.7,.2,1)",
                fill: "backwards",
              },
            );
            animations.add(animation);
            animation.onfinish = () => animations.delete(animation);
            observer?.unobserve(e);
          });
        },
        { threshold: 0.08 },
      );
      root.current
        ?.querySelectorAll<HTMLElement>("[data-reveal]")
        .forEach((e) => {
          if (e.getBoundingClientRect().top > innerHeight)
            e.style.opacity = "0";
          observer?.observe(e);
        });
    };
    start();
    media.addEventListener("change", start);
    return () => {
      clear();
      media.removeEventListener("change", start);
    };
  }, []);
  return (
    <div className={className} ref={root}>
      {children}
    </div>
  );
}
