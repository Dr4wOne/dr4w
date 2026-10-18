import './pixel/pixel-tokens.css'
import './pixel/pieces/cannon-long.generated.css'
import './devices.css'
import { DeviceFigure, type Part } from './device.ts'

/** Fig. 02: the arm cannon (Daniel's pixel piece from the sheet's weapon system). Hold to charge,
 * release to fire; vents and the sight cycle. Effects are overlays; charging recolours the glow tokens. */
export class Dr4wCannon extends DeviceFigure {
  name = 'Arm cannon'
  parts: readonly Part[] = [
    {
      id: 'charge',
      label: 'Charge and fire',
      line: 'Built to hunt people. Aimed at the hunt.',
      states: ['ready', 'charging', 'fired'],
      hold: { down: 'charging', up: 'fired' },
    },
    {
      id: 'vents',
      label: 'Heat vents',
      line: 'Every shot costs heat.',
      states: ['closed', 'open'],
    },
    { id: 'sight', label: 'Sight', line: 'He decides the target.', states: ['off', 'scan'] },
  ]
  drawing = `
    <div class="cn">
      <div class="cn-art"><div class="pc-cannon-long"></div></div>
      <div class="cn-vents">${'<i></i>'.repeat(3)}</div>
      <div class="cn-steams">${'<i></i>'.repeat(3)}</div>
      <i class="cn-flash"></i><i class="cn-bolt"></i><i class="cn-laser"></i>
      <div class="cn-meter">${'<i></i>'.repeat(5)}</div>
    </div>`
}

if (!customElements.get('dr4w-cannon')) customElements.define('dr4w-cannon', Dr4wCannon)
