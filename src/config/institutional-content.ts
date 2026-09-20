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
const slot = (alt: string): SchoolPhoto => ({
  src: "",
  alt,
  position: "50% 50%",
  mobilePosition: "50% 50%",
});
export const institutional = {
  hero: {
    eyebrow: "Educação Infantil e Ensino Fundamental I",
    title: "Um lugar para aprender,",
    emphasis: "conviver e crescer.",
    description:
      "Na Escola Peralta, infância e aprendizagem caminham juntas em um ambiente de cuidado, curiosidade e presença.",
  },
  about: {
    title: "Uma escola próxima das crianças e das famílias.",
    description:
      "A Escola Peralta faz parte da vida de famílias de Gravatá, com Educação Infantil e Ensino Fundamental I. Na sua apresentação pública, uma ideia ganha destaque: educar com valores.",
    invitation:
      "Conhecer a escola é também conhecer quem estará perto da sua criança. Venha conversar com a nossa equipe.",
  },
  pedagogy: {
    title: "Aprender começa pela curiosidade.",
    description:
      "Perguntar, experimentar e trocar ideias fazem parte da construção do conhecimento. Conheça com a equipe como a proposta pedagógica acontece em cada etapa.",
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
      src: "",
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
      src: "",
      alt: "Criança participando de atividade com frutas na Escola Peralta",
      position: "50% 42%",
      mobilePosition: "50% 45%",
    },
    fundamental: {
      src: "",
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
    lifeProject: slot("Projeto realizado na Escola Peralta"),
    lifePlay: slot("Momento de brincadeira na Escola Peralta"),
    lifeTogether: slot("Encontro ou evento na Escola Peralta"),
  },
};
