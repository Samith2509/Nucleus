const fs = require('fs');
const path = require('path');
const dir = './src';

const replaceInDir = (dirPath) => {
  fs.readdirSync(dirPath).forEach(file => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      replaceInDir(filePath);
    } else if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let changed = false;

      // Replace simple string fetches like fetch('/api/...
      if (content.includes("fetch('/api/")) {
        content = content.replace(/fetch\('\/api\//g, "fetch('https://nucleus-by-sheeroo.onrender.com/api/");
        changed = true;
      }
      
      // Replace template literal fetches like fetch(`/api/...
      if (content.includes('fetch(`/api/')) {
        content = content.replace(/fetch\(`\/api\//g, 'fetch(`https://nucleus-by-sheeroo.onrender.com/api/');
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated ' + filePath);
      }
    }
  });
};

replaceInDir(dir);
