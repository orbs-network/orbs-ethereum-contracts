const helpers = require('./helpers');

const guardiansContractAddress = process.env.GUARDIANS_CONTRACT_ADDRESS;
const guardianAccountIndexesOnEthereum = process.env.GUARDIAN_ACCOUNT_INDEXES_ON_ETHEREUM;

const GUARDIAN_REG_DEPOSIT = web3.utils.toWei('1', 'ether');
const MIN_BALANCE_DEPOSIT = web3.utils.toWei("1.5", "ether");

const MIN_BALANCE_FEES = web3.utils.toWei("0.5", "ether");

module.exports = async function(done) {
  try {

    if (!guardiansContractAddress) {
      throw("missing env variable GUARDIANS_CONTRACT_ADDRESS");
    }

    if (!guardianAccountIndexesOnEthereum) {
      throw("missing env variable GUARDIAN_ACCOUNT_INDEXES_ON_ETHEREUM");
    }

    const guardiansInstance = await artifacts.require('IOrbsGuardians').at(guardiansContractAddress);

    let accounts = await web3.eth.getAccounts();
    let guardianIndexes = JSON.parse(guardianAccountIndexesOnEthereum);
    let guardians = guardianIndexes.map(elem => accounts[elem]);

    let txs = guardians.map(async (address, i) => {
      if (await guardiansInstance.isGuardian(address) === false) { // not a registered guardian
        return helpers.verifyEtherBalance(web3, address, MIN_BALANCE_DEPOSIT, accounts[0]).then(() => {
          return guardiansInstance.register(`guardianName${i}`, `https://www.guardian${i}.com`, {from: address, value: GUARDIAN_REG_DEPOSIT}).on("transactionHash", hash => {
            console.error("TxHash: " + hash);
          });
        });
      } else { // already sent a deposit - just override the values
        return helpers.verifyEtherBalance(web3, address, MIN_BALANCE_FEES, accounts[0]).then(() => {
          return guardiansInstance.register(`guardianName${i}`, `https://www.guardian${i}.com`, {from: address}).on("transactionHash", hash => {
            console.error("TxHash: " + hash);
          });
        });
      }
    });

    await Promise.all(txs);

    let indexToAddressMap = guardianIndexes.map(i => {return {Index: i, Address: accounts[i]};});
    console.log(JSON.stringify(indexToAddressMap, null, 2));

    done();

  } catch (e) {
    console.log(e);
    done(e);
  }
};
