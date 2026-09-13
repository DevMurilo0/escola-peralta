import type { CSSProperties } from "react";
import type { SchoolPhoto } from "@/config/institutional-content";
export function PhotoFrame({
  photo,
  title,
  number,
  className = "",
  priority = false,
  sizes = "(max-width: 768px) 90vw, 50vw",
  motion,
  parallax,
}: {
  photo: SchoolPhoto;
  title: string;
  number: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  motion?: "clip" | "clip-left" | "clip-right" | "scale";
  parallax?: number;
}) {
  return (
    <div
      className={`photo-frame ${className} ${photo.src ? "has-photo" : "awaiting-photo"}`}
      data-reveal={motion}
      data-parallax={parallax}
      style={
        {
          "--photo-position": photo.position,
          "--photo-mobile-position": photo.mobilePosition || photo.position,
        } as CSSProperties
      }
    >
      {photo.src ? (
        <img
          decoding="async"
          src={photo.src}
          alt={photo.alt}
          width={1600}
          height={1200}
          sizes={sizes}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          draggable={false}
          className="editorial-photo"
        />
      ) : (
        <div className="photo-reserve">
          <span className="photo-index" aria-hidden="true">
            {number}
          </span>
          <span className="photo-line" aria-hidden="true" />
          <span className="photo-reserve-title">{title}</span>
          <span className="photo-reserve-note">
            Espaço para fotografia
            <br />
            autorizada da escola
          </span>
        </div>
      )}
    </div>
  );
}
