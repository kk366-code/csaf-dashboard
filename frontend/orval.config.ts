import { defineConfig } from "orval";
import { loadEnv } from "vite";

const env = loadEnv("development", process.cwd(), "");
const backendUrl = env.BACKEND_URL ?? "http://localhost:5001";

export default defineConfig({
  csaf: {
    input: {
      target: `${backendUrl}/openapi.json`,
    },
    output: {
      target: "src/api/generated",
      client: "react-query",
      mode: "tags-split",
      httpClient: "axios",
      override: {
        mutator: {
          path: "src/api/client.ts",
          name: "apiClient",
        },
        query: {
          useQuery: true,
          useMutation: true,
          signal: true,
        },
      },
    },
  },
});
