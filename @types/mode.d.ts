declare module '*.png'
declare module '*.vue'
declare var process: {
    env: {
        NODE_ENV: 'development' | 'production'
    }
}