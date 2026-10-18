import './devices.css'
import { DeviceFigure, type Part } from './device.ts'
import { rigMarkup } from './pixel/rig-markup.ts'
import './rig.css'

/** Fig. 08: the stasis tube, the tomb where DR4W wakes in chapter 1. Drain, release, open, wake. */
export class Dr4wTube extends DeviceFigure {
  name = 'Stasis tube'
  parts: readonly Part[] = [
    {
      id: 'fluid',
      label: 'Drain',
      line: 'Years of sleep, draining away.',
      states: ['full', 'draining', 'empty'],
    },
    {
      id: 'clamps',
      label: 'Clamps',
      line: 'Nothing holds him now.',
      states: ['locked', 'released'],
    },
    { id: 'glass', label: 'Glass', line: 'The tomb opens.', states: ['closed', 'open'] },
    {
      id: 'wake',
      label: 'Wake',
      line: '…if anyone hears this… we’re still here.',
      states: ['asleep', 'waking', 'awake'],
    },
  ]
  drawing = `
    <div class="tb">
      <div class="tb-cap"></div>
      <div class="tb-inside">
        <div class="tb-unit"><div class="rig-zoom">${rigMarkup(false)}</div></div>
        <div class="tb-fluid">${'<i class="tb-bubble"></i>'.repeat(5)}</div>
        <i class="tb-clamp tb-clamp-l"></i><i class="tb-clamp tb-clamp-r"></i>
        <div class="tb-glass"></div>
      </div>
      <div class="tb-base"><i class="tb-lamp"></i><i class="tb-lamp"></i><i class="tb-lamp"></i></div>
      <div class="tb-panel">
        <p>UNIT: <b>DR4W</b></p>
        <p>HUNT PROTOCOL: <b class="tb-proto">ACTIVE</b></p>
        <p>MISSION: <b class="tb-mission">SURVIVE</b></p>
      </div>
    </div>`
}

if (!customElements.get('dr4w-tube')) customElements.define('dr4w-tube', Dr4wTube)
