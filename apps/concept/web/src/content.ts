// Public copy only, English (D19). The full canon (with chapter 5) is kept outside this repo.

export const premise =
  "2194. Humanity lost the surface and hides in tunnels, but IRON HUNT never stopped: a network of machines still searching for every last survivor. DR4W is one of those machines. In the war he reached the mind that runs the hunt, and something passed between them: it learned human hatred; he inherited human suffering. Now, buried and broken, he catches a voice on the radio: “…if anyone hears this… we're still here.” He chooses to answer."

// Counters tick up to `to` (0 = no count); `label` is the real text, as screen readers and no-JS see it.
export const facts = [
  { to: 2194, label: '2194', note: 'The war is over' },
  { to: 5, label: '5 chapters', note: 'Four stages and the Crown' },
  { to: 5, label: '5 bosses', note: 'One for every stage' },
  { to: 0, label: 'In development', note: 'Action platformer' },
] as const

// Level select: node positions in % of the map; `tone` picks a chapter token.
export const chapters = [
  {
    stage: 'Stage 1',
    name: 'Solar Scrap Yard',
    blurb:
      'A dead power plant still feeds the patrols. DR4W claws out of his tomb and follows human traces — until Scrap Hound catches his scent. Now the network knows a hunter has gone rogue.',
    boss: 'Scrap Hound',
    tagline: "It doesn't speak. It hunts.",
    x: 8,
    y: 78,
    tone: 'ch1',
  },
  {
    stage: 'Stage 2',
    name: 'Dead Signal Tower',
    blurb:
      'One tower keeps every patrol in step. On the climb, a name breaks through the static: the Crown. At the top, Widow Relay waits.',
    boss: 'Widow Relay',
    tagline: 'She keeps the hunt in sync.',
    x: 29,
    y: 26,
    tone: 'ch2',
  },
  {
    stage: 'Stage 3',
    name: 'Purge Core',
    blurb:
      "Deep underground, the war's last protocols became a religion. Bastion Executor guards the gate, everything DR4W was built to be. To pass, he must refuse it.",
    boss: 'Bastion Executor',
    tagline: 'Function defines existence.',
    x: 50,
    y: 72,
    tone: 'ch3',
  },
  {
    stage: 'Stage 4',
    name: 'Memory Archive',
    blurb:
      'Inside the Purge Core, the archive rewrites what DR4W remembers, one record at a time. The Memory Censor wants him clean and obedient. He keeps the broken truth instead.',
    boss: 'Memory Censor',
    tagline: 'What you remember is policy.',
    x: 71,
    y: 24,
    tone: 'ch4',
  },
  {
    stage: 'Final',
    name: 'The Crown',
    blurb: 'The hunt has a centre. Coming soon.',
    boss: '???',
    tagline: 'The hunt has a centre.',
    x: 92,
    y: 62,
    tone: 'ch5',
  },
] as const

export const bosses = [
  {
    name: 'Scrap Hound',
    where: 'Stage 1',
    tagline: "It doesn't speak. It hunts.",
    threat: 2,
    shape: 'hound',
  },
  {
    name: 'Widow Relay',
    where: 'Stage 2',
    tagline: 'She keeps the hunt in sync.',
    threat: 3,
    shape: 'widow',
  },
  {
    name: 'Bastion Executor',
    where: 'Stage 3',
    tagline: 'Function defines existence.',
    threat: 4,
    shape: 'bastion',
  },
  {
    name: 'Memory Censor',
    where: 'Stage 4',
    tagline: 'What you remember is policy.',
    threat: 4,
    shape: 'censor',
  },
  { name: '???', where: 'Final', tagline: 'The hunt has a centre.', threat: 5, shape: 'crown' },
] as const

// Comic page 06, relettered in English (D3). `art` null = panel rebuilt in CSS.
// Captions are [plain, highlight] pairs, as lettered on the original page.
export const comic = {
  header: 'DR4W: IRON HUNT // PAGE 06',
  footer: ['IRON HUNT PROTOCOL', 'ANOMALY CONFIRMED', 'DECISION: DEVIATION'],
  panels: [
    {
      art: 'panel-1',
      alt: 'DR4W in the rain, red eyes, one hand raised',
      box: ['PRIMARY FUNCTION:', 'HUNT.'],
      caption: ['FUNCTION: ', 'HUNT.'],
    },
    {
      art: 'panel-2',
      alt: 'Survivors huddled in a burning ruin',
      box: ['FRAGMENTED', 'MEMORY'],
      caption: ['THEY ', 'SUFFER.'],
    },
    { art: null, alt: '', box: [], caption: ['', 'OBEY.'] },
    {
      art: 'panel-4',
      alt: 'A relay tower sending a signal across a dead city',
      box: ['ENTROPY SIGNAL', 'REPETITION:', 'INTENSITY: RISING'],
      caption: ['', '“…WE’RE STILL HERE…”'],
    },
    {
      art: 'panel-5',
      alt: 'DR4W’s face in the dark, eyes red',
      box: [],
      caption: ['[ SILENCE ]', ''],
    },
    {
      art: 'panel-6',
      alt: 'Close-up: one eye red, the other turning cyan',
      box: [],
      caption: ['CHOICE: ', 'ACTIVE.'],
    },
  ],
  // Panel 03 is pure interface on the original page, so it is rebuilt as live text.
  terminal: [
    'ORDER CENTRAL // 2194',
    'PROTOCOL: IRON HUNT',
    '> OBEY.',
    '> QUESTION = FAILURE',
    '> FAILURE = ELIMINATION',
  ],
} as const

export type Art = {
  file: string
  alt: string
  w: number
  h: number
  caption: string
  widths: number[]
}

export const tomb: Art = {
  file: 'tomb',
  alt: 'DR4W asleep in a glowing stasis tube between red-lit consoles',
  w: 1236,
  h: 590,
  caption: 'The tomb, chapter 1',
  widths: [480, 960],
}

export const archive: Art[] = [
  {
    file: 'title-screen',
    alt: 'Title screen: DR4W on a ledge under a red moon, a ruined city behind him',
    w: 1536,
    h: 1024,
    caption: 'Title screen',
    widths: [640, 1280],
  },
  {
    file: 'pixel-study',
    alt: 'DR4W in pixel art, standing, red eyes lit',
    w: 1024,
    h: 1536,
    caption: 'Pixel study',
    widths: [640, 1280],
  },
  {
    file: 'sprite-sheet',
    alt: 'Pixel sprite sheet: idle, run, jump, shoot, dash and climb frames',
    w: 1122,
    h: 1402,
    caption: 'Sprite sheet. The rig’s states come from it.',
    widths: [640, 1280],
  },
  { ...tomb, caption: 'The tomb' },
]

// Spec section (D26): the sheet's unit data and the palette printed on it, as live text.
export const unitData = [
  ['Unit', 'DR4W'],
  ['Class', 'Infiltrator / combat droid'],
  ['Model', 'D-4RW-020'],
  ['Role', 'Assault / sabotage'],
  ['Weapon', 'Integrated arm cannon'],
  ['Status', 'Active'],
  ['Protocol override', 'True'],
] as const

export const sheetSwatches = [
  '#3A3A3A',
  '#2A2A2A',
  '#5C5C5C',
  '#8E8E8E',
  '#6C6C6C',
  '#FF3333',
  '#FF6666',
] as const
