import { defineConfig, lazyPlugins } from "vite-plus";

const config = defineConfig({
  staged: {
    "*.{js,mjs,cjs,jsx,ts,tsx}": "vp check --fix",
    "*.{css,json,jsonc,md,mdx,yaml,yml}": "vp fmt --write",
  },
  fmt: {},
  lint: { options: { typeAware: true, typeCheck: true } },
  resolve: { tsconfigPaths: true },
  plugins: lazyPlugins(async () => {
    const [{ tanstackStart }, { default: viteReact }, { default: tailwindcss }, { nitro }] =
      await Promise.all([
        import("@tanstack/react-start/plugin/vite"),
        import("@vitejs/plugin-react"),
        import("@tailwindcss/vite"),
        import("nitro/vite"),
      ]);

    return [
      tanstackStart(),
      nitro({ config: { rollupConfig: { external: [/^@sentry\//] } } }),
      tailwindcss(),
      viteReact(),
    ];
  }),
});

export default config;
