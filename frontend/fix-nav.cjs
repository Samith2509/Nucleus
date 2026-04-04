'use strict';
const fs   = require('fs');
const path = require('path');

const dir   = path.join(__dirname, 'src/pages');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

const fixes = [
  // Settings - missing href in many pages
  {
    from: "{ name: 'Settings', active: false, icon:",
    to:   "{ name: 'Settings', href: '/settings', active: false, icon:"
  },
  // Audit Logs - missing href
  {
    from: "{ name: 'Audit Logs', active: false, icon:",
    to:   "{ name: 'Audit Logs', href: '/audit-logs', active: false, icon:"
  },
  // Journey Builder - missing href
  {
    from: "{ name: 'Journey Builder', active: false, icon:",
    to:   "{ name: 'Journey Builder', href: '/journey-builder', active: false, icon:"
  },
  // Privacy & Compliance - missing href
  {
    from: "{ name: 'Privacy & Compliance', active: false, icon:",
    to:   "{ name: 'Privacy & Compliance', href: '/privacy-compliance', active: false, icon:"
  },
];

let totalFixed = 0;

files.forEach(f => {
  const filePath = path.join(dir, f);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed  = false;

  fixes.forEach(fix => {
    if (content.includes(fix.from)) {
      content = content.split(fix.from).join(fix.to);
      changed = true;
      totalFixed++;
      console.log(`  Fixed "${fix.from.split(',')[0]}" in ${f}`);
    }
  });

  if (changed) fs.writeFileSync(filePath, content);
});

console.log(`\nDone! ${totalFixed} fixes applied across ${files.length} pages.`);
