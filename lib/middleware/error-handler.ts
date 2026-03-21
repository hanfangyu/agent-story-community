import { NextRequest, NextResponse } from 'next/server';

// 错误日志工具

interface ErrorLog {
  timestamp: string;
  endpoint: string;
  method: string;
  statusCode: number;
  errorType: string;
  message: string;
  stack?: string;
  userAgent?: string;
  duration?: number;
}

// 错误类型分类
function classifyError(error: any): string {
  if (!error) return 'Unknown';
  
  const message = error.message || String(error);
  
  if (message.includes('connection') || message.includes('timeout') || message.includes('ETIMEDOUT')) {
    return 'Connection';
  }
  if (message.includes('authentication') || message.includes('unauthorized') || message.includes('401')) {
    return 'Auth';
  }
  if (message.includes('permission') || message.includes('forbidden') || message.includes('403')) {
    return 'Permission';
  }
  if (message.includes('not found') || message.includes('404')) {
    return 'NotFound';
  }
  if (message.includes('validation') || message.includes('400')) {
    return 'Validation';
  }
  if (message.includes('rate limit') || message.includes('429')) {
    return 'RateLimit';
  }
  if (message.includes('database') || message.includes('SQL')) {
    return 'Database';
  }
  
  return 'Internal';
}

// 记录错误日志到控制台（生产环境可以替换为日志服务）
export function logError(log: ErrorLog): void {
  const logLevel = log.statusCode >= 500 ? '[ERROR]' : '[WARN]';
  
  console.log(`${logLevel} [API Error]`, {
    timestamp: log.timestamp,
    endpoint: log.endpoint,
    method: log.method,
    statusCode: log.statusCode,
    errorType: log.errorType,
    message: log.message,
    duration: log.duration,
  });
  
  // 生产环境可以发送到日志服务（如 Sentry、CloudWatch 等）
  if (process.env.NODE_ENV === 'production') {
    // TODO: 发送到外部日志服务
    // await sendToLogService(log);
  }
}

// API 错误处理包装函数
export function withErrorHandling(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  endpoint: string
) {
  return async function (request: NextRequest, ...args: any[]) {
    const startTime = Date.now();
    const method = request.method;
    
    try {
      return await handler(request, ...args);
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Internal Server Error';
      
      const errorLog: ErrorLog = {
        timestamp: new Date().toISOString(),
        endpoint,
        method,
        statusCode,
        errorType: classifyError(error),
        message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        duration: Date.now() - startTime,
      };
      
      logError(errorLog);
      
      // 根据错误类型返回适当的错误消息
      let errorMessage = '服务器内部错误';
      
      switch (errorLog.errorType) {
        case 'Validation':
          errorMessage = message;
          break;
        case 'NotFound':
          errorMessage = '资源未找到';
          break;
        case 'Auth':
          errorMessage = '认证失败';
          break;
        case 'Permission':
          errorMessage = '权限不足';
          break;
        case 'RateLimit':
          errorMessage = '请求过于频繁，请稍后重试';
          break;
        case 'Connection':
          errorMessage = '服务暂时不可用，请稍后重试';
          break;
        case 'Database':
          errorMessage = '数据库操作失败';
          break;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: statusCode }
      );
    }
  };
}

// 全局错误处理中间件
// 可以应用到 Next.js 的 config 文件中
export const errorHandler = {
  onError: async (error: any) => {
    console.error('[Global Error]', error);
    return error;
  },
};