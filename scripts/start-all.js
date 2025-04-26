const { spawn } = require('child_process');
const path = require('path');

// Function to start a service
function startService(command, args, options) {
  const process = spawn(command, args, options);
  
  process.stdout.on('data', (data) => {
    console.log(`${options.cwd ? `[${path.basename(options.cwd)}] ` : ''}${data}`);
  });

  process.stderr.on('data', (data) => {
    console.error(`${options.cwd ? `[${path.basename(options.cwd)}] ` : ''}${data}`);
  });

  return process;
}

// Start frontend
const frontend = startService('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, '../frontend'),
  shell: true
});

// Start tailwind
const tailwind = startService('npx', ['@tailwindcss/cli', '-i', './src/input.css', '-o', './src/output.css', '--watch'], {
  cwd: path.join(__dirname, '../frontend'),
  shell: true
});

// Start backend
const backend = startService('node', ['src/index.js'], {
  cwd: path.join(__dirname, '../backend'),
  shell: true
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down all services...');
  frontend.kill();
  backend.kill();
  tailwind.kill();
  process.exit();
}); 