/**
 * Copyright 2019 the staking-dashboard authors
 * This file is part of the staking-dashboard library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
import * as ERC20ContractABI from 'orbs-staking-contract/build/abi/ERC20.json';
import { MainnetContractsAddresses } from '../contracts-adresses';
import { IOrbsTokenService } from '../interfaces/IOrbsTokenService';
import { OrbsTokenService } from '../services/OrbsTokenService';

class Web3Mock {
  methodParams = (methodName: string) => this.eth.Contract.mock.results[0].value.methods[methodName].mock.calls[0];
  optionValue = (optionName: string) => this.eth.Contract.mock.results[0].value.options[optionName];

  eth = {
    Contract: jest.fn().mockImplementation((abi, address) => {
      return {
        methods: {
          approve: jest.fn(amount => ({ send: jest.fn() })),
        },
        options: {
          from: '',
        },
      };
    }),
  };
}

describe('Orbs Token service', () => {
  let orbsTokenService: IOrbsTokenService;
  let web3Mock: Web3Mock;

  beforeEach(() => {
    web3Mock = new Web3Mock();
    orbsTokenService = new OrbsTokenService(web3Mock as any);
  });

  it('should set the default "from" address', async () => {
    const accountAddress = '0xbDBE6E5030f3e769FaC89AEF5ac34EbE8Cf95a76';
    await orbsTokenService.setFromAccount(accountAddress);

    expect(web3Mock.optionValue('from')).toEqual(accountAddress);
  });

  it('should initialize the contract with the right abi and the contract address', async () => {
    expect(web3Mock.eth.Contract).toBeCalledWith(ERC20ContractABI, MainnetContractsAddresses.erc20Contract);
  });

  it('should allow overriding of contract address', async () => {
    const contractAddress = '0xaaaaaE5030f3e769FaC89AEF5ac34EbE8Cf95a76';
    const localWeb3Mock = new Web3Mock();
    const localOrbsTokenService = new OrbsTokenService(localWeb3Mock as any, contractAddress);

    expect(localWeb3Mock.eth.Contract).toBeCalledWith(ERC20ContractABI, contractAddress);
  });

  it('should call "stake" with the amount', async () => {
    const result = await orbsTokenService.approve(1_000_000);
    expect(web3Mock.methodParams('approve')).toEqual([1_000_000]);
  });
});
