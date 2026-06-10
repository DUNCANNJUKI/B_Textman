module.exports = {
  apps: [
    {
      name: 'bspot-app',
      script: 'npm',
      args: 'run preview -- --port 8080',
      env: {
        NODE_ENV: 'production',
        PORT: 8080,
      },
    },
  ],
};
