module.exports = {
  apps: [
    {
      name: 'rdc-api',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3101',
      cwd: '/Users/renguofeng/Downloads/新建文件夹16/drug',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3101
      },
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '500M',
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false,
      autorestart: true
    }
  ]
};
