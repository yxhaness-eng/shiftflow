const { execSync } = require('child_process');

execSync('git config http.proxy http://127.0.0.1:10809');
execSync('git config http.sslBackend openssl');

for (let i = 1; i <= 6; i++) {
  try {
    console.log(`Pushing to origin main (attempt ${i})...`);
    execSync('git push origin main', { stdio: 'inherit' });
    console.log('Push to origin main SUCCESS!');
    process.exit(0);
  } catch (e) {
    console.log(`Attempt ${i} failed. Retrying...`);
    execSync('node -e "setTimeout(()=>{}, 2000)"');
  }
}
process.exit(1);
