/**
 * A record for storing environment variables, which can be strings or undefined.
 * This is used to read or store environment variables across different runtimes.
 */
export type EnvObject = Record<string, string | undefined>;

/**
 * Describes a minimal "Process" interface compatible with multiple runtimes.
 * Includes environment variables and partial Node.js process properties.
 */
export type Process = {
  env: EnvObject;
  versions: Record<string, string>;
} & Partial<Omit<typeof globalThis.process, "versions">>;

/**
 * Internal storage for environment variables if no global environment is available.
 * This object stays empty unless we're explicitly setting variables here.
 */
const _envShim = Object.create(null);

/**
 * Retrieves an environment object from whichever global API is available:
 * Node.js, import.meta.env, Deno, a custom global, or the shim as fallback.
 */
function _getEnv(
  useShim?: boolean,
): EnvObject | (typeof globalThis & EnvObject) {
  return (
    globalThis.process?.env ||
    import.meta.env ||
    globalThis.Deno?.env.toObject() ||
    globalThis.__env__ ||
    (useShim ? _envShim : globalThis)
  );
}

/**
 * A proxy that manages environment variables in a runtime-agnostic way.
 * Reading and writing to this object will delegate to the best available global environment source.
 */
export const env = new Proxy<EnvObject>(_envShim, {
  get(_, prop) {
    const e = _getEnv();
    return e[prop as any] ?? _envShim[prop];
  },
  has(_, prop) {
    const e = _getEnv();
    return prop in e || prop in _envShim;
  },
  set(_, prop, value) {
    const e = _getEnv(true);
    e[prop as any] = value;
    return true;
  },
  deleteProperty(_, prop) {
    if (!prop) {
      return false;
    }
    const e = _getEnv(true);
    // fully remove the key if possible

    delete e[prop as any];
    return true;
  },
  ownKeys() {
    const e = _getEnv(true);
    return Object.keys(e);
  },
});

/**
 * The current NODE_ENV value or an empty string if not set.
 */
export const nodeENV = env.NODE_ENV || "";

/**
 * Additional shims for process properties that might be needed if we're
 * not running in a standard Node.js environment.
 */
const processShims: Partial<Process> = {
  versions: {},
};

/**
 * Create a base object from the global process if it exists; otherwise, use an empty object.
 * This helps unify environment handling across Node, Deno, and other runtimes.
 */
const _process = (globalThis.process ||
  Object.create(null)) as unknown as Process;

/**
 * A "process" object that can safely be used in the libraries and apps.
 * It proxies property lookups to `_process` or `processShims`.
 */
export const process = new Proxy<Process>(_process, {
  get(target, prop: keyof Process) {
    if (prop === "env") {
      return env;
    }
    if (prop in target) {
      return target[prop];
    }
    if (prop in processShims) {
      return processShims[prop];
    }
    return undefined;
  },
});

/**
 * Converts various truthy/falsy string or boolean values to a strict boolean.
 * e.g. "false" -> false, "true" -> true, etc.
 */
export function toBoolean(val: boolean | string | undefined): boolean {
  return val ? val !== "false" : false;
}

/**
 * A string representing the platform (e.g., 'win32', 'linux', 'darwin') if available.
 */
export const platform = process.platform || "";

/**
 * Detect if the current environment is a CI environment, by checking the 'CI'
 * variable or whether a known provider indicates a CI context.
 */
export const isCI = toBoolean(env.CI);

/**
 * Detect whether the current process stdout is connected to a TTY (useful for color output).
 */
export const hasTTY = toBoolean(process.stdout?.isTTY);

/**
 * Detect if a `window` global object is present.
 * Typically indicates a browser or browser-like environment.
 */
export const hasWindow = typeof window !== "undefined";

/**
 * Detect whether the `DEBUG` environment variable is set.
 * Useful for enabling debug logs or other debug behaviors.
 */
export const isDebug = toBoolean(env.DEBUG);

/**
 * Detect whether `NODE_ENV` or a 'TEST' environment variable is set to 'test'.
 * Useful for test-specific logic or conditionals.
 */
export const isTest = nodeENV === "test" || toBoolean(env.TEST);

/**
 * Detect whether `NODE_ENV` is 'production'.
 */
export const isProduction = nodeENV === "production";

/**
 * Detect whether `NODE_ENV` is 'dev' or 'development'.
 */
export const isDevelopment = nodeENV === "dev" || nodeENV === "development";

/**
 * Indicates a minimal environment if 'MINIMAL' is set, or if running in CI,
 * or if in test mode, or if no TTY is available.
 */
export const isMinimal = toBoolean(env.MINIMAL) || isCI || isTest || !hasTTY;

/**
 * Detect whether the platform is Windows.
 */
export const isWindows = /^win/i.test(platform);

/**
 * Detect whether the platform is Linux.
 */
export const isLinux = /^linux/i.test(platform);

/**
 * Detect whether the platform is macOS (darwin kernel).
 */
export const isMacOS = /^darwin/i.test(platform);

/**
 * Detect whether ANSI color output is supported.
 * Depends on terminal features, environment variables, and CI checks.
 */
export const isColorSupported =
  !toBoolean(env.NO_COLOR) &&
  (toBoolean(env.FORCE_COLOR) ||
    ((hasTTY || isWindows) && env.TERM !== "dumb") ||
    isCI);

/**
 * Node.js version without the leading 'v', if available.
 */
export const nodeVersion =
  (process.versions?.node || "").replace(/^v/, "") || null;

/**
 * Parsed major version of Node.js, if available, or null otherwise.
 */
export const nodeMajorVersion = Number(nodeVersion?.split(".")[0]) || null;

/**
 * Identifies the name of a particular CI/CD provider or related platform.
 */
export type ProviderName =
  | ""
  | "appveyor"
  | "aws_amplify"
  | "azure_pipelines"
  | "azure_static"
  | "appcircle"
  | "bamboo"
  | "bitbucket"
  | "bitrise"
  | "buddy"
  | "buildkite"
  | "circle"
  | "cirrus"
  | "cloudflare_pages"
  | "codebuild"
  | "codefresh"
  | "drone"
  | "dsari"
  | "github_actions"
  | "gitlab"
  | "gocd"
  | "layerci"
  | "hudson"
  | "jenkins"
  | "magnum"
  | "netlify"
  | "nevercode"
  | "render"
  | "sail"
  | "semaphore"
  | "screwdriver"
  | "shippable"
  | "solano"
  | "strider"
  | "teamcity"
  | "travis"
  | "vercel"
  | "appcenter"
  | "codesandbox"
  | "stackblitz"
  | "stormkit"
  | "cleavr"
  | "zeabur"
  | "codesphere"
  | "railway"
  | "deno-deploy"
  | "firebase_app_hosting";

/**
 * Internal structure that helps map a provider to an environment variable
 * and any additional metadata.
 */
type InternalProvider = [
  providerName: Uppercase<ProviderName>,
  envName?: string,
  meta?: Record<string, any>,
];

/**
 * A list of possible providers, each containing an uppercase key, a possible environment
 * variable name, and additional metadata (if needed).
 */
const providers: InternalProvider[] = [
  ["APPVEYOR"],
  ["AWS_AMPLIFY", "AWS_APP_ID", { ci: true }],
  ["AZURE_PIPELINES", "SYSTEM_TEAMFOUNDATIONCOLLECTIONURI"],
  ["AZURE_STATIC", "INPUT_AZURE_STATIC_WEB_APPS_API_TOKEN"],
  ["APPCIRCLE", "AC_APPCIRCLE"],
  ["BAMBOO", "bamboo_planKey"],
  ["BITBUCKET", "BITBUCKET_COMMIT"],
  ["BITRISE", "BITRISE_IO"],
  ["BUDDY", "BUDDY_WORKSPACE_ID"],
  ["BUILDKITE"],
  ["CIRCLE", "CIRCLECI"],
  ["CIRRUS", "CIRRUS_CI"],
  ["CLOUDFLARE_PAGES", "CF_PAGES", { ci: true }],
  ["CODEBUILD", "CODEBUILD_BUILD_ARN"],
  ["CODEFRESH", "CF_BUILD_ID"],
  ["DRONE"],
  ["DSARI"],
  ["GITHUB_ACTIONS"],
  ["GITLAB", "GITLAB_CI"],
  ["GITLAB", "CI_MERGE_REQUEST_ID"],
  ["GOCD", "GO_PIPELINE_LABEL"],
  ["LAYERCI"],
  ["HUDSON", "HUDSON_URL"],
  ["JENKINS", "JENKINS_URL"],
  ["MAGNUM"],
  ["NETLIFY"],
  ["NETLIFY", "NETLIFY_LOCAL", { ci: false }],
  ["NEVERCODE"],
  ["RENDER"],
  ["SAIL", "SAILCI"],
  ["SEMAPHORE"],
  ["SCREWDRIVER"],
  ["SHIPPABLE"],
  ["SOLANO", "TDDIUM"],
  ["STRIDER"],
  ["TEAMCITY", "TEAMCITY_VERSION"],
  ["TRAVIS"],
  ["VERCEL", "NOW_BUILDER"],
  ["VERCEL", "VERCEL", { ci: false }],
  ["VERCEL", "VERCEL_ENV", { ci: false }],
  ["APPCENTER", "APPCENTER_BUILD_ID"],
  ["CODESANDBOX", "CODESANDBOX_SSE", { ci: false }],
  ["STACKBLITZ"],
  ["STORMKIT"],
  ["CLEAVR"],
  ["ZEABUR"],
  ["CODESPHERE", "CODESPHERE_APP_ID", { ci: true }],
  ["RAILWAY", "RAILWAY_PROJECT_ID"],
  ["RAILWAY", "RAILWAY_SERVICE_ID"],
  ["DENO-DEPLOY", "DENO_DEPLOYMENT_ID"],
  ["FIREBASE_APP_HOSTING", "FIREBASE_APP_HOSTING", { ci: true }],
];

/**
 * Describes the result of detecting a particular environment provider.
 */
export type ProviderInfo = {
  name: ProviderName;
  ci?: boolean;
  [meta: string]: any;
};

/**
 * Examines environment variables to determine if we're running on a known provider platform.
 * Also checks if we're running on StackBlitz webcontainer.
 */
function _detectProvider(): ProviderInfo {
  // Based on env
  if (process.env) {
    for (const provider of providers) {
      const envName = provider[1] || provider[0];
      if (process.env[envName]) {
        return {
          name: provider[0].toLowerCase() as ProviderName,
          ...(provider[2] as any),
        };
      }
    }
    // StackBlitz detection:
    // If "SHELL === /bin/jsh" and "process.versions.webcontainer" is present,
    // that typically indicates a StackBlitz environment.
    const shell = process.env.SHELL;
    const wcVersion = process.versions?.webcontainer;
    if (shell === "/bin/jsh" && wcVersion) {
      return {
        name: "stackblitz",
        ci: false,
      };
    }
  }
  return { name: "", ci: false };
}

/**
 * Detects provider information based on known environment variables.
 */
export const providerInfo = _detectProvider();

/**
 * The name of the detected provider, if any.
 */
export const provider: ProviderName = providerInfo.name;

/**
 * Names of supported runtimes (e.g., Node.js, Bun, Deno, etc.).
 */
export type RuntimeName =
  | "workerd"
  | "deno"
  | "netlify"
  | "node"
  | "bun"
  | "edge-light"
  | "fastly"
  | "";

/**
 * Describes information about a detected runtime.
 */
export type RuntimeInfo = { name: RuntimeName };

/**
 * Detect if the runtime is Node.js based on process.release.
 *
 * If running in Bun or Deno with Node.js compatibility mode,
 * `process.release?.name` may also appear as "node", so `isNode` can be true.
 * For a strict check of actual Node.js, we should confirm that it's *not* Bun or Deno, or compare `runtime === "node"`.
 */
export const isNode = process.release?.name === "node";

/**
 * Detect if the runtime is Bun by checking for a global Bun object or bun version info.
 */
export const isBun = !!globalThis.Bun || !!process.versions?.bun;

/**
 * Detect if the runtime is Deno by checking for a global Deno object.
 */
export const isDeno = !!globalThis.Deno;

/**
 * Detect if the runtime is Fastly by checking for a global fastly object.
 */
export const isFastly = !!globalThis.fastly;

/**
 * Detect if the runtime is Netlify by checking for a global Netlify object.
 */
export const isNetlify = !!globalThis.Netlify;

/**
 * Detect if the runtime is an edge-light environment by checking for a global EdgeRuntime object.
 */
export const isEdgeLight = !!globalThis.EdgeRuntime;

/**
 * Detect if the runtime is workerd (Cloudflare Workers) based on the userAgent.
 */
export const isWorkerd =
  globalThis.navigator?.userAgent === "Cloudflare-Workers";

/**
 * A set of checks used to identify a known runtime.
 */
const runtimeChecks: [boolean, RuntimeName][] = [
  [isNetlify, "netlify"],
  [isEdgeLight, "edge-light"],
  [isWorkerd, "workerd"],
  [isFastly, "fastly"],
  [isDeno, "deno"],
  [isBun, "bun"],
  [isNode, "node"],
];

/**
 * Detects the current runtime based on the checks above.
 */
function _detectRuntime(): RuntimeInfo | undefined {
  const detected = runtimeChecks.find(([condition]) => condition);
  if (detected) {
    return { name: detected[1] };
  }
  return undefined;
}

/**
 * Information about the detected runtime, if any.
 */
export const runtimeInfo = _detectRuntime();

/**
 * A string representing the name of the detected runtime.
 */
export const runtime: RuntimeName = runtimeInfo?.name || "";

/**
 * Because many CI providers (GitHub, GitLab, etc.) define `CI` or have known environment variables,
 * we refine `isCI` by also checking if `providerInfo.ci` is explicitly `true`.
 */
export const finalIsCI = isCI || providerInfo.ci === true;
