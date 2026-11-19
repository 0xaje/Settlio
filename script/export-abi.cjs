const fs = require('node:fs');
const compile = require('./compile.cjs');
fs.mkdirSync('apps/web/src', { recursive: true });
fs.writeFileSync('apps/web/src/escrow-abi.json', JSON.stringify(compile().abi, null, 2) + '\n');
