import { type SVGProps } from 'react'

/** Bộ icon line dùng chung, kích thước mặc định 20px, nét 1.5. */
type IconProps = SVGProps<SVGSVGElement>

function base(props: IconProps) {
  return {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...props,
  }
}

export function MailIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  )
}

export function LockIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}

/** Logo EduRAG: ô bo góc nền tím + glyph trắng. */
export function BrandMark(props: IconProps) {
  return (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" {...props}>
      <rect width="24" height="24" rx="7" fill="#6366F1" />
      <path
        d="M7 9.5 12 7l5 2.5-5 2.5-5-2.5Z"
        stroke="#fff"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M9 11.5V14l3 1.5 3-1.5v-2.5" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
}
