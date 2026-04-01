const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

// 1. Update Strategy Page Specifics
let strategyPath = path.join(__dirname, '../src/app/strategy/page.tsx');
if (fs.existsSync(strategyPath)) {
  let content = fs.readFileSync(strategyPath, 'utf8');
  // reduce glow
  content = content.replace(/shadow-\[0_0_15px_rgba\([^)]+\)\]/g, 'shadow-md');
  // Set strategy specific colors
  content = content.replace(/bg-amber-600 hover:bg-amber-500/g, 'bg-rose-600 hover:bg-rose-500');
  content = content.replace(/bg-amber-500\/5/g, 'bg-rose-500/5');
  content = content.replace(/border-amber-500\/30/g, 'border-rose-500/30');
  content = content.replace(/text-amber-400/g, 'text-rose-400');
  content = content.replace(/bg-amber-500\/20/g, 'bg-rose-500/20');
  content = content.replace(/border-amber-500\/20/g, 'border-rose-500/20');
  content = content.replace(/bg-amber-500\/10/g, 'bg-rose-500/10');
  fs.writeFileSync(strategyPath, content, 'utf8');
}

// 2. Update globals.css
let globalsPath = path.join(__dirname, '../src/app/globals.css');
if (fs.existsSync(globalsPath)) {
  let content = fs.readFileSync(globalsPath, 'utf8');
  // Change primary to Maroon / Crimson (Hue 348)
  content = content.replace(/--primary: 30 100% 55%;/g, '--primary: 348 75% 45%;');
  content = content.replace(/--ring: 30 100% 55%;/g, '--ring: 348 75% 45%;');
  content = content.replace(/--sidebar-primary: 30 100% 55%;/g, '--sidebar-primary: 348 75% 45%;');
  content = content.replace(/--sidebar-ring: 30 100% 55%;/g, '--sidebar-ring: 348 75% 45%;');
  // Accent to Yellow (Hue 45)
  content = content.replace(/--accent: 45 100% 50%;/g, '--accent: 45 95% 55%;');
  
  // Reduce glow intensity
  content = content.replace(/box-shadow: 0 0 20px hsl\(var\(--primary\) \/ 0\.3\);/g, 'box-shadow: 0 0 10px hsl(var(--primary) / 0.15);');
  
  fs.writeFileSync(globalsPath, content, 'utf8');
}

// 3. Update tasks/page.tsx (Category Colors)
let tasksPath = path.join(__dirname, '../src/app/tasks/page.tsx');
if (fs.existsSync(tasksPath)) {
  let content = fs.readFileSync(tasksPath, 'utf8');
  content = content.replace(/color: 'text-amber-400',\s*activeClass: 'bg-amber-400\/15 text-amber-400 border-amber-400\/40'/g, 
    "color: 'text-rose-400',\n    activeClass: 'bg-rose-400/15 text-rose-400 border-rose-400/40'");
  fs.writeFileSync(tasksPath, content, 'utf8');
}

// 4. Update page.tsx (Dashboard Categories)
let dashboardPath = path.join(__dirname, '../src/app/page.tsx');
if (fs.existsSync(dashboardPath)) {
  let content = fs.readFileSync(dashboardPath, 'utf8');
  content = content.replace(/color: 'text-amber-400',\s*bg: 'bg-amber-400\/10',\s*border: 'border-amber-400\/20'/g,
    "color: 'text-rose-500',\n    bg: 'bg-rose-500/10',\n    border: 'border-rose-500/20'");
  fs.writeFileSync(dashboardPath, content, 'utf8');
}

// 5. TaskCard.tsx mixed colors
let taskCardPath = path.join(__dirname, '../src/components/tasks/TaskCard.tsx');
if (fs.existsSync(taskCardPath)) {
  let content = fs.readFileSync(taskCardPath, 'utf8');
  content = content.replace(/Strategy: 'text-amber-400 bg-amber-400\/10 border-amber-400\/30'/g, 
    "Strategy: 'text-rose-400 bg-rose-400/10 border-rose-400/30'");
  content = content.replace(/Career: 'text-red-400 bg-red-400\/10 border-red-400\/30'/g, 
    "Career: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'");
  fs.writeFileSync(taskCardPath, content, 'utf8');
}

console.log('Mixed colors applied! Reduced glow and set maroon/crimson primary theme.');
