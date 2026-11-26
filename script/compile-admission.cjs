// Builds the separate, not-yet-deployed V4 admission contracts. Never changes V3 artifacts.
const fs=require('node:fs'),path=require('node:path');
const compileLegacy=require('./compile.cjs');
const cache=new Map();
function compile(name='SettlioEscrowV4',extraSources={}){
 const noExtra=Object.keys(extraSources).length===0;
 if(noExtra&&cache.has(name))return cache.get(name);
 const sources={...extraSources};
 const sourceDirectory=path.join(__dirname,'../packages/contracts/admission');
 for(const file of fs.readdirSync(sourceDirectory)){
  if(file.endsWith('.sol'))sources['packages/contracts/admission/'+file]={content:fs.readFileSync(path.join(sourceDirectory,file),'utf8')};
 }
 const artifact=compileLegacy(name,sources);
 if(noExtra)cache.set(name,artifact);
 return artifact;
}
module.exports=compile;
if(require.main===module){
const directory=path.join(__dirname,'../artifacts');
fs.mkdirSync(directory,{recursive:true});
for(const name of ['SettlioAdmission','SettlioEscrowV4','SettlioCallbackV4','SettlioReactiveV4']){
 const artifact=compile(name);
 const runtimeBytes=artifact.evm.deployedBytecode.object.length/2;
 if(runtimeBytes>24576)throw Error(name+' exceeds the EVM runtime size limit.');
 if(artifact.evm.bytecode.object.length/2>49152)throw Error(name+' exceeds the EVM initcode size limit.');
 fs.writeFileSync(path.join(directory,name+'.json'),JSON.stringify(artifact,null,2)+'\n');
 console.log(name+' compiled; runtime '+runtimeBytes+' bytes. Not deployed.');
}

}
