import { sveltekit } from "@sveltejs/kit/vite";
import houdini from "houdini/vite";
import { defineConfig, loadEnv } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };

  return defineConfig({
    plugins: [houdini(), sveltekit(), basicSsl()],
    resolve: {
      alias: {
        $lib: "./src/lib",
        $houdini: "./$houdini",
      },
    },
    server: {
      host: "0.0.0.0",
      proxy: {},
      hmr: false,
      port: 5174,
    },
  });
};

