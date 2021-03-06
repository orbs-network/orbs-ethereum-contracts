/**
 * Copyright 2019 the staking-dashboard authors
 * This file is part of the staking-dashboard library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
import { EthereumClientServiceMock } from './ethereum-client-service-mock';
import { OrbsClientServiceMock } from './orbs-client-service-mock';
import { OrbsPOSDataService } from '../services/OrbsPOSDataService';
import { IValidatorData } from '../interfaces/IValidatorData';
import { IValidatorInfo } from '../interfaces/IValidatorInfo';

describe('Orbs POS data service', () => {
  let ethereumClient: EthereumClientServiceMock;
  let orbsClientService: OrbsClientServiceMock;
  let orbsPOSDataService: OrbsPOSDataService;

  const validatorsMap: { [key: string]: IValidatorData } = {
    '0x0874BC1383958e2475dF73dC68C4F09658E23777': {
      orbsAddress: '0x8287928a809346dF4Cd53A096025a1136F7C4fF5',
      name: 'validator #1',
      ipAddress: '1.2.3.4',
      website: 'http://www.validator1.com',
    },
    '0xf257EDE1CE68CA4b94e18eae5CB14942CBfF7D1C': {
      orbsAddress: '0xf7ae622C77D0580f02Bcb2f92380d61e3F6e466c',
      name: 'validator #2',
      ipAddress: '5.6.7.8',
      website: 'http://www.validator2.com',
    },
    '0xcB6172196BbCf5b4cf9949D7f2e4Ee802EF2b81D': {
      orbsAddress: '0x63AEf7616882F488BCa97361d1c24F05B4657ae5',
      name: 'validator #3',
      ipAddress: '9.0.1.2',
      website: 'http://www.validator2.com',
    },
  };
  const validatorsAddresses = Object.keys(validatorsMap);

  beforeEach(() => {
    ethereumClient = new EthereumClientServiceMock();
    orbsClientService = new OrbsClientServiceMock();
    orbsPOSDataService = new OrbsPOSDataService(ethereumClient, orbsClientService);
  });

  describe('validators', () => {
    it('should return all the validators addresses', async () => {
      ethereumClient.withValidators(validatorsMap);
      const actual = await orbsPOSDataService.readValidators();
      expect(validatorsAddresses).toEqual(actual);
    });

    it("should return a specific validator's info (With votes against)", async () => {
      ethereumClient.withValidators(validatorsMap);
      const firstValidatorAddress = validatorsAddresses[0];
      orbsClientService.withValidatorVotes(firstValidatorAddress, 100n);
      orbsClientService.withTotalParticipatingTokens(1_000n);

      const actual = await orbsPOSDataService.readValidatorInfo(firstValidatorAddress);
      const expected: IValidatorInfo = { votesAgainst: 10, ...validatorsMap[firstValidatorAddress] }; // 100/1000 = 10%
      expect(expected).toEqual(actual);
    });

    it("should return a specific validator's info (With votes against, but no participating tokens)", async () => {
      ethereumClient.withValidators(validatorsMap);
      const firstValidatorAddress = validatorsAddresses[0];
      orbsClientService.withValidatorVotes(firstValidatorAddress, 100n);
      orbsClientService.withTotalParticipatingTokens(0n);

      const actual = await orbsPOSDataService.readValidatorInfo(firstValidatorAddress);
      const expected: IValidatorInfo = { votesAgainst: 0, ...validatorsMap[firstValidatorAddress] };
      expect(expected).toEqual(actual);
    });

    it("should return a specific validator's info (Without votes against)", async () => {
      ethereumClient.withValidators(validatorsMap);
      const firstValidatorAddress = validatorsAddresses[0];
      orbsClientService.withValidatorVotes(firstValidatorAddress, 0n);
      orbsClientService.withTotalParticipatingTokens(1_000n);

      const actual = await orbsPOSDataService.readValidatorInfo(firstValidatorAddress);
      const expected: IValidatorInfo = { votesAgainst: 0, ...validatorsMap[firstValidatorAddress] };
      expect(expected).toEqual(actual);
    });
  });

  describe('ORBS balance', () => {
    it('should return the ORBS balance of a specific address', async () => {
      const DUMMY_ADDRESS = '0xcB6172196BbCf5b4cf9949D7f2e4Ee802EF2ABC';
      ethereumClient.withORBSBalance(DUMMY_ADDRESS, 125n);

      const actual = await orbsPOSDataService.readOrbsBalance(DUMMY_ADDRESS);
      expect(actual).toEqual(125n);
    });

    it('should trigger the given callback on account balance change', async () => {
      const DUMMY_ADDRESS = '0xcB6172196BbCf5b4cf9949D7f2e4Ee802EF2ABC';
      ethereumClient.withORBSBalance(DUMMY_ADDRESS, 125n);

      const balanceChangeCb = jest.fn();

      // Subscribe and trigger
      orbsPOSDataService.subscribeToORBSBalanceChange(DUMMY_ADDRESS, balanceChangeCb);
      ethereumClient.updateORBSBalance(DUMMY_ADDRESS, 500n);

      expect(balanceChangeCb).toBeCalledTimes(1);
      expect(balanceChangeCb).toBeCalledWith(500n);
    });

    it("should return an 'unsubscribe' function and not call 'unsubscribed' CBs", () => {
      const DUMMY_ADDRESS = '0xcB6172196BbCf5b4cf9949D7f2e4Ee802EF2ABC';
      ethereumClient.withORBSBalance(DUMMY_ADDRESS, 125n);

      const balanceChangeCb1 = jest.fn();
      const balanceChangeCb2 = jest.fn();
      const balanceChangeCb3 = jest.fn();

      // Subscribe and trigger
      orbsPOSDataService.subscribeToORBSBalanceChange(DUMMY_ADDRESS, balanceChangeCb1);
      const unsubscribe2 = orbsPOSDataService.subscribeToORBSBalanceChange(DUMMY_ADDRESS, balanceChangeCb2);
      orbsPOSDataService.subscribeToORBSBalanceChange(DUMMY_ADDRESS, balanceChangeCb3);
      ethereumClient.updateORBSBalance(DUMMY_ADDRESS, 500n);

      expect(balanceChangeCb1).toBeCalledTimes(1);
      expect(balanceChangeCb1).toBeCalledWith(500n);
      expect(balanceChangeCb2).toBeCalledTimes(1);
      expect(balanceChangeCb2).toBeCalledWith(500n);
      expect(balanceChangeCb3).toBeCalledTimes(1);
      expect(balanceChangeCb3).toBeCalledWith(500n);

      // Unsubscribe ane test
      unsubscribe2();

      ethereumClient.updateORBSBalance(DUMMY_ADDRESS, 1000n);
      expect(balanceChangeCb1).toBeCalledTimes(2);
      expect(balanceChangeCb1).toBeCalledWith(500n);
      expect(balanceChangeCb1).toBeCalledWith(1000n);
      expect(balanceChangeCb2).toBeCalledTimes(1);
      expect(balanceChangeCb2).not.toBeCalledWith(1000n);
      expect(balanceChangeCb3).toBeCalledTimes(2);
      expect(balanceChangeCb3).toBeCalledWith(500n);
      expect(balanceChangeCb3).toBeCalledWith(1000n);
    });
  });
});
