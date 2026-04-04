const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'src/pages');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

const icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;

files.forEach(f => {
  const filePath = path.join(dir, f);
  let content = fs.readFileSync(filePath, 'utf8');
  // Handle both possible active variations safely
  content = content.replace(/\{ name: 'Privacy & Compliance', href: '\/privacy-compliance', active: ([a-z]+), icon:\s*\},/g, 
    `{ name: 'Privacy & Compliance', href: '/privacy-compliance', active: $1, icon: ${icon} },`);
  fs.writeFileSync(filePath, content);
});
console.log("Fixed!");
