module.exports = {
  apps: [
    {
      name: 'opm-backend',
      script: 'server.js',
      cwd: '/var/www/OPMNEW/server',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/www/OPMNEW/logs/err.log',
      out_file: '/var/www/OPMNEW/logs/out.log',
      log_file: '/var/www/OPMNEW/logs/combined.log',
      time: true,
      restart_delay: 5000
    }
  ]
};