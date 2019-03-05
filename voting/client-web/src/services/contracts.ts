import Web3 from 'web3';
import * as OrbsContractsInfo from '../contracts-info';
import votingAbiJson from '../contracts/OrbsVoting.json';
import guardiansAbiJson from '../contracts/OrbsGaurdians.json';
import validatorsAbiJson from '../contracts/OrbsValidators.json';

const web3 = new Web3(ethereum as any);

export const validatorsContractFactory = () => {
  return new web3.eth.Contract(
    validatorsAbiJson.abi as any,
    window['__OrbsContractsInfo__']
      ? window['__OrbsContractsInfo__']['OrbsValidators']['address']
      : OrbsContractsInfo.OrbsValidators.address
  );
};

export const guardiansContractFactory = () => {
  return new web3.eth.Contract(
    guardiansAbiJson.abi as any,
    window['__OrbsContractsInfo__']
      ? window['__OrbsContractsInfo__']['OrbsGuardians']['address']
      : OrbsContractsInfo.OrbsGaurdians.address
  );
};

export const votingContractFactory = () => {
  return new web3.eth.Contract(
    votingAbiJson.abi as any,
    window['__OrbsContractsInfo__']
      ? window['__OrbsContractsInfo__']['OrbsVoting']['address']
      : OrbsContractsInfo.OrbsVoting.address
  );
};