import { ArrowDown, ArrowUpRight, MapPin } from "lucide-react";
import { institutional as content } from "@/config/institutional-content";
import { contactLink } from "@/config/school-config";
import { PhotoFrame } from "./photo-frame";
import { Doodle, Flower, PaperEdge, PencilLine, Trail } from "./peralta-art";
import { MotionToggle } from "./site-motion";

export function DiscoveryHero() {
  const photos = content.photos;
  return (
    <section id="inicio" tabIndex={-1} className="opening-scene">
      <div className="section-wrap hero-layout">
        <div className="hero-heading">
          <h1>
            <span className="hero-title-line">
              <span className="hero-line-ink">Um mundo de</span>
            </span>{" "}
            <span className="hero-title-line">
              <em className="hero-line-ink">descobertas.</em>
            </span>
          </h1>
          <PencilLine className="hero-underline" />
        </div>
        <div className="hero-media">
          <div className="hero-paper-cover" aria-hidden="true" />
          <div className="hero-paper-sheet" aria-hidden="true" />
          <figure className="hero-main-print">
            <PhotoFrame
              photo={photos.hero}
              title="Vida na Peralta"
              number="1"
              priority
              className="hero-picture"
              sizes="(max-width: 600px) 72vw, (max-width: 1050px) 43vw, 36vw"
              parallax={0.023}
            />
          </figure>
          <figure className="hero-small-print">
            <img
              src={photos.infantil.src}
              alt={photos.infantil.alt}
              width={1080}
              height={1350}
              decoding="async"
            />
            <figcaption>Experimentar. Descobrir.</figcaption>
          </figure>
          <figure className="hero-round-print">
            <img
              src="/images/school/vivencia-06.webp"
              alt="Estudante da Escola Peralta com seu lanche"
              width={1080}
              height={1350}
              decoding="async"
            />
          </figure>
          <Doodle kind="star" className="hero-star" float />
          <Doodle kind="blocks" className="hero-blocks" />
          <span className="hero-handnote">
            É bom crescer
            <br />
            com histórias assim.
          </span>
          <Trail className="hero-photo-trail" />
        </div>
        <div className="opening-copy">
          <p className="hero-description">{content.hero.description}</p>
          <div className="hero-actions">
            <a
              className="site-button"
              href={contactLink}
              target="_blank"
              rel="noreferrer"
            >
              Venha conhecer <ArrowUpRight size={21} />
            </a>
            <a className="site-text-link" href="#escola">
              Explore a Peralta <ArrowDown size={18} />
            </a>
          </div>
          <div className="hero-facts">
            <span>Educação Infantil</span>
            <span>Ensino Fundamental I</span>
            <span>
              <MapPin size={15} /> Gravatá · PE
            </span>
          </div>
        </div>
        <Doodle kind="kite" className="hero-kite" float />
        <Doodle kind="cloud" className="hero-cloud" float />
        <Doodle kind="pencil" className="hero-pencil" />
        <Flower className="hero-little-flower" />
      </div>
      <div className="hero-bottom section-wrap">
        <a href="#escola">
          <ArrowDown size={18} /> A aventura começa por aqui.
        </a>
        <MotionToggle />
      </div>
      <div className="discovery-ribbon" aria-hidden="true">
        <span>brincar</span>
        <Doodle kind="star" />
        <span>imaginar</span>
        <Doodle kind="cloud" />
        <span>conviver</span>
        <Flower />
        <span>descobrir</span>
        <Doodle kind="star" />
      </div>
      <PaperEdge className="hero-edge" />
    </section>
  );
}
