export const school = {
  name: "Escola Peralta",
  instagram: "https://www.instagram.com/escolaperaltagravata/",
  instagramHandle: "@escolaperaltagravata",
  whatsapp: "",
  phone: "",
  email: "",
  address: "Rua Izaltino Poggi, 73 • Prado",
  city: "Gravatá — Pernambuco",
  maps: "https://www.google.com/maps/search/?api=1&query=Rua+Izaltino+Poggi+73+Gravata+PE",
  logo: "/images/brand/escola-peralta-logo.webp",
  heroImage: "/images/school/hero-escola.webp",
  segments: [
    {
      title: "Educação Infantil",
      description:
        "Descobrir o mundo começa com espaço para brincar, perguntar e experimentar.",
      image: "/images/school/educacao-infantil.webp",
    },
    {
      title: "Ensino Fundamental I",
      description:
        "Novas descobertas, mais autonomia e conhecimento construído a cada dia.",
      image: "/images/school/fundamental.webp",
    },
  ],
  gallery: [
    {
      src: "/images/school/vivencia-01.webp",
      alt: "Estudante com frutas durante atividade de alimentação saudável na Escola Peralta",
      caption: "Hábitos saudáveis na escola",
      position: "50% 42%",
      mobilePosition: "50% 45%",
    },
    {
      src: "/images/school/vivencia-02.webp",
      alt: "Estudantes reunidas no espaço de convivência da Escola Peralta",
      caption: "Momentos na Escola Peralta",
      position: "50% 42%",
      mobilePosition: "50% 45%",
    },
    {
      src: "/images/school/vivencia-03.webp",
      alt: "Criança organizando frutas durante atividade na Escola Peralta",
      caption: "Aprender na prática",
      position: "50% 43%",
      mobilePosition: "50% 45%",
    },
    {
      src: "/images/school/vivencia-04.webp",
      alt: "Criança preparando o lanche em sala na Escola Peralta",
      caption: "Vivências da escola",
      position: "50% 45%",
      mobilePosition: "50% 47%",
    },
    {
      src: "/images/school/vivencia-05.webp",
      alt: "Criança com fruta durante momento de alimentação na Escola Peralta",
      caption: "Escolhas saudáveis",
      position: "50% 42%",
      mobilePosition: "50% 45%",
    },
    {
      src: "/images/school/vivencia-06.webp",
      alt: "Estudante com lanche em sala na Escola Peralta",
      caption: "Cotidiano na Peralta",
      position: "50% 40%",
      mobilePosition: "50% 43%",
    },
  ],
  defaultSchoolYear: new Date().getFullYear(),
  passingGrade: 6,
  timezone: "America/Recife",
  about:
    "Na Escola Peralta, em Gravatá, a infância e a aprendizagem caminham juntas. Um espaço de educação para crianças da Educação Infantil e do Ensino Fundamental I.",
  // Redação provisória: validar história, missão, metodologia e espaços com a direção.
  mission:
    "Acolher cada criança e abrir caminhos para aprender, conviver e crescer.",
  values:
    "Respeito à infância, escuta, participação e parceria na aprendizagem.",
  pedagogy:
    "Aprender envolve explorar, trocar ideias e participar. Uma proposta inspirada na construção ativa do conhecimento.",
};
export const contactLink = school.whatsapp
  ? `https://wa.me/${school.whatsapp.replace(/\D/g, "")}`
  : school.instagram;
