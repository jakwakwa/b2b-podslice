import "@testing-library/jest-dom"
import { afterEach } from "vitest"
import { cleanup } from "@testing-library/react"

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    }
  },
  usePathname() {
    return "/"
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  redirect: vi.fn(),
}))

// Mock Next.js Image
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    ...props
  }: {
    src: string
    alt: string
    [key: string]: unknown
  }) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img src={src} alt={alt} {...props} />
  },
}))

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode
    href: string
    [key: string]: unknown
  }) => {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  },
}))

