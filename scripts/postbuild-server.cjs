// Creates server-dist/package.json after TypeScript compilation
// This is needed because the project's package.json has "type": "module"
// but the server is compiled to CommonJS.
// Must be .cjs because project package.json has "type": "module"
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'server-dist');
const targetFile = path.join(targetDir, 'package.json');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

fs.writeFileSync(targetFile, JSON.stringify({ type: 'commonjs' }, null, 2));
console.log('[postbuild] Created server-dist/package.json');
