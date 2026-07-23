import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Dọn DOM sau mỗi test (globals=false nên tự đăng ký afterEach).
afterEach(() => {
  cleanup()
})
