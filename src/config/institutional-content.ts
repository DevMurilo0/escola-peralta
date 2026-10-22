/** Public website only. Editorial copy is editable, not an official slogan.
 * Evidence and authorization status: docs/BRAND.md.
 * Only assign local image paths after confirming permission to publish.
 */
export type SchoolPhoto = {
  src: string;
  alt: string;
  position?: string;
  mobilePosition?: string;
};
export const institutional = {
  hero: {
    eyebrow: "Educação Infantil e Ensino Fundamental I",
    title: "Um lugar para aprender,",
    emphasis: "conviver e crescer.",
    description:
      "Em Gravatá, cada descoberta merece espaço. Educação Infantil e Ensino Fundamental I com histórias para viver, aprender e compartilhar.",
  },
  about: {
    title: "Uma escola próxima das crianças e das famílias.",
    description:
      "A Escola Peralta é um espaço de encontro entre infância, aprendizagem e convivência. Em Gravatá, aproxima famílias e educadores com um cotidiano feito de experiências e descobertas.",
    invitation:
      "As fotografias mostram momentos reais da rotina. Para conhecer o espaço, as turmas e a equipe, nada substitui uma visita.",
  },
  pedagogy: {
    title: "Aprender começa pela curiosidade.",
    description:
      "Experimentar, fazer perguntas e viver novas experiências: pequenos gestos que podem abrir grandes caminhos de aprendizagem.",
    concepts: [
      {
        title: "Descoberta",
        text: "Curiosidade para observar, perguntar e encontrar novos caminhos.",
      },
      {
        title: "Participação",
        text: "Espaço para expressar ideias e participar da aprendizagem.",
      },
      {
        title: "Convivência",
        text: "Aprender também acontece no encontro e na troca com o outro.",
      },
    ],
  },
  segments: [
    {
      title: "Educação Infantil",
      lead: "O mundo é uma descoberta.",
      description:
        "Brincar, imaginar, explorar. Conheça a proposta da Peralta para os primeiros passos da vida escolar.",
      detail: "Infância • experiências • descobertas",
    },
    {
      title: "Ensino Fundamental I",
      lead: "Cada pergunta abre um caminho.",
      description:
        "Uma nova etapa para ampliar conhecimentos e viver outras descobertas. Converse com a equipe sobre o percurso de aprendizagem.",
      detail: "Conhecimento • participação • convivência",
    },
  ],
  cta: {
    title: "Venha conhecer a Peralta.",
    description:
      "Uma conversa, uma visita e um novo começo. Nossa equipe espera por você.",
  },
  photos: {
    hero: {
      src: "/images/school/hero-escola.webp",
      alt: "Estudantes reunidas no pátio da Escola Peralta",
      position: "50% 36%",
      mobilePosition: "50% 43%",
    },
    about: {
      src: "/images/school/escola-cotidiano.webp",
      alt: "Crianças reunidas em atividade coletiva na Escola Peralta",
      position: "50% 48%",
      mobilePosition: "50% 50%",
    },
    infantil: {
      src: "/images/school/educacao-infantil.webp",
      alt: "Criança participando de atividade com frutas na Escola Peralta",
      position: "50% 42%",
      mobilePosition: "50% 45%",
    },
    fundamental: {
      src: "/images/school/fundamental.webp",
      alt: "Estudante em momento de convivência no pátio da Escola Peralta",
      position: "50% 38%",
      mobilePosition: "50% 42%",
    },
    structureMain: {
      src: "/images/school/estrutura-patio.webp",
      alt: "Área externa com brinquedos coloridos na Escola Peralta",
      position: "50% 40%",
      mobilePosition: "50% 42%",
    },
    structureDetail: {
      src: "/images/school/estrutura-convivencia.webp",
      alt: "Banco e área de convivência da Escola Peralta",
      position: "50% 40%",
      mobilePosition: "50% 42%",
    },
    lifeProject: {
      src: "/images/school/vivencia-03.webp",
      alt: "Criança participando de atividade na Escola Peralta",
      position: "50% 43%",
    },
    lifePlay: {
      src: "/images/school/vivencia-02.webp",
      alt: "Estudantes em atividade de convivência na Escola Peralta",
      position: "50% 42%",
    },
    lifeTogether: {
      src: "/images/school/vivencia-01.webp",
      alt: "Aluna em atividade na Escola Peralta",
      position: "50% 42%",
    },
  },
};
