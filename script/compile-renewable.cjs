// Local versioned compilation only. No artifact export to the existing web app.
const fs=require('node:fs'),path=require('node:path'),legacy=require('./compile.cjs');
module.exports=function compile(name='SettlioEscrowV5',extraSources={}){
 const sources={...extraSources};
 for(const file of fs.readdirSync(path.join(__dirname,'../packages/contracts/renewable'))){
  if(file.endsWith('.sol'))sources['packages/contracts/renewable/'+file]={content:fs.readFileSync(path.join(__dirname,'../packages/contracts/renewable',file),'utf8')};
 }
 return legacy(name,sources);
};
if(require.main===module)for(const name of ['SettlioWorkLedger','SettlioEscrowV5','SettlioCallbackV5','SettlioReactiveV5']){
 const a=module.exports(name),runtime=a.evm.deployedBytecode.object.length/2,init=a.evm.bytecode.object.length/2;
 if(runtime>24576||init>49152)throw Error(name+' exceeds EVM size limit');
 console.log(name+' compiled locally: runtime '+runtime+' bytes, initcode '+init+' bytes. Not deployed.');
}
