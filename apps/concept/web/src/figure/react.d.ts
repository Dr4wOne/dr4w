import type { HTMLAttributes } from 'react'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'dr4w-rig': HTMLAttributes<HTMLElement>
      'dr4w-cannon': HTMLAttributes<HTMLElement>
      'dr4w-tube': HTMLAttributes<HTMLElement>
    }
  }
}
