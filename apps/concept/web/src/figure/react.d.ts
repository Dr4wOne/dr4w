import type { HTMLAttributes } from 'react'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'dr4w-figure': HTMLAttributes<HTMLElement>
    }
  }
}
