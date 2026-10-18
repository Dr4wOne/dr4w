import './devices.css'
import { DeviceFigure, type Part } from './device.ts'

/** Fig. 02: the arm cannon, side view. Hold to charge, release to fire; vents and the sight cycle. */
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
      <div class="cn-mount"><i class="cn-socket"></i></div>
      <div class="cn-barrel">
        <i class="cn-coil"></i>
        <i class="cn-ring" style="left:14%"></i><i class="cn-ring" style="left:20%"></i>
        <i class="cn-ring" style="left:70%"></i><i class="cn-ring" style="left:76%"></i>
        <div class="cn-meter">${'<i></i>'.repeat(5)}</div>
      </div>
      <div class="cn-vents">${'<i></i>'.repeat(3)}</div>
      <div class="cn-muzzle"><i class="cn-hot"></i></div>
      <i class="cn-flash"></i><i class="cn-bolt"></i><i class="cn-laser"></i>
      <div class="cn-steams">${'<i></i>'.repeat(3)}</div>
    </div>`
}

if (!customElements.get('dr4w-cannon')) customElements.define('dr4w-cannon', Dr4wCannon)
