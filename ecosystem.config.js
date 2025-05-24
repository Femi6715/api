module.exports = {
  apps: [{
    name: "padilotto-api",
    script: "./server.js",
    instances: "max",
    exec_mode: "cluster",
    env: {
      NODE_ENV: "production",
      PORT: 8080
    },
    env_production: {
      NODE_ENV: "production",
      PORT: 8080
    }
  }]
}; 