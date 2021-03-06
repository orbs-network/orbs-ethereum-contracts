import { PromiEvent, TransactionReceipt } from 'web3-core';
import { IOrbsTokenService, OrbsAllowanceChangeCallback } from '../interfaces/IOrbsTokenService';
import { ITxCreatingServiceMock } from './ITxCreatingServiceMock';
import { TxsMocker } from './TxsMocker';

type TTxCreatingActionNames = 'approve';

export class OrbsTokenServiceMock implements IOrbsTokenService, ITxCreatingServiceMock {
  public readonly txsMocker: TxsMocker<TTxCreatingActionNames>;

  private addressToAllowancesMap: Map<string, Map<string, bigint>> = new Map();
  private allowanceChangeEventsMap: Map<string, Map<string, Map<number, OrbsAllowanceChangeCallback>>> = new Map<
    string,
    Map<string, Map<number, OrbsAllowanceChangeCallback>>
  >();

  constructor(autoCompleteTxes: boolean = true) {
    this.txsMocker = new TxsMocker<TTxCreatingActionNames>(autoCompleteTxes);
  }

  // CONFIG //
  setFromAccount(address: string): void {
    this.txsMocker.setFromAccount(address);
  }

  // WRITE (TX creation) //
  approve(spenderAddress: string, amount: bigint): PromiEvent<TransactionReceipt> {
    const txEffect = () => this.setAllowance(this.txsMocker.getFromAccount(), spenderAddress, amount);

    return this.txsMocker.createTxOf('approve', txEffect);
  }

  // SUBSCRIPTION //
  subscribeToAllowanceChange(
    ownerAddress: string,
    spenderAddress: string,
    callback: OrbsAllowanceChangeCallback,
  ): () => Promise<boolean> {
    // Ensure we have a mapping for the given owner
    if (!this.allowanceChangeEventsMap.has(ownerAddress)) {
      this.allowanceChangeEventsMap.set(ownerAddress, new Map<string, Map<number, OrbsAllowanceChangeCallback>>());
    }

    // Ensure we have a mapping for the given spender
    const ownerToSpenderAllowanceSubscriptionMap = this.allowanceChangeEventsMap.get(ownerAddress);
    if (!ownerToSpenderAllowanceSubscriptionMap.has(spenderAddress)) {
      ownerToSpenderAllowanceSubscriptionMap.set(spenderAddress, new Map<number, OrbsAllowanceChangeCallback>());
    }

    const subscriptionsMap = ownerToSpenderAllowanceSubscriptionMap.get(spenderAddress);

    // Generate id and add the event handler
    const eventTransmitterId = Date.now() + Math.random() * 10;

    subscriptionsMap.set(eventTransmitterId, callback);

    return () => {
      this.allowanceChangeEventsMap
        .get(ownerAddress)
        .get(spenderAddress)
        .delete(eventTransmitterId);
      return Promise.resolve(true);
    };
  }

  // READ //
  async readAllowance(ownerAddress: string, spenderAddress: string): Promise<bigint> {
    // default allowance
    let allowance = BigInt(0);

    if (this.addressToAllowancesMap.has(ownerAddress)) {
      const ownerAllowances = this.addressToAllowancesMap.get(ownerAddress);

      if (ownerAllowances.has(spenderAddress)) {
        allowance = ownerAllowances.get(spenderAddress);
      }
    }

    return allowance;
  }

  // State test utils //
  public setAllowance(ownerAddress: string, spenderAddress: string, allowanceSum: bigint) {
    if (!this.addressToAllowancesMap.has(ownerAddress)) {
      this.addressToAllowancesMap.set(ownerAddress, new Map<string, bigint>());
    }

    const ownerAllowances = this.addressToAllowancesMap.get(ownerAddress);

    ownerAllowances.set(spenderAddress, allowanceSum);

    // Trigger listeners
    this.triggerAllowanceChangeCallbacks(ownerAddress, spenderAddress);
  }

  // Subscription triggering
  private triggerAllowanceChangeCallbacks(ownerAddress: string, spenderAddress: string) {
    const newAllowance = this.addressToAllowancesMap.get(ownerAddress).get(spenderAddress);

    if (
      this.allowanceChangeEventsMap.has(ownerAddress) &&
      this.allowanceChangeEventsMap.get(ownerAddress).has(spenderAddress)
    ) {
      const callbacks = this.allowanceChangeEventsMap
        .get(ownerAddress)
        .get(spenderAddress)
        .values();

      for (let callback of callbacks) {
        callback(null, newAllowance);
      }
    }
  }
}
