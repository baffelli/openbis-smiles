import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import pluginRewriteAll from '@thirdroom/vite-plugin-rewrite-all';
import basicSsl from '@vitejs/plugin-basic-ssl';
//Resolve @
const path = require("path");
export default defineConfig({
    plugins: [pluginRewriteAll(), vue(), basicSsl()],
    appType: 'mpa',
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        }
    },
    server: {
        host: true,
        port: 5173,
        proxy: {
            '/openbis/': {
                ws: true,
                changeOrigin: true,
                secure: false,
                target: "https://openbis:443/openbis/openbis/rmi-application-server-v3.json",
                rewrite: (path) => {
                    const new_path = path.replace(/^\/openbis/, "")
                    console.log(path);
                    return new_path
                }
            }
        }
    }
    ,
    build:
    {
        target: 'es2020',
        supported: ['array-spread'],
    },
    optimizeDeps: {
        esbuildOptions: {
            target: "es2020",
        }
    },

}
);