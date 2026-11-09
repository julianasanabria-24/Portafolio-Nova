/* =========================================================
   TUS PROYECTOS — este es el único archivo que necesitas editar
   ---------------------------------------------------------
   · Para agregar un proyecto: copia un bloque { ... } de PROJECTS, pégalo y cambia los textos.
   · Imágenes: crea la carpeta assets/proyectos/<id>/ y pon ahí 1.jpg, 2.jpg, 3.jpg...
     (la lista "images" dice qué archivos busca; si un archivo no existe, se ve un marcador de color).
   · Video: pon el archivo en assets/proyectos/<id>/video.mp4 (campo "video").
   · featured: 1, 2 o 3 = sale en las carpetas de "Proyectos destacados" en ese orden.
   · Los campos vacíos ('' o []) simplemente no se muestran.
   ========================================================= */

// categorías = carpetas del escritorio Mac (color de la carpeta y nombre del archivo)
export const CATEGORIES = [
  { id: 'ux', name: 'Diseño UX/UI', folder: 'diseño_ux', color: '#EBA9C0' },
  { id: 'publicidad', name: 'Publicidad', folder: 'publicidad', color: '#AFC8E2' },
  { id: 'email', name: 'Email marketing', folder: 'email_marketing', color: '#EBD5A6' },
  { id: 'branding', name: 'Branding', folder: 'branding', color: '#F7C4A6' },
  { id: 'ilustracion', name: 'Ilustración', folder: 'ilustracion', color: '#BFE3CF' },
  { id: 'audiovisual', name: 'Audiovisual', folder: 'audiovisual', color: '#DCC6EE' }
];

const img = (id, n = 3) => Array.from({ length: n }, (_, i) => `assets/proyectos/${id}/${i + 1}.jpg`);

