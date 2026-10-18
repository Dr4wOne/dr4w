// DR4W's pixel rig markup (Daniel's dr4w-css): nested groups are the skeleton, each `.px` is one generated
// part (pixels as box-shadows), each `.hs` a real button that moves with its part. `hotspots: false`
// gives a decorative copy (e.g. inside the stasis tube).
const PARTS = {
  leg_l: 'Legs: dash',
  leg_r: 'Legs: dash',
  pelvis: 'Thrusters: jump',
  torso: 'Core',
  antenna: 'Antenna',
  head: 'Visor',
  arm_cannon: 'Shoulder: aim',
  cannon: 'Arm cannon: fire',
  arm_blade: 'Arm: slash',
  blade: 'Heat blade',
} as const

export type RigPart = keyof typeof PARTS

export function rigMarkup(hotspots = true) {
  const part = (id: RigPart) =>
    `<i class="px p-${id}"></i>${hotspots ? `<button type="button" class="hs hs-${id}" data-part="${id}" aria-label="${PARTS[id]}"></button>` : ''}`
  return `<div class="dr4w" data-state="idle">
<div class="g g-leg_l">${part('leg_l')}</div>
<div class="g g-leg_r">${part('leg_r')}</div>
<div class="g g-pelvis">${part('pelvis')}
<div class="g g-torso">${part('torso')}
<div class="g g-head" data-visor="red"><div class="g g-antenna" data-ext="1">${part('antenna')}</div>${part('head')}</div>
<div class="g g-arm_cannon">${part('arm_cannon')}<div class="g g-cannon">${part('cannon')}<b class="beam"></b></div></div>
<div class="g g-arm_blade">${part('arm_blade')}<div class="g g-blade" data-heat="1">${part('blade')}</div></div>
</div></div></div>`
}
