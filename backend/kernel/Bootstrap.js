const kernel = require("./ApplicationKernel");

/**
 * Bootstrap function.
 * Initializes the ApplicationKernel and registers process termination hooks.
 * @returns {Promise<ServiceContainer>}
 */
async function bootstrap() {
  try {
    await kernel.boot();

    // Clean shutdown handles
    process.on("SIGINT", async () => {
      console.log("\nSIGINT received. Closing AEVORIN handles...");
      await kernel.shutdown();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      console.log("\nSIGTERM received. Closing AEVORIN handles...");
      await kernel.shutdown();
      process.exit(0);
    });

    return kernel.getContainer();
  } catch (error) {
    console.error("[Bootstrap] Critical failure booting kernel:", error);
    throw error;
  }
}

module.exports = bootstrap;
