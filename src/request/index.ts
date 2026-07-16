/**
 * HTTP 请求封装
 *
 * 当前项目首期使用 localStorage mock，此模块为后续接入真实服务端预留。
 * 接入后端时：在 .env 中设置 VITE_USE_MOCK=false，并在 api/space.ts 中
 * 将 mock 实现替换为基于 request 的真实接口调用即可。
 */

/** 请求超时时间（毫秒） */
const DEFAULT_TIMEOUT = 15000;

/** 请求错误 */
export class RequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly url: string,
  ) {
    super(message);
    this.name = 'RequestError';
  }
}

/** 通用响应结构（后端约定） */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/** 请求配置 */
export interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** 请求体（对象会自动 JSON 序列化） */
  body?: unknown;
  /** 超时时间，默认 15s */
  timeout?: number;
  /** 是否解析 ApiResponse 包裹结构（默认 true） */
  unwrap?: boolean;
}

/** 拼接 baseURL 与路径 */
function resolveUrl(path: string): string {
  const base = import.meta.env.VITE_API_BASE_URL ?? '';
  if (/^https?:\/\//.test(path)) return path;
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

/** 统一请求入口 */
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, timeout = DEFAULT_TIMEOUT, unwrap = true, headers, ...rest } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const finalHeaders = new Headers(headers);
  let finalBody: BodyInit | undefined;

  if (body !== undefined && body !== null) {
    if (body instanceof FormData) {
      finalBody = body;
    } else {
      finalHeaders.set('Content-Type', 'application/json');
      finalBody = JSON.stringify(body);
    }
  }

  try {
    const res = await fetch(resolveUrl(path), {
      ...rest,
      headers: finalHeaders,
      body: finalBody,
      signal: controller.signal,
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
      throw new RequestError(data?.message ?? `请求失败 (${res.status})`, res.status, path);
    }

    // unwrap 模式：提取 ApiResponse.data；否则原样返回
    if (unwrap && data && typeof data === 'object' && 'code' in data) {
      const apiRes = data as ApiResponse<T>;
      if (apiRes.code !== 0 && apiRes.code !== 200) {
        throw new RequestError(apiRes.message ?? '业务错误', apiRes.code, path);
      }
      return apiRes.data;
    }
    return data as T;
  } catch (err) {
    if (err instanceof RequestError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new RequestError('请求超时', 408, path);
    }
    throw new RequestError((err as Error).message ?? '网络异常', 0, path);
  } finally {
    clearTimeout(timer);
  }
}

export const http = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
