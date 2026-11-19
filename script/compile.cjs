const fs = require('node:fs');
const path = require('node:path');
const solc = require('solc');

function compile() {
  const sourcePath = 'packages/contracts/src/SettlioEscrow.sol';
  const input = {
    language: 'Solidity',
    sources: { [sourcePath]: { content: fs.readFileSync(path.join(__dirname, '..', sourcePath), 'utf8') } },
    settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: 'cancun', outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } } }
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = (output.errors || []).filter(error => error.severity === 'error');
  if (errors.length) throw new Error(errors.map(error => error.formattedMessage).join('\n'));
  return output.contracts[sourcePath].SettlioEscrow;
}
module.exports = compile;
if (require.main === module) {
  const contract = compile();
  fs.mkdirSync('artifacts', { recursive: true });
  fs.writeFileSync('artifacts/SettlioEscrow.json', JSON.stringify(contract, null, 2));
  console.log('SettlioEscrow compiled with', solc.version());
}
