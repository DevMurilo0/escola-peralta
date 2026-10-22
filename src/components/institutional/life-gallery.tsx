import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Instagram } from "lucide-react";
import { school } from "@/config/school-config";
import { PhotoFrame } from "./photo-frame";

export function LifeGallery() {
  const rail = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(0);
  const move = (direction: number) => {
    const element = rail.current;
    if (!element) return;
    const item = element.querySelector("figure");
    element.scrollBy({
      left: direction * ((item?.getBoundingClientRect().width || 300) + 24),
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  };
  return (
    <section id="projetos" tabIndex={-1} className="school-life">
      <div className="section-wrap life-heading">
        <div>
          <h2>
            Histórias que
            <br />
            <em>dão gosto de viver.</em>
          </h2>
          <p>
            Projetos, atividades e encontros nos registros reais da Peralta. Um
            pouco do nosso cotidiano para você conhecer.
          </p>
        </div>
        <div className="gallery-controls">
          <button
            type="button"
            aria-label="Fotografias anteriores"
            disabled={position === 0}
            onClick={() => move(-1)}
          >
            <ArrowLeft size={22} />
          </button>
          <button
            type="button"
            aria-label="Próximas fotografias"
            disabled={position === 2}
            onClick={() => move(1)}
          >
            <ArrowRight size={22} />
          </button>
        </div>
      </div>
      <div
        ref={rail}
        className="life-rail"
        role="region"
        aria-label="Fotografias da vida na Peralta"
        tabIndex={0}
        onScroll={() => {
          const el = rail.current;
          if (el)
            setPosition(
              el.scrollLeft < 2
                ? 0
                : el.scrollLeft >= el.scrollWidth - el.clientWidth - 2
                  ? 2
                  : 1,
            );
        }}
      >
        {school.gallery.map((photo, index) => (
          <figure key={photo.src} data-reveal="up">
            <PhotoFrame
              photo={photo}
              title={photo.caption}
              number={String(index + 1)}
            />
            <figcaption>
              <span>{photo.caption}</span>
              <span aria-hidden="true">{index + 1}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="section-wrap life-progress">
        <span aria-hidden="true">
          <i />
        </span>
        <small>Arraste para explorar</small>
      </div>
      <div className="section-wrap instagram-invitation">
        <a href={school.instagram} target="_blank" rel="noreferrer">
          <Instagram size={21} />
          {school.instagramHandle}
          <ArrowUpRight size={20} />
        </a>
        <span>Mais histórias no nosso Instagram.</span>
      </div>
    </section>
  );
}
