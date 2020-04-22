import { IGuardianData } from './IGuardianData';
import { IElectedValidatorData, IValidatorData } from './IValidatorData';

export interface IRemoteService {
  getGuardians(): Promise<string[]>;
  getGuardianData(address: string): Promise<IGuardianData>;
  getValidators(): Promise<string[]>;
  getElectedValidators(): Promise<string[]>;
  getValidatorData(address: string): Promise<IValidatorData>;
  getElectedValidatorData(address: string): Promise<IElectedValidatorData>;
  getRewards(address: string): Promise<any>;
  getRewardsHistory(address: string): Promise<any>;
  getTotalParticipatingTokens(): Promise<string>;
  getUpcomingElectionBlockNumber(): Promise<string>;
  getEffectiveElectionBlockNumber(): Promise<string>;
  getCurrentDelegation(address: string): Promise<string>;
  getCurrentDelegationInfo(address: string): Promise<{}>;
}
