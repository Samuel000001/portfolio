module.exports = {
    apps: [
        {
            name: "portfolio-server",
            script: "./server/index.js",
            env: {
                NODE_ENV: "production",
                PORT: 5000
            }
        }
    ]
};
