// Only fixed stage labels and allowlisted codes are public. Raw errors may contain secrets.
const stages=new Set(['wallet-key','deployment-lock','network-preflight','compile-and-journal','deployReactive','deployCallback','configure','verify-deployment','fundReactive','fundReactiveRelease','pauseScheduler','resumeScheduler']);
const codes=new Set(['INVALID_ARGUMENT','INSUFFICIENT_FUNDS','NONCE_EXPIRED','REPLACEMENT_UNDERPRICED','CALL_EXCEPTION','NETWORK_ERROR','SERVER_ERROR','TIMEOUT','UNKNOWN_ERROR','EACCES','ENOSPC','ENOENT','EEXIST']);
async function stage(label,action){
 if(!stages.has(label))throw new Error('Unsupported internal deployment stage');
 try{return await action();}catch(error){
  const wrapped=new Error(error?.m2Expected===true?error.message:'M2 command stopped. Preserve the deployment journal and inspect status:m2 before retrying.');
  wrapped.m2Expected=true;wrapped.m2Stage=label;
  if(codes.has(error?.code))wrapped.m2Code=error.code;
  throw wrapped;
 }
}
function format(error){
 if(error?.m2Stage&&stages.has(error.m2Stage)) return 'M2 stopped at '+error.m2Stage+(codes.has(error.m2Code)?' ['+error.m2Code+']':'')+'. '+error.message;
 return error?.m2Expected===true?error.message:'M2 command stopped. Check local configuration, RPC access, funds and the preserved M2 journal. No automatic replacement is authorised.';
}
module.exports={stage,format};
