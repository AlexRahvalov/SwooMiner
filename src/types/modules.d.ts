// ... existing code ...

declare module 'puppeteer' {
  export interface Page {
    on(event: string, callback: Function): void;
    evaluate(fn: Function, ...args: any[]): Promise<any>;
    waitForSelector(selector: string, options?: { timeout: number }): Promise<any>;
    goto(url: string, options?: { waitUntil: string }): Promise<any>;
    type(selector: string, text: string, options?: { delay: number }): Promise<void>;
    setExtraHTTPHeaders(headers: Record<string, string>): Promise<void>;
    setUserAgent(userAgent: string): Promise<void>;
    isClosed(): boolean;
    close(): Promise<void>;
    waitForResponse(predicate: (response: Response) => Promise<boolean>): Promise<Response>;
    screenshot(options?: { 
      fullPage?: boolean;
      type?: string;
      quality?: number;
    }): Promise<Buffer>;
  }

  export interface Response {
    ok(): boolean;
    url(): string;
    text(): Promise<string>;
  }

  export interface BrowserContext {
    newPage(): Promise<Page>;
  }

  export interface Browser {
    createBrowserContext(): Promise<BrowserContext>;
    defaultBrowserContext(): BrowserContext;
  }

  export const DEFAULT_INTERCEPT_RESOLUTION_PRIORITY: number;
  
  export default function launch(options?: any): Promise<Browser>;
}

declare module 'winston' {
  export interface Format {
    json(): any;
    simple(): any;
  }
  
  export interface TransportOptions {
    filename: string;
    format?: any;
  }
  
  export interface TransportClass {
    File: new (options: TransportOptions) => any;
    Console: new (options: { format: any }) => any;
  }
  
  export interface LoggerOptions {
    level: string;
    defaultMeta: Record<string, any>;
    format: any;
    transports: any[];
  }
  
  export interface Logger {
    error(message: string): void;
    info(message: string): void;
    verbose(message: string): void;
    debug(message: string): void;
    add(transport: any): void;
  }
  
  export const format: Format;
  export const transports: TransportClass;
  
  export function createLogger(options: LoggerOptions): Logger;
}

declare module 'ghost-cursor' {
  import { Page } from 'puppeteer';
  
  export interface GhostCursor {
    toggleRandomMove(enabled: boolean): void;
    click(selector: string): Promise<void>;
  }
  
  export function createCursor(page: Page): GhostCursor;
}

declare module 'user-agents' {
  export default class UserAgent {
    constructor(options: { deviceCategory: string });
    toString(): string;
  }
}

declare module 'fs' {
  export function readFileSync(path: string, encoding: string): string;
  export function writeFileSync(path: string, data: string): void;
  export function copyFileSync(src: string, dest: string): void;
  export function existsSync(path: string): boolean;
  export function mkdirSync(path: string, options?: { recursive?: boolean }): void;
}

declare module 'path' {
  export function join(...paths: string[]): string;
  export function dirname(path: string): string;
  export function basename(path: string, ext?: string): string;
  export function extname(path: string): string;
  export function resolve(...paths: string[]): string;
  export function isAbsolute(path: string): boolean;
  export function relative(from: string, to: string): string;
  export function parse(path: string): {
    root: string;
    dir: string;
    base: string;
    ext: string;
    name: string;
  };
}

declare module 'url' {
  export interface URL {
    href: string;
    origin: string;
    protocol: string;
    username: string;
    password: string;
    host: string;
    hostname: string;
    port: string;
    pathname: string;
    search: string;
    searchParams: URLSearchParams;
    hash: string;
    toString(): string;
    toJSON(): string;
  }

  export interface URLSearchParams {
    append(name: string, value: string): void;
    delete(name: string): void;
    get(name: string): string | null;
    getAll(name: string): string[];
    has(name: string): boolean;
    set(name: string, value: string): void;
    sort(): void;
    toString(): string;
    forEach(callback: (value: string, name: string) => void): void;
  }

  export function fileURLToPath(url: string | URL): string;
  export function pathToFileURL(path: string): URL;
}

declare module 'axios' {
  interface AxiosResponse<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    config: Record<string, any>;
  }

  interface AxiosRequestConfig {
    url?: string;
    method?: string;
    baseURL?: string;
    headers?: Record<string, string>;
    params?: any;
    data?: any;
    timeout?: number;
    withCredentials?: boolean;
    responseType?: string;
    validateStatus?: (status: number) => boolean;
  }

  interface AxiosInstance {
    request<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    head<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    options<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  }

  interface AxiosStatic extends AxiosInstance {
    create(config?: AxiosRequestConfig): AxiosInstance;
    all<T>(values: (T | Promise<T>)[]): Promise<T[]>;
    spread<T, R>(callback: (...args: T[]) => R): (array: T[]) => R;
    isCancel(value: any): boolean;
  }

  const axios: AxiosStatic;
  export default axios;
}

declare module 'puppeteer-extra' {
  export function addExtra(puppeteer: any): any;
}

declare module 'puppeteer-extra-plugin-stealth' {
  export default function StealthPlugin(): {
    enabledEvasions: Set<string>;
  };
}

declare module 'puppeteer-extra-plugin-adblocker' {
  export default function AdblockerPlugin(options: {
    interceptResolutionPriority: number;
    blockTrackers: boolean;
    useCache: boolean;
    blockTrackersAndAnnoyances: boolean;
  }): any;
}

declare module 'adm-zip' {
  export default class AdmZip {
    constructor();
    addFile(path: string, content: Buffer): Promise<void>;
    addLocalFolderPromise(path: string, options: { zipPath: string }): Promise<void>;
    writeZip(path: string): void;
  }
}

// ... existing code ...