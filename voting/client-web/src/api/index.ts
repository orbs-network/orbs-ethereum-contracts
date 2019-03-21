import { IApiStrategy, Mode } from './interface';
import { RemoteService } from '../services/remote';
import { MetamaskService } from '../services/metamask';
import { MetamaskServiceStub } from '../services/metamask-stub';

export class ApiService implements IApiStrategy {
  private metamask?: MetamaskService | MetamaskServiceStub;
  private remote?: RemoteService;
  mode: Mode;

  constructor() {
    this.mode = window['ethereum'] ? Mode.ReadWrite : Mode.ReadOnly;
    this.remote! = new RemoteService();
    this.metamask =
      this.mode === Mode.ReadWrite
        ? new MetamaskService()
        : new MetamaskServiceStub();
  }

  getCurrentAddress() {
    return this.metamask!.getCurrentAddress();
  }
  delegate(address: string) {
    return this.metamask!.delegate(address);
  }
  voteOut(addresses: string[]) {
    return this.metamask!.voteOut(addresses);
  }
  getGuardians() {
    return this.remote!!.getGuardians(0, 100);
  }
  getGuardianData(address: string) {
    return this.remote!.getGuardianData(address);
  }
  registerGuardian(info) {
    return this.metamask!.registerGuardian(info);
  }
  getValidators() {
    return this.remote!.getValidators();
  }
  getElectedValidators() {
    return this.remote!.getElectedValidators();
  }
  getValidatorData(address: string) {
    return this.remote!.getValidatorData(address);
  }
  getElectedValidatorData(address: string) {
    return this.remote!.getElectedValidatorData(address);
  }
  registerValidator(info) {
    return this.metamask!.registerValidator(info);
  }
  getRewards(address: string) {
    return this.remote!.getRewards(address);
  }
  getTotalStake() {
    return this.remote!.getTotalStake();
  }
  getCurrentDelegation() {
    return this.metamask!.getCurrentDelegation();
  }
  getLastVote() {
    return this.metamask!.getLastVote();
  }
}
