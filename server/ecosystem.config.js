module.exports = {
  apps: [
    {
      name: 'hear-me-out-cake-server',
      script: 'server.js',
      ignore_watch: ['node_modules', 'uploads'],
      exec_mode: 'cluster',
      instances: 'max',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
};