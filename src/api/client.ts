import axios, { AxiosError } from 'axios'
import type { ApiError } from '@/types'
import { getAccessToken, clearAccessToken } from '@/utils/token'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

// Tự gắn JWT vào mọi request (UC 3)
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 401 = token hết hạn giữa phiên → xóa token, đưa về /login (UC 3 exception flow)
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ code?: string; message?: string }>) => {
    if (error.response?.status === 401 && !window.location.pathname.startsWith('/login')) {
      clearAccessToken()
      window.location.assign('/login')
    }
    return Promise.reject(normalizeApiError(error))
  },
)

/** Chuẩn hóa mọi lỗi về ApiError để UI không phải đọc cấu trúc axios */
function normalizeApiError(error: AxiosError<{ code?: string; message?: string }>): ApiError {
  if (error.response) {
    return {
      status: error.response.status,
      code: error.response.data?.code ?? 'SERVER_ERROR',
      message: error.response.data?.message ?? 'Có lỗi xảy ra, vui lòng thử lại.',
    }
  }
  if (error.code === 'ECONNABORTED') {
    return { status: null, code: 'TIMEOUT', message: 'Yêu cầu quá thời gian chờ, vui lòng thử lại.' }
  }
  return { status: null, code: 'NETWORK_ERROR', message: 'Không kết nối được máy chủ.' }
}
