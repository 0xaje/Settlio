const fs = require('node:fs');
const path = require('node:path');
const solc = require('solc');
const root = path.join(__dirname, '..');

function compile(name = 'SettlioEscrow', extraSources = {}) {
  const sources = { ...extraSources };
  for (const file of fs.readdirSync(path.join(root, 'packages/contracts/src'))) {
    if (file.endsWith('.sol')) {
      const sourcePath = 'packages/contracts/src/' + file;
      sources[sourcePath] = { content: fs.readFileSync(path.join(root, sourcePath), 'utf8') };
    }
  }
  const input = {
    language: 'Solidity', sources,
    settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: 'cancun', outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } } }
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input), {
    import(importPath) {
      const resolved = importPath.replace(/^@reactive\//, 'lib/reactive-lib-omni/');
      try { return { contents: fs.readFileSync(path.join(root, resolved), 'utf8') }; }
      catch { return { error: 'Missing import ' + importPath + '. Run npm run setup:reactive.' }; }
    }
  }));
  const errors = (output.errors || []).filter(error => error.severity === 'error');
  if (errors.length) throw new Error(errors.map(error => error.formattedMessage).join('\n'));
  for (const contracts of Object.values(output.contracts)) {
    if (contracts[name]) return contracts[name];
  }
  throw new Error('Unknown contract ' + name);
}
module.exports = compile;
if (require.main === module) {
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  for (const name of ['SettlioEscrow', 'SettlioCallback', 'SettlioReactive']) {
    const contract = compile(name);
    fs.writeFileSync(path.join(root, 'artifacts', name + '.json'), JSON.stringify(contract, null, 2));
    console.log(name, 'compiled with', solc.version());
  }
}
