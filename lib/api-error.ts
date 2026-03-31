/**
 * API 错误处理工具
 * 统一处理前端 API 调用错误
 */

export interface ApiError {
  code: string;
  message: string;
  status?: number;
  details?: unknown;
}

export type ApiResult<T> = 
  | { success: true; data: T }
  | { success: false; error: ApiError };

/**
 * 解析 fetch 错误为统一的 ApiError
 */
export function parseApiError(error: unknown, defaultMessage = "请求失败"): ApiError {
  if (error instanceof Response) {
    return {
      code: `HTTP_${error.status}`,
      message: getHttpErrorMessage(error.status),
      status: error.status,
    };
  }
  
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return {
      code: "NETWORK_ERROR",
      message: "网络连接失败，请检查网络",
    };
  }
  
  if (error instanceof Error) {
    return {
      code: "UNKNOWN_ERROR",
      message: error.message || defaultMessage,
    };
  }
  
  return {
    code: "UNKNOWN_ERROR",
    message: defaultMessage,
  };
}

/**
 * 获取 HTTP 状态码对应的错误消息
 */
function getHttpErrorMessage(status: number): string {
  const messages: Record<number, string> = {
    400: "请求参数错误",
    401: "请先登录",
    403: "没有权限访问",
    404: "请求的资源不存在",
    408: "请求超时",
    429: "请求过于频繁，请稍后再试",
    500: "服务器内部错误",
    502: "服务器网关错误",
    503: "服务暂时不可用",
    504: "服务器响应超时",
  };
  return messages[status] || `请求失败 (${status})`;
}

/**
 * 带错误处理的 fetch 包装器
 */
export async function safeFetch<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: `HTTP_${response.status}`,
          message: getHttpErrorMessage(response.status),
          status: response.status,
        },
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: parseApiError(error),
    };
  }
}

/**
 * 安全的异步函数包装器
 * 自动捕获并处理错误
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  errorMessage = "操作失败"
): Promise<ApiResult<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: parseApiError(error, errorMessage),
    };
  }
}

/**
 * 创建错误处理函数（用于 React useCallback）
 */
export function createErrorHandler(
  onError?: (error: ApiError) => void
): (error: unknown) => void {
  return (error: unknown) => {
    const apiError = parseApiError(error);
    console.error("[API Error]", apiError);
    onError?.(apiError);
  };
}