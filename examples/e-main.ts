import { getUserPkgManager, isBunRuntime } from "~/pkgman.js";

async function main() {
  const pkgManager = await getUserPkgManager();
  console.log({ pkgManager });

  const envBun = isBunRuntime();
  console.log({ envBun });
}

await main();
