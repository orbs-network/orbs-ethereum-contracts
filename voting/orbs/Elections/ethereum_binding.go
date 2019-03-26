// Copyright 2019 the orbs-ethereum-contracts authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

package elections_systemcontract

/*****
 * Connections to Ethereum contracts
 */
var ETHEREUM_TOKEN_ADDR = "0xeD0Aa9A4F9e5ae9092994f4B86F6AAa89944939b"
var ETHEREUM_VOTING_ADDR = "0x4070273454A2474FE81782256198AD4538D4C74a"
var ETHEREUM_VALIDATORS_ADDR = "0x92900753DaD31a387636b898C36e0ca56CBE2BEf"
var ETHEREUM_VALIDATORS_REGISTRY_ADDR = "0xe5Dc553c6BC06F2aCBDc1A17F87CD4e6F6F01ac7"
var ETHEREUM_GUARDIANS_ADDR = "0x3A41BDcd02924D01f6cdd9D71E4dD0F6014B5736"

func getTokenEthereumContractAddress() string {
	return ETHEREUM_TOKEN_ADDR
}

func getTokenAbi() string {
	return `[{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"who","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}]`
}

func getGuardiansEthereumContractAddress() string {
	return ETHEREUM_GUARDIANS_ADDR
}

func getGuardiansAbi() string {
	return `[{"anonymous":false,"inputs":[{"indexed":true,"name":"guardian","type":"address"}],"name":"GuardianRegistered","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"guardian","type":"address"}],"name":"GuardianLeft","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"guardian","type":"address"}],"name":"GuardianUpdated","type":"event"},{"constant":false,"inputs":[{"name":"name","type":"string"},{"name":"website","type":"string"}],"name":"register","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"name","type":"string"},{"name":"website","type":"string"}],"name":"update","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"leave","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"isGuardian","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"validator","type":"address"}],"name":"getGuardianData","outputs":[{"name":"name","type":"string"},{"name":"website","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"reviewRegistration","outputs":[{"name":"name","type":"string"},{"name":"website","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"getRegistrationBlockNumber","outputs":[{"name":"registeredOn","type":"uint256"},{"name":"lastUpdatedOn","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"offset","type":"uint256"},{"name":"limit","type":"uint256"}],"name":"getGuardians","outputs":[{"name":"","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"offset","type":"uint256"},{"name":"limit","type":"uint256"}],"name":"getGuardiansBytes20","outputs":[{"name":"","type":"bytes20[]"}],"payable":false,"stateMutability":"view","type":"function"}]`
}

func getVotingEthereumContractAddress() string {
	return ETHEREUM_VOTING_ADDR
}

func getVotingAbi() string {
	return `[{"anonymous":false,"inputs":[{"indexed":true,"name":"voter","type":"address"},{"indexed":false,"name":"validators","type":"address[]"},{"indexed":false,"name":"voteCounter","type":"uint256"}],"name":"VoteOut","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"delegator","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"delegationCounter","type":"uint256"}],"name":"Delegate","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"delegator","type":"address"},{"indexed":false,"name":"delegationCounter","type":"uint256"}],"name":"Undelegate","type":"event"},{"constant":false,"inputs":[{"name":"validators","type":"address[]"}],"name":"voteOut","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"}],"name":"delegate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"undelegate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"getCurrentVote","outputs":[{"name":"validators","type":"address[]"},{"name":"blockNumber","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"getCurrentVoteBytes20","outputs":[{"name":"validatorsBytes20","type":"bytes20[]"},{"name":"blockNumber","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"delegator","type":"address"}],"name":"getCurrentDelegation","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"}]`
}

func getValidatorsEthereumContractAddress() string {
	return ETHEREUM_VALIDATORS_ADDR
}

func getValidatorsAbi() string {
	return `[{"anonymous":false,"inputs":[{"indexed":true,"name":"validator","type":"address"}],"name":"ValidatorApproved","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"validator","type":"address"}],"name":"ValidatorRemoved","type":"event"},{"constant":false,"inputs":[{"name":"validator","type":"address"}],"name":"approve","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"validator","type":"address"}],"name":"remove","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"validator","type":"address"}],"name":"isValidator","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"validator","type":"address"}],"name":"isApproved","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getValidators","outputs":[{"name":"","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getValidatorsBytes20","outputs":[{"name":"","type":"bytes20[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"validator","type":"address"}],"name":"getApprovalBlockNumber","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}]`
}

func getValidatorsRegistryEthereumContractAddress() string {
	return ETHEREUM_VALIDATORS_REGISTRY_ADDR
}

func getValidatorsRegistryAbi() string {
	return `[{"anonymous":false,"inputs":[{"indexed":true,"name":"validator","type":"address"}],"name":"ValidatorLeft","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"validator","type":"address"}],"name":"ValidatorRegistered","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"validator","type":"address"}],"name":"ValidatorUpdated","type":"event"},{"constant":false,"inputs":[{"name":"name","type":"string"},{"name":"ipAddress","type":"bytes4"},{"name":"website","type":"string"},{"name":"orbsAddress","type":"bytes20"}],"name":"register","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"name","type":"string"},{"name":"ipAddress","type":"bytes4"},{"name":"website","type":"string"},{"name":"orbsAddress","type":"bytes20"}],"name":"update","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"leave","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"validator","type":"address"}],"name":"getValidatorData","outputs":[{"name":"name","type":"string"},{"name":"ipAddress","type":"bytes4"},{"name":"website","type":"string"},{"name":"orbsAddress","type":"bytes20"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"reviewRegistration","outputs":[{"name":"name","type":"string"},{"name":"ipAddress","type":"bytes4"},{"name":"website","type":"string"},{"name":"orbsAddress","type":"bytes20"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"validator","type":"address"}],"name":"getRegistrationBlockNumber","outputs":[{"name":"registeredOn","type":"uint256"},{"name":"lastUpdatedOn","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"validator","type":"address"}],"name":"isValidator","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"validator","type":"address"}],"name":"getOrbsAddress","outputs":[{"name":"orbsAddress","type":"bytes20"}],"payable":false,"stateMutability":"view","type":"function"}]`
}