export const PROJECTS = [
  /* ---------- DISEÑO UX/UI ---------- */
  {
    id: 'habi', cat: 'ux', featured: 1,
    title: 'Interfaz de Habi', file: 'habi_interfaz',
    client: 'Habi', year: '', role: 'Investigación UX · Diseño de interfaz',
    tools: ['Figma'],
    // ✏️ Texto general de un proceso UX: cámbialo por los datos reales de tu investigación con Habi
    summary: 'Rediseño de la experiencia para vender una vivienda con Habi: un recorrido más claro para que las personas entiendan la oferta y avancen con confianza.',
    problem: 'Vender una vivienda genera muchas dudas: cuánto vale, cuánto tarda y qué pasos siguen. El reto era que el proceso dentro de la interfaz se sintiera simple, transparente y confiable.',
    process: [
      'Investigación: análisis de la experiencia actual y entrevistas para identificar dudas y puntos de abandono.',
      'Definición: user persona, mapa del recorrido y priorización de los problemas encontrados.',
      'Ideación: arquitectura de información y wireframes de baja fidelidad.',
      'Diseño y validación: prototipo de alta fidelidad en Figma y pruebas de usabilidad.'
    ],
    solution: 'Una interfaz con pasos claros, lenguaje sencillo y la información clave siempre a la vista, para acompañar a la persona en cada momento de la venta.',
    images: img('habi'), link: ''
  },
  {
    id: 'global-seguros', cat: 'ux',
    title: 'Interfaz de Global Seguros', file: 'global_seguros_interfaz',
    client: 'Global Seguros', year: '', role: 'Diseño de interfaz',
    tools: [], summary: 'Diseño de interfaz para Global Seguros.',
    problem: '', process: [], solution: '', images: img('global-seguros'), link: ''
  },

  /* ---------- PUBLICIDAD ---------- */
  {
    id: 'cocacola', cat: 'publicidad', featured: 3,
    title: 'Key Visual Coca-Cola, edición verano', file: 'cocacola_verano_kv',
    client: 'Coca-Cola', year: '', role: 'Dirección de arte · Key visual',
    tools: [],
    summary: 'Key visual para la edición de verano de Coca-Cola.',
    problem: 'Promover la edición de verano y lograr que se reconociera de inmediato, tanto en punto de venta como en redes sociales.',
    process: [
      'Análisis de la marca y de los códigos visuales de la edición de verano.',
      'Moodboard y bocetos de composición.',
      'Desarrollo del key visual y adaptaciones a distintos formatos.'
    ],
    solution: 'Un key visual fresco y luminoso que une los códigos de Coca-Cola con la energía del verano, pensado para adaptarse a todas las piezas de la campaña.',
    images: img('cocacola'), link: ''
  },
  {
    id: 'estereo-picnic', cat: 'publicidad',
    title: 'Evento promocional Estéreo Picnic', file: 'estereo_picnic_evento',
    client: 'Festival Estéreo Picnic', year: '', role: 'Diseño publicitario',
    tools: [], summary: 'Piezas para un evento promocional en el Festival Estéreo Picnic.',
    problem: '', process: [], solution: '', images: img('estereo-picnic'), link: ''
  },
  {
    id: 'club-gun', cat: 'publicidad',
    title: 'Pieza publicitaria Club Gun', file: 'club_gun_pieza',
    client: 'Club Gun, Bogotá', year: '', role: 'Diseño publicitario',
    tools: [], summary: 'Pieza publicitaria para el Club Gun, en Bogotá.',
    problem: '', process: [], solution: '', images: img('club-gun'), link: ''
  },

  /* ---------- EMAIL MARKETING ---------- */
  {
    id: 'dale', cat: 'email',
    title: 'Email promocional Dale', file: 'dale_email',
    client: 'Dale', year: '', role: 'Email marketing',
    tools: [], summary: 'Email promocional para Dale.',
    problem: '', process: [], solution: '', images: img('dale'), link: ''
  },
  {
    id: 'the-north-face', cat: 'email',
    title: 'Email promocional The North Face', file: 'the_north_face_email',
    client: 'The North Face', year: '', role: 'Email marketing',
    tools: [], summary: 'Email promocional para The North Face.',
    problem: '', process: [], solution: '', images: img('the-north-face'), link: ''
  },

  /* ---------- BRANDING ---------- */
  {
    id: 'restaurante', cat: 'branding', featured: 2,
    title: 'Branding de restaurante', file: 'restaurante_branding',
    client: 'Restaurante', year: '', role: 'Identidad visual · Diseño editorial',
    tools: [],
    summary: 'Renovación de la identidad visual de un restaurante, incluido el diseño de su menú.',
    problem: 'La imagen del restaurante se veía desactualizada y no reflejaba la experiencia ni la calidad de su comida, lo que le restaba atractivo frente a la competencia.',
    process: [
      'Diagnóstico de la imagen actual y búsqueda de referentes del sector.',
      'Concepto, moodboard y exploración de logotipo.',
      'Sistema visual: paleta de color, tipografías y elementos gráficos.',
      'Aplicaciones: diseño del menú y piezas de comunicación.'
    ],
    solution: 'Una identidad coherente y actual, con un menú diseñado para leerse con facilidad y transmitir la nueva personalidad del lugar.',
    images: img('restaurante', 4), link: ''
  },

  /* ---------- ILUSTRACIÓN ---------- */
  {
    id: 'posters', cat: 'ilustracion',
    title: 'Diseño de pósters', file: 'posters',
    client: '', year: '', role: 'Ilustración',
    tools: [], summary: 'Serie de pósters ilustrados.',
    problem: '', process: [], solution: '', images: img('posters'), link: ''
  },
  {
    id: 'postales', cat: 'ilustracion',
    title: 'Diseño de postales', file: 'postales',
    client: '', year: '', role: 'Ilustración',
    tools: [], summary: 'Diseño de postales ilustradas.',
    problem: '', process: [], solution: '', images: img('postales'), link: ''
  },

  /* ---------- AUDIOVISUAL ---------- */
  {
    id: 'cortometraje', cat: 'audiovisual',
    title: 'Cortometraje', file: 'cortometraje',
    client: '', year: '', role: 'Producción audiovisual',
    tools: [], summary: 'Cortometraje.',
    problem: '', process: [], solution: '', images: img('cortometraje', 1),
    video: 'assets/proyectos/cortometraje/video.mp4', link: ''
  },
  {
    id: 'storytelling', cat: 'audiovisual',
    title: 'Cortometraje de storytelling', file: 'storytelling',
    client: '', year: '', role: 'Producción audiovisual · Storytelling',
    tools: [], summary: 'Cortometraje construido desde el storytelling.',
    problem: '', process: [], solution: '', images: img('storytelling', 1),
    video: 'assets/proyectos/storytelling/video.mp4', link: ''
  },
  {
    id: 'hit', cat: 'audiovisual',
    title: 'Video promocional Hit', file: 'hit_video',
    client: 'Hit', year: '', role: 'Video para redes sociales',
    tools: [], summary: 'Video promocional de Hit para redes sociales.',
    problem: '', process: [], solution: '', images: img('hit', 1),
    video: 'assets/proyectos/hit/video.mp4', link: ''
  }
];

export const catOf = p => CATEGORIES.find(c => c.id === p.cat);
