'use strict';
const fs   = require('fs');
const path = require('path');

const dir   = path.join(__dirname, 'src/pages');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

files.forEach(f => {
  const filePath = path.join(dir, f);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Logic to get initials from name string
  const initialsLogic = "{localStorage.getItem('tenantName')?.substring(0, 2).toUpperCase() || 'AC'}";
  // 2. Logic to get name from localStorage
  const nameLogic = "{localStorage.getItem('tenantName') || 'Acme Corp'}";
  // 3. Logic to get plan from localStorage
  const planLogic = "{localStorage.getItem('tenantPlan') || 'Enterprise'}";

  // Target lines: AC / Acme Corp / Enterprise
  const patterns = [
    { from: '>AC</div>', to: `>${initialsLogic}</div>` },
    { from: '>Acme Corp</span>', to: `>${nameLogic}</span>` },
    { from: '>Enterprise</span>', to: `>${planLogic}</span>` }
  ];

  patterns.forEach(p => {
    if (content.includes(p.from)) {
      content = content.split(p.from).join(p.to);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${f}`);
  }
});
