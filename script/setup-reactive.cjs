const fs = require('node:fs/promises');
const path = require('node:path');
const revision = '3ade0dcf1d27e67e5783ef807e73a1b9e0c0cce8';
const files = [
  'src/base/AbstractReactive.sol', 'src/base/AbstractCallback.sol', 'src/base/AbstractPayer.sol',
  'src/interfaces/IReactive.sol', 'src/interfaces/ISystemContract.sol', 'src/interfaces/IPayable.sol',
  'src/interfaces/IPayer.sol', 'src/interfaces/ISubscriptionService.sol'
];
async function main() {
  for (const file of files) {
    const response = await fetch('https://raw.githubusercontent.com/Reactive-Network/reactive-lib-omni/' + revision + '/' + file);
    if (!response.ok) throw new Error('Dependency download failed: ' + response.status + ' ' + file);
    const destination = path.join(__dirname, '..', 'lib/reactive-lib-omni', file);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, await response.text());
  }
  console.log('Reactive dependency installed at pinned revision', revision);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
