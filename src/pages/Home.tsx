import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Instagram,
  MapPin,
  MessageCircle,
  Navigation,
} from "lucide-react";
import { school, contactLink } from "@/config/school-config";
import { institutional as content } from "@/config/institutional-content";
import { PublicHeader } from "@/components/public-header";
import { PhotoFrame } from "@/components/institutional/photo-frame";
import { SiteMotion } from "@/components/institutional/site-motion";
import { PeraltaCaderno } from "@/components/institutional/peralta-caderno";
import { Flower, Trail } from "@/components/institutional/peralta-art";
import { LifeGallery } from "@/components/institutional/life-gallery";
import "@/styles/institutional.css";
import "@/styles/peralta-caderno.css";

const logo = "/images/brand/escola-peralta-logo-recortada.webp";
export default function Home() {
  const photos = content.photos;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: school.name,
    url: import.meta.env.VITE_SITE_URL || window.location.origin,
    sameAs: [school.instagram],
    address: {
      "@type": "PostalAddress",
      streetAddress: school.address,
      addressLocality: "Gravatá",
      addressRegion: "PE",
      addressCountry: "BR",
    },
  };
  return (
    <SiteMotion className="institutional">
      <PublicHeader />
      <main id="main">
        <section id="inicio" tabIndex={-1} className="opening-scene">
          <div className="section-wrap hero-layout">
            <div className="opening-copy">
              <h1>
                <span className="hero-title-line">
                  <span className="hero-line-ink">Aprender é</span>
                </span>{" "}
                <span className="hero-title-line">
                  <em className="hero-line-ink">uma aventura.</em>
                </span>
              </h1>
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
              <Trail className="hero-copy-trail" />
            </div>
            <div className="hero-media">
              <div className="hero-sun" aria-hidden="true" />
              <figure className="hero-main-print">
                <PhotoFrame
                  photo={photos.hero}
                  title="Vida na Peralta"
                  number="1"
                  priority
                  className="hero-picture"
                  sizes="(max-width: 800px) 80vw, 36vw"
                  parallax={0.025}
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
                <figcaption>Pequenas descobertas.</figcaption>
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
              <Flower className="hero-flower" />
              <Trail className="hero-photo-trail" />
              <span className="hero-handnote">
                Infância com espaço
                <br />
                para florescer.
              </span>
            </div>
          </div>
          <div className="hero-bottom section-wrap">
            <a href="#escola">
              <ArrowDown size={18} /> Tem muito para descobrir por aqui.
            </a>
            <span>Uma escola. Muitas histórias.</span>
          </div>
        </section>
        <section id="escola" tabIndex={-1} className="school-story">
          <div className="section-wrap story-layout">
            <div className="story-photo">
              <PhotoFrame
                photo={photos.about}
                title="Encontros da Peralta"
                number="2"
                motion="clip-left"
                parallax={0.018}
              />
              <span className="photo-caption">
                O cotidiano é feito de encontros.
              </span>
              <Flower className="story-flower" />
            </div>
            <div className="story-copy">
              <h2>
                Perto da infância.
                <br />
                <em>Perto de você.</em>
              </h2>
              <p className="site-lead">{content.about.description}</p>
              <p>{content.about.invitation}</p>
              <a
                className="site-text-link"
                href={contactLink}
                target="_blank"
                rel="noreferrer"
              >
                Vamos nos conhecer? <ArrowUpRight size={20} />
              </a>
              <img
                className="story-seal"
                src={logo}
                alt=""
                width={140}
                height={140}
                loading="lazy"
              />
            </div>
          </div>
        </section>
        <section id="proposta" tabIndex={-1} className="learning-section">
          <div className="section-wrap learning-layout">
            <div className="learning-intro">
              <h2>
                A curiosidade
                <br />
                <em>abre caminhos.</em>
              </h2>
              <p>{content.pedagogy.description}</p>
              <Flower className="learning-flower" />
            </div>
            <div className="learning-concepts">
              {content.pedagogy.concepts.map((concept) => (
                <article key={concept.title}>
                  <h3>
                    {concept.title}
                    <ArrowUpRight aria-hidden="true" />
                  </h3>
                  <p>{concept.text}</p>
                </article>
              ))}
            </div>
            <Trail className="learning-trail" />
          </div>
        </section>
        <PeraltaCaderno />
        <section id="ensino" tabIndex={-1} className="school-segments">
          <div className="section-wrap segments-heading">
            <h2>
              Crescer é
              <br />
              <em>descobrir.</em>
            </h2>
            <p>
              Da Educação Infantil ao Fundamental I,
              <br />
              um caminho para conhecer juntos.
            </p>
          </div>
          <div className="segment-fields">
            {content.segments.map((segment, index) => (
              <article
                key={segment.title}
                className={`segment-field segment-${index}`}
              >
                <PhotoFrame
                  photo={index === 0 ? photos.infantil : photos.fundamental}
                  title={segment.title}
                  number={String(index + 3)}
                  motion={index === 0 ? "clip-left" : "clip-right"}
                  parallax={0.018}
                />
                <div className="segment-text">
                  <h3>{segment.title}</h3>
                  <p className="segment-lead">{segment.lead}</p>
                  <p>{segment.description}</p>
                  <a
                    className="site-text-link"
                    href={contactLink}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Conheça essa etapa: ${segment.title}`}
                  >
                    Conheça essa etapa <ArrowUpRight size={20} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section id="estrutura" tabIndex={-1} className="school-spaces">
          <div className="section-wrap">
            <div className="spaces-heading">
              <h2>
                O próximo encontro
                <br />
                <em>pode ser aqui.</em>
              </h2>
              <p>
                Há detalhes que uma visita conta melhor. Venha conhecer os
                ambientes e as áreas de convivência da Peralta.
              </p>
            </div>
            <div className="spaces-mosaic">
              <figure>
                <PhotoFrame
                  photo={photos.structureMain}
                  title="No pátio da escola"
                  number="5"
                  motion="clip-left"
                  parallax={0.02}
                />
                <figcaption>Vida que acontece no pátio.</figcaption>
              </figure>
              <div className="spaces-detail">
                <figure>
                  <PhotoFrame
                    photo={photos.structureDetail}
                    title="Convivência na Peralta"
                    number="6"
                    motion="clip-right"
                    parallax={0.02}
                  />
                  <figcaption>Um registro do nosso cotidiano.</figcaption>
                </figure>
                <a
                  className="visit-note"
                  href={contactLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Flower />
                  <span>
                    Uma visita conta
                    <br />
                    muito mais.
                  </span>
                  <ArrowUpRight size={28} />
                </a>
              </div>
            </div>
          </div>
        </section>
        <LifeGallery />
        <section id="matriculas" tabIndex={-1} className="school-invitation">
          <div className="section-wrap invitation-layout">
            <Flower className="invitation-flower" />
            <h2>
              Vamos começar
              <br />
              <em>uma nova história?</em>
            </h2>
            <div className="invitation-copy">
              <p>{content.cta.description}</p>
              <a
                className="site-button button-sun"
                href={contactLink}
                target="_blank"
                rel="noreferrer"
              >
                Agendar uma visita <ArrowUpRight size={21} />
              </a>
            </div>
            <Trail className="invitation-trail" />
          </div>
        </section>
        <section id="contato" tabIndex={-1} className="school-contact">
          <div className="section-wrap">
            <div className="contact-heading">
              <h2>
                A descoberta
                <br />
                <em>tem endereço.</em>
              </h2>
              <p>
                A gente se encontra em Gravatá.
                <br />
                Venha conhecer a Escola Peralta de perto.
              </p>
            </div>
            <div className="contact-layout">
              <div className="contact-intro">
                <span className="address-icon">
                  <MapPin size={30} />
                </span>
                <h3>
                  Esperamos <br />
                  por você.
                </h3>
                <address>
                  {school.address}
                  <br />
                  {school.city}
                </address>
                <a
                  className="site-button"
                  href={school.maps}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Navigation size={19} /> Como chegar
                </a>
                <a
                  className="site-text-link"
                  href={contactLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle size={19} /> Fale com a escola
                </a>
                <span className="contact-number">{school.whatsappLabel}</span>
                <Flower className="contact-flower" />
              </div>
              <div className="contact-map" data-reveal="clip-right">
                <iframe
                  title="Localização da Escola Peralta no Google Maps"
                  src={school.mapsEmbed}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <a
                  className="contact-map-footer"
                  href={school.maps}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>
                    <strong>Escola Peralta</strong>Rua Izaltino Poggi, 73 ·
                    Prado · Gravatá
                  </span>
                  <ArrowUpRight size={25} />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="school-footer">
        <div className="section-wrap">
          <div className="footer-opening">
            <p>
              O mundo é grande.
              <br />
              <em>O começo é aqui.</em>
            </p>
            <a
              href={contactLink}
              className="footer-visit"
              target="_blank"
              rel="noreferrer"
            >
              <Flower />
              <span>
                Vem conhecer <br />a Peralta!
              </span>
              <ArrowUpRight size={24} />
            </a>
          </div>
          <div className="footer-main">
            <div className="footer-brand">
              <Link to="/" aria-label="Escola Peralta — início">
                <img
                  src={logo}
                  alt="Logo da Escola Peralta"
                  width={180}
                  height={180}
                  loading="lazy"
                />
              </Link>
              <p>
                Educação Infantil e Ensino Fundamental I.
                <br />
                Gravatá · Pernambuco.
              </p>
            </div>
            <nav aria-label="Rodapé">
              <h2>Explore a Peralta</h2>
              <a href="#escola">A Escola</a>
              <a href="#proposta">Proposta pedagógica</a>
              <a href="#caderno">Caderno Vivo</a>
              <a href="#ensino">Ensino</a>
              <a href="#estrutura">Estrutura</a>
              <a href="#projetos">Projetos e vivências</a>
            </nav>
            <div className="footer-connect">
              <h2>Vamos conversar</h2>
              <a href={contactLink} target="_blank" rel="noreferrer">
                <MessageCircle size={18} />
                {school.whatsappLabel}
              </a>
              <a href={school.instagram} target="_blank" rel="noreferrer">
                <Instagram size={18} />
                {school.instagramHandle}
              </a>
              <a
                href={school.maps}
                target="_blank"
                rel="noreferrer"
                className="footer-address"
              >
                {school.address}
                <br />
                {school.city}
                <ArrowUpRight size={18} />
              </a>
              <Link className="footer-portal" to="/portal/login">
                Portal do Professor <ArrowUpRight size={18} />
              </Link>
            </div>
          </div>
          <div className="footer-word" aria-hidden="true">
            peralta
            <Flower />
          </div>
          <div className="footer-end">
            <span>© {new Date().getFullYear()} Escola Peralta</span>
            <span>
              Desenvolvido por{" "}
              <a
                href="https://murilogabriel.com.br"
                target="_blank"
                rel="noopener noreferrer"
              >
                Murilo Gabriel <ArrowUpRight size={14} />
              </a>
            </span>
            <a href="#inicio">
              Voltar ao início <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </footer>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
    </SiteMotion>
  );
}
