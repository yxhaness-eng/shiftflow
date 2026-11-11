const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const distDir = path.resolve('dist');

// Add .nojekyll so GitHub Pages does not run Jekyll and processes all files
fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
// Add 404.html copy so routing never 404s
fs.copyFileSync(path.join(distDir, 'index.html'), path.join(distDir, '404.html'));

console.log('Prepared dist with .nojekyll and 404.html');

// Clean any previous git inside dist
const distGit = path.join(distDir, '.git');
if (fs.existsSync(distGit)) {
  fs.rmSync(distGit, { recursive: true, force: true });
}

execSync('git init', { cwd: distDir });
execSync('git config user.name "ShiftFlow Deployer"', { cwd: distDir });
execSync('git config user.email "deployer@shiftflow.local"', { cwd: distDir });
execSync('git add -A', { cwd: distDir });
execSync('git commit -m "Deploy compiled build to gh-pages"', { cwd: distDir });
execSync('git branch -M gh-pages', { cwd: distDir });
execSync('git remote add origin https://github.com/yxhaness-eng/shiftflow.git', { cwd: distDir });
console.log('Pushing to gh-pages branch on GitHub...');
execSync('git push -f origin gh-pages', { cwd: distDir, stdio: 'inherit' });
console.log('SUCCESS! Pushed to gh-pages branch!');
