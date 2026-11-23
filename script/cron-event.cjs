// The deployed legacy emitter indexes number. See official SystemContract.sol,
// inherited by omni/LegacySystemContract.sol (revision 72710d2b5f4e15e445da782aaef9f8bae59f4af9).
const {getAddress}=require('ethers');
const CRON='0x0000000000000000000000000000000000fffFfF';
const CRON_TOPIC='0xb49937fb8970e19fd46d48f7e3fb00d659deac0347f79cd7cb542f0fc1503c70';
function isCron100(log) {
 try {
  return log.removed!==true && getAddress(log.address)===getAddress(CRON) &&
   Array.isArray(log.topics) && log.topics.length===2 &&
   log.topics[0].toLowerCase()===CRON_TOPIC && /^0x[0-9a-f]{64}$/i.test(log.topics[1]) && log.data==='0x';
 } catch {return false;}
}
module.exports={CRON,CRON_TOPIC,isCron100};
