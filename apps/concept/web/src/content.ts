// Public copy only. The full canon (with chapter 5) is kept outside this repo.

export const chapters = [
  {
    name: 'Solar Scrap Yard',
    blurb:
      'A dead power plant still feeds the patrols. DR4W claws out of his tomb and follows human traces — until Scrap Hound catches his scent. Now the network knows a hunter has gone rogue.',
    boss: 'Scrap Hound',
    tagline: "It doesn't speak. It hunts.",
  },
  {
    name: 'Dead Signal Tower',
    blurb:
      'One tower keeps every patrol in step. On the climb, a name breaks through the static: the Crown. At the top, Widow Relay waits.',
    boss: 'Widow Relay',
    tagline: 'She keeps the hunt in sync.',
  },
  {
    name: 'Purge Core',
    blurb:
      "Deep underground, the war's last protocols became a religion. Bastion Executor guards the gate, everything DR4W was built to be. To pass, he must refuse it.",
    boss: 'Bastion Executor',
    tagline: 'Function defines existence.',
  },
  {
    name: 'Memory Archive',
    blurb:
      'Inside the Purge Core, the archive rewrites what DR4W remembers, one record at a time. The Memory Censor wants him clean and obedient. He keeps the broken truth instead.',
    boss: 'Memory Censor',
    tagline: 'What you remember is policy.',
  },
] as const

export const lockedChapter = { name: 'The Crown', blurb: 'The hunt has a centre. Coming soon.' }

export const facts = [
  { value: '2194', note: 'The war is over' },
  { value: '5 chapters', note: 'Four stages and the Crown' },
  { value: '5 bosses', note: 'One centre' },
  { value: 'In development', note: 'Action platformer' },
] as const

export type Art = { file: string; alt: string; w: number; h: number; caption: string }

const art = {
  title: {
    file: 'title-screen',
    alt: 'Title screen: DR4W on a ledge under a red moon, a ruined city behind him',
    w: 1536,
    h: 1024,
    caption: 'Title screen',
  },
  story: {
    file: 'story-page',
    alt: 'Six-panel story page: DR4W told to hunt, survivors suffering, a relay tower sending a signal, his eyes turning from red to cyan',
    w: 1536,
    h: 1024,
    caption: 'Story page six',
  },
  sheet: {
    file: 'character-sheet',
    alt: 'DR4W character sheet: cel-shaded armour, arm cannon, poses',
    w: 1149,
    h: 1369,
    caption: 'Character sheet',
  },
  intro: {
    file: 'intro-frame',
    alt: 'Intro frame: DR4W asleep in a glowing stasis tube between red-lit consoles',
    w: 1536,
    h: 1024,
    caption: 'Intro frame: the tomb',
  },
  pixel: {
    file: 'pixel-study',
    alt: 'DR4W in pixel art, standing, red eyes lit',
    w: 1024,
    h: 1536,
    caption: 'DR4W, pixel study',
  },
  sprites: {
    file: 'sprite-sheet',
    alt: 'Pixel sprite sheet: idle, run, jump, shoot, dash and climb frames',
    w: 1122,
    h: 1402,
    caption: 'Sprite sheet',
  },
} satisfies Record<string, Art>

export const introArt = art.intro
export const huntArt = art.story
export const band: Art[] = [art.title, art.sheet, art.pixel, art.sprites]
