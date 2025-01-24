/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable @typescript-eslint/consistent-type-definitions */
/* eslint-disable no-var */

type EnvObject = Record<string, string | undefined>;

declare global {
  /**
   * Vercel Edge environments
   */
  var EdgeRuntime: undefined | unknown;
  /**
   * Netlify Edge environment
   */
  var Netlify: undefined | unknown;
  /**
   * Fastly Compute@Edge environment
   */
  var fastly: undefined | unknown;
  /**
   * Bun runtime global
   */
  var Bun: undefined | unknown;

  /**
   * Custom environment object if nothing else is available
   */
  var __env__: undefined | EnvObject;

  /**
   * Deno runtime global
   */
  var Deno:
    | undefined
    | {
        env: {
          toObject(): EnvObject;
          [key: string]: unknown;
        };
      };

  /**
   * `import.meta.env` is commonly used in bundlers or certain runtimes.
   */
  interface ImportMeta {
    env: EnvObject;
  }
}

export {};
