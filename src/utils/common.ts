import { customAlphabet } from 'nanoid';
import type { Variable } from '@/types';

// ===== 时间格式化 =====

/** 相对时间格式化 */
export function formatTime(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60_000) return '刚刚';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}分钟前`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}小时前`;
  if (diff < 2592000_000) return `${Math.floor(diff / 86400_000)}天前`;
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** 短 id 生成器，避免下划线等特殊字符 */
const nano = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 12);

/** 生成 12 位实例 id */
export function genId(): string {
  return nano();
}

/** 带前缀生成 id，便于辨识 */
export function genIdWithPrefix(prefix: string): string {
  return `${prefix}_${nano()}`;
}

const PREFIX = 'low_code_platform:';

export const storageKeys = {
  apps: `${PREFIX}apps`,
} as const;

/** 读取并解析 JSON，失败返回 fallback */
export function readJson<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** 写入 JSON */
export function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

/** 移除指定 key */
export function removeKey(key: string): void {
  localStorage.removeItem(key);
}

const VAR_PATTERN = /\{\{\s*([\w-]+)\s*\}\}/g;

/** 将文本中的 {{变量名}} 替换为变量运行时值 */
export function resolveTemplate(
  text: string,
  values: Record<string, string | number | boolean>,
): string {
  return text.replace(VAR_PATTERN, (match, name: string) => {
    const v = values[name];
    return v === undefined || v === null ? match : String(v);
  });
}

/** 递归解析任意值的变量引用（仅对字符串做模板替换，其他类型原样返回） */
export function resolveValue(
  value: unknown,
  values: Record<string, string | number | boolean>,
): unknown {
  if (typeof value === 'string') return resolveTemplate(value, values);
  return value;
}

/** 从变量定义列表构造运行时初值表（name → defaultValue） */
export function buildInitialValues(
  variables: Variable[],
): Record<string, string | number | boolean> {
  const map: Record<string, string | number | boolean> = {};
  for (const v of variables) {
    map[v.name] = v.defaultValue;
  }
  return map;
}

/** 提取文本中引用的变量名列表 */
export function extractVarNames(text: string): string[] {
  const names: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(VAR_PATTERN);
  while ((m = re.exec(text)) !== null) {
    names.push(m[1]);
  }
  return names;
}
