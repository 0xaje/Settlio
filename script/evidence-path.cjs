const path=require('node:path');
module.exports=function evidenceDirectory(root,journal) {
 if(journal.milestone===undefined) return path.join(root,'deployments/evidence');
 if(journal.milestone==='M2' && journal.schemaVersion===1 && journal.policyVersion===3) return path.join(root,'deployments/evidence/m2');
 throw new Error('Unsupported deployment evidence namespace.');
};
