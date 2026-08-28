const fs = require('fs');
const path = require('path');

const dir = './';

function walkDir(currentPath) {
  const files = fs.readdirSync(currentPath);
  for (const file of files) {
    if (file === 'node_modules' || file === '.next' || file === '.git' || file === 'replace.js' || file === '.env.local') continue;
    
    const fullPath = path.join(currentPath, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (stat.isFile()) {
      if (/\.(ts|tsx|js|jsx|json|md|sql|html|css)$/.test(file)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        let originalContent = content;
        
        // 1. Annonce.ID -> Wanteermako
        content = content.replace(/Annonce\.ID/g, 'Wanteermako');
        
        // 2. annonce.id -> wanteermako
        // Exclude if it's already wanteermako.com/annonce.id? No, just replace
        content = content.replace(/annonce\.id/g, 'wanteermako.com');
        
        // 3. annonceid -> wanteermako
        content = content.replace(/annonceid/g, 'wanteermako');
        
        // 4. AnnonceID -> Wanteermako
        content = content.replace(/AnnonceID/g, 'Wanteermako');

        // Fix potential double extensions or weird URLs if needed:
        // E.g. www.wanteermako.com.com?
        content = content.replace(/wanteermako\.com\.com/g, 'wanteermako.com');

        if (content !== originalContent) {
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log(`Updated: ${fullPath}`);
        }
      }
    }
  }
}

walkDir(dir);
