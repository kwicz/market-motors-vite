import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import { toast } from 'sonner';

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ValidationError[];
  code?: string;
  statusCode?: number;
  timestamp?: string;
  path?: string;
  method?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  received?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Request configuration with auth
interface AuthRequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean;
  skipErrorToast?: boolean;
}

// Storage keys for tokens
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
} as const;

// Base API configuration
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

class ApiClient {
  private instance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (error: unknown) => void;
  }> = [];

  constructor() {
    this.instance = axios.create(API_CONFIG);
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Add auth token if available and not skipped
        const skipAuth = (
          config as AuthRequestConfig & InternalAxiosRequestConfig
        ).skipAuth;
        if (!skipAuth) {
          const token = this.getAccessToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        // Add request ID for tracing
        config.headers['X-Request-ID'] = `req_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        // Add timestamp
        config.headers['X-Timestamp'] = new Date().toISOString();

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AuthRequestConfig & {
          _retry?: boolean;
        };

        // Handle 401 errors with token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, queue the request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then(() => {
                return this.instance(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshed = await this.refreshToken();
            if (refreshed) {
              // Process failed queue
              this.processQueue(null);
              // Retry original request
              return this.instance(originalRequest);
            }
          } catch (refreshError) {
            this.processQueue(refreshError);
            this.clearTokens();
            // Redirect to login if needed
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          } finally {
            this.isRefreshing = false;
          }
        }

        // Handle other errors
        this.handleError(error, originalRequest);
        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: unknown): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(null);
      }
    });

    this.failedQueue = [];
  }

  private handleError(error: AxiosError, config?: AuthRequestConfig): void {
    const skipErrorToast = config?.skipErrorToast;

    if (skipErrorToast) {
      return;
    }

    const response = error.response?.data as ApiResponse;
    const message =
      response?.message || error.message || 'An unexpected error occurred';

    // Show error toast for user-facing errors
    if (
      error.response?.status &&
      error.response.status >= 400 &&
      error.response.status < 500
    ) {
      toast.error(message);
    } else if (error.response?.status && error.response.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK') {
      toast.error('Network error. Please check your connection.');
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please try again.');
    }
  }

  private getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  private clearTokens(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem('auth_user');
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await axios.post(
        `${API_CONFIG.baseURL}/api/auth/refresh`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const data = response.data as ApiResponse<{
        accessToken: string;
        refreshToken: string;
      }>;

      if (data.success && data.data) {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.data.accessToken);
        localStorage.setItem(
          STORAGE_KEYS.REFRESH_TOKEN,
          data.data.refreshToken
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  // Public API methods
  public async get<T = unknown>(
    url: string,
    config?: AuthRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  public async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AuthRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.post<ApiResponse<T>>(
      url,
      data,
      config
    );
    return response.data;
  }

  public async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AuthRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  public async patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: AuthRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.patch<ApiResponse<T>>(
      url,
      data,
      config
    );
    return response.data;
  }

  public async delete<T = unknown>(
    url: string,
    config?: AuthRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  // File upload method
  public async uploadFile<T = unknown>(
    url: string,
    file: File | FormData,
    config?: AuthRequestConfig & {
      onUploadProgress?: (progressEvent: unknown) => void;
    }
  ): Promise<ApiResponse<T>> {
    const formData = file instanceof FormData ? file : new FormData();
    if (file instanceof File) {
      formData.append('file', file);
    }

    const response = await this.instance.post<ApiResponse<T>>(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  // Batch requests
  public async batch<T = unknown>(
    requests: Array<{
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      url: string;
      data?: unknown;
      config?: AuthRequestConfig;
    }>
  ): Promise<ApiResponse<T>[]> {
    const promises = requests.map((req) => {
      switch (req.method) {
        case 'GET':
          return this.get<T>(req.url, req.config);
        case 'POST':
          return this.post<T>(req.url, req.data, req.config);
        case 'PUT':
          return this.put<T>(req.url, req.data, req.config);
        case 'PATCH':
          return this.patch<T>(req.url, req.data, req.config);
        case 'DELETE':
          return this.delete<T>(req.url, req.config);
        default:
          throw new Error(`Unsupported method: ${req.method}`);
      }
    });

    return Promise.all(promises);
  }

  // Get the axios instance for advanced usage
  public getInstance(): AxiosInstance {
    return this.instance;
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient();

// Export default instance methods for convenience
export const api = {
  get: apiClient.get.bind(apiClient),
  post: apiClient.post.bind(apiClient),
  put: apiClient.put.bind(apiClient),
  patch: apiClient.patch.bind(apiClient),
  delete: apiClient.delete.bind(apiClient),
  uploadFile: apiClient.uploadFile.bind(apiClient),
  batch: apiClient.batch.bind(apiClient),
};

export default apiClient;
