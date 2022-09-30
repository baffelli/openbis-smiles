import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

//Resolve @
const path = require("path");
export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
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
        target: 'es2021',
        supported: ['array-spread']
    }
}
);