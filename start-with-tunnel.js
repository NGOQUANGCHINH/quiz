const { spawn, exec } = require('child_process');

console.log('Starting Backend, Frontend, and Cloudflare Tunnel...');

// Start the existing dev script (backend + frontend)
const devProcess = spawn('npm', ['run', 'dev:local'], { stdio: 'inherit' });

// Start cloudflared tunnel
const tunnelProcess = spawn('npx', ['-y', 'cloudflared', 'tunnel', '--url', 'http://localhost:3001']);

let opened = false;

// cloudflared outputs to stderr
tunnelProcess.stderr.on('data', (data) => {
    const text = data.toString();
    process.stderr.write(text);

    // Look for the trycloudflare URL
    const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (match && !opened) {
        opened = true;
        const url = match[0];
        console.log('\n\n======================================================');
        console.log('🏠 ĐƯỜNG DẪN MÁY CÁ NHÂN CỦA BẠN (LOCAL):');
        console.log('👉 http://localhost:5173\n');
        console.log('🎉 ĐƯỜNG DẪN CHIA SẺ CHO NGƯỜI KHÁC (PUBLIC):');
        console.log('👉 ' + url);
        console.log('======================================================\n\n');
        
        // Open automatically on macOS
        exec(`open "${url}"`);
    }
});

tunnelProcess.stdout.on('data', (data) => {
    process.stdout.write(data.toString());
});

// Handle termination
process.on('SIGINT', () => {
    devProcess.kill('SIGINT');
    tunnelProcess.kill('SIGINT');
    process.exit();
});

process.on('SIGTERM', () => {
    devProcess.kill('SIGTERM');
    tunnelProcess.kill('SIGTERM');
    process.exit();
});
