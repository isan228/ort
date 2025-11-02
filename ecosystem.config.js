module.exports = {
  apps: [
    {
      name: 'ort-server',
      script: './server/index.js',
      cwd: '/var/www/ort',
      instances: 1,
      exec_mode: 'fork',
      env_file: './server/.env',  // PM2 автоматически загрузит переменные из этого файла
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        // PM2 также загрузит все переменные из ./server/.env автоматически
      },
      error_file: './logs/server-error.log',
      out_file: './logs/server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '500M',
      min_uptime: '10s',
      max_restarts: 10
    }
  ]
};

