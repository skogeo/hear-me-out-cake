module.exports = {
  apps: [
    {
      name: 'hear-me-out-cake-server',
      script: 'server.js',
      watch: true,
      ignore_watch: ['node_modules', 'uploads'],
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
};