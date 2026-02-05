import { defineConfig } from "cypress";

export default defineConfig({
  allowCypressEnv: true,
  env: {
    e2eDelay: 150, // Central delay for visual monitoring (ms)
  },
  e2e: {
    baseUrl: 'http://localhost:4210',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
