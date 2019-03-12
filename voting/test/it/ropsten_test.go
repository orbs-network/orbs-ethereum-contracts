package it

import (
	"github.com/orbs-network/orbs-ethereum-contracts/voting/test/it/driver"
	"testing"
)

// TODO add to driver config all the required orbsAddresses and IPs
// TODO Verify proper registration of accounts as guardians - check if guardians are already registered! fund deposits only if needed
// TODO reclaim guardian deposit on teardown

// TODO new flow - propagate elections results and verify committee change.

// EDIT THIS CONFIGURATION TO CONTROL THE TEST SCENARIO
// DON'T FORGET TO UPDATE VALUES ACCORDING TO INSTRUCTIONS AFTER DEPLOY
var delegatorsNumberRopsten = 15
var guardiansAccountsRopsten = []int{4, 6, 10, 11}
var validatorAccountsRopsten = []int{20, 21, 22, 23, 24}
var configRopsten = &driver.Config{
	DebugLogs:                    true,                                                            // shows detailed responses for every command
	EthereumErc20Address:         "",                                                              // update after deploy with the resulting value
	EthereumValidatorsAddress:    "",                                                              // update after deploy with the resulting value
	EthereumValidatorsRegAddress: "",                                                              // update after deploy with the resulting value
	EthereumVotingAddress:        "",                                                              // update after deploy with the resulting value
	UserAccountOnOrbs:            "user1",                                                         // one of the IDs in orbs-test-keys.json
	DelegatorsNumber:             delegatorsNumberRopsten,                                         // upto 20
	DelegatorStakeValues:         []int{100, 100, 80, 80, 60, 60, 40, 0, 200, 50, 50, 0, 0, 0, 0}, // should length  stakeholdernumber 10 is activist with no stake, 11-14 silent
	GuardiansAccounts:            guardiansAccounts,                                               // indexes of activists up to 20
	ValidatorsAccounts:           validatorAccounts,                                               // user index 20 ... if you have more than 5 add more Ropsten accounts
	ValidatorsOrbsAddresses:      []string{driver.IntToAddr(1), driver.IntToAddr(2), driver.IntToAddr(3), driver.IntToAddr(4), driver.IntToAddr(5)},
	ValidatorsOrbsIps:            []string{driver.IpToHexaBytes("1.1.1.1"), driver.IpToHexaBytes("1.1.1.2"), driver.IpToHexaBytes("1.1.1.3"), driver.IpToHexaBytes("1.1.1.4"), driver.IpToHexaBytes("1.1.1.5")},
	Transfers:                    generateTransfersRopsten(delegatorsNumberRopsten, guardiansAccountsRopsten),
	Delegates:                    generateDelegatesRopsten(delegatorsNumberRopsten, guardiansAccountsRopsten),
	Votes:                        generateVotesRopsten(guardiansAccountsRopsten, validatorAccountsRopsten),
}

// before starting:
// 1. make sure Ropsten is running locally on port 7545
// 2. change account setting to generate 25 accounts
// 3. make sure gamma server is running with `gamma-cli start-local`

func TestFullFlowOnRopsten(t *testing.T) {

	orbs := driver.AdapterForGammaCliLocal(configRopsten)
	ethereum := driver.AdapterForTruffleRopsten(configRopsten, orbs.GetStakeFactor())

	// Temp deploy of orbs contracts
	orbs.DeployContract("OrbsVoting")
	orbs.SetContractConstants("OrbsVoting")
	//ethereum.Mine(orbs.GetMirrorVotingPeriod()+5)
	//orbs.SetFirstElectionBlockNumber("OrbsVoting", 1342)

	driver.RunDeployFlow(t, configRopsten, orbs, ethereum)
	driver.RunRecordFlow(t, configRopsten, orbs, ethereum)
	driver.RunMirrorFlow(t, configRopsten, orbs, ethereum)
	driver.RunProcessFlow(t, configRopsten, orbs, ethereum)
}

// value 0 -> delegate.
// test calcs don't handle circular delegation
// test calcs handle two level indirection only
func generateTransfersRopsten(stakeHolderNumber int, activists []int) []*driver.TransferEvent {
	return []*driver.TransferEvent{
		{0, 6, 0},  // delegate
		{2, 6, 0},  // delegate
		{5, 3, 0},  // delegate // two level
		{8, 4, 50}, // regular transfer
		{8, 4, 0},  // delegate
		{8, 1, 10}, // regular transfer
		{3, 10, 0}, // delegate
		{9, 10, 0}, // delegate
		{7, 4, 0},  // delegate
		{2, 4, 0},  // delegate // change mind
		{8, 6, 0},  // delegate // change mind
		{5, 9, 10}, // regular transfer
	}
}

// test calcs don't handle circular delegation
func generateDelegatesRopsten(stakeHolderNumber int, activists []int) []*driver.DelegateEvent {
	return []*driver.DelegateEvent{
		{1, 4},  // delegate
		{7, 10}, // delegate already transfer
	}
}

// test calcs don't handle guardian that is a delegate or delegate that is guardian
func generateVotesRopsten(activists []int, validatorAccounts []int) []*driver.VoteEvent {
	return []*driver.VoteEvent{
		{4, [3]int{20, 22}},
		{10, [3]int{22, 23, 24}},
		{6, [3]int{22}},
		{4, [3]int{21}}, // revote
		{11, [3]int{}},
		//{15, [3]int{24, 21, 22}}, // not an guardian // TODO v1 noam
	}
}
