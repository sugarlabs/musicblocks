import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
    root: "./",
    base: "./",
    build: {
        outDir: "dist-vite",
        emptyOutDir: true,
        sourcemap: true
    },
    server: {
        port: 3000,
        strictPort: false
    },
    plugins: [
        viteStaticCopy({
            targets: [
                { src: "locales/**/*", dest: "locales" },
                { src: "sounds/**/*", dest: "sounds" },
                { src: "images/**/*", dest: "images" },
                { src: "fonts/**/*", dest: "fonts" },
                { src: "lib/**/*", dest: "lib" },
                { src: "activity/**/*", dest: "activity" },
                { src: "planet/**/*", dest: "planet" }
            ]
        })
    ]
});
