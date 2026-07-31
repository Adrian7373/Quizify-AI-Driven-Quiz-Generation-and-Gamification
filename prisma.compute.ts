import { defineComputeConfig } from "@prisma/compute-sdk/config";

export default defineComputeConfig({
  app: {
    name: "frontend",
    framework: "nextjs",
    env: ".env",
  },
});
