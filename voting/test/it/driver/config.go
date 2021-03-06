// Copyright 2019 the orbs-ethereum-contracts authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

package driver

import (
	"github.com/pkg/errors"
)

type Config struct {
	DebugLogs                    bool
	EthereumErc20Address         string
	EthereumValidatorsAddress    string
	EthereumValidatorsRegAddress string
	EthereumVotingAddress        string
	EthereumGuardiansAddress     string
	UserAccountOnOrbs            string
	NumberOfAccounts             int
	AccountStakeValues           []float32
	GuardiansAccounts            []int
	ValidatorsAccounts           []int
	ValidatorsOrbsAddresses      []string
	ValidatorsOrbsIps            []string
	SetupOverEthereumBlock       int
	Transfers                    []*TransferEvent
	Delegates                    []*DelegateEvent
	Votes                        []*VoteEvent
	OrbsVotingContractName       string
	FirstElectionBlockNumber     int // zero to automatically determine after mirroring completes. positive value to enforce static value
}

func (config *Config) Validate(isDeploy bool) error {
	if !isDeploy {
		if config.OrbsVotingContractName == "" {
			return errors.Errorf("configuration field '%s' is empty, did you forget to update it?", "OrbsVotingContractName")
		}
		if config.EthereumErc20Address == "" {
			return errors.Errorf("configuration field '%s' is empty, did you forget to update it?", "EthereumErc20Address")
		}
		if config.EthereumValidatorsAddress == "" {
			return errors.Errorf("configuration field '%s' is empty, did you forget to update it?", "EthereumValidatorsAddress")
		}
		if config.EthereumValidatorsRegAddress == "" {
			return errors.Errorf("configuration field '%s' is empty, did you forget to update it?", "EthereumValidatorsRegAddress")
		}
		if config.EthereumVotingAddress == "" {
			return errors.Errorf("configuration field '%s' is empty, did you forget to update it?", "EthereumVotingAddress")
		}
		if config.EthereumGuardiansAddress == "" {
			return errors.Errorf("configuration field '%s' is empty, did you forget to update it?", "EthereumGuardiansAddress")
		}
	}
	if config.UserAccountOnOrbs == "" {
		return errors.Errorf("configuration field '%s' is empty, did you forget to update it?", "UserAccountOnOrbs")
	}

	if config.NumberOfAccounts < 10 {
		return errors.Errorf("configuration field '%s' has invalid value '%d'", "NumberOfAccounts", config.NumberOfAccounts)
	}
	if len(config.AccountStakeValues) != config.NumberOfAccounts {
		return errors.Errorf("configuration field '%s' has invalid length '%d'", "AccountStakeValues", len(config.AccountStakeValues))
	}
	if len(config.GuardiansAccounts) < 3 {
		return errors.Errorf("configuration field '%s' has invalid length '%d'", "GuardiansAccounts", len(config.GuardiansAccounts))
	}
	if len(config.ValidatorsAccounts) < 5 {
		return errors.Errorf("configuration field '%s' has invalid length '%d'", "ValidatorsAccounts", len(config.ValidatorsAccounts))
	}
	if config.Transfers == nil || len(config.Transfers) < 10 {
		return errors.Errorf("configuration field '%s' has invalid length '%d'", "Transfers", len(config.Transfers))
	}
	return nil
}

type DelegateEvent struct {
	FromIndex int
	ToIndex   int
}

type TransferEvent struct {
	FromIndex int
	ToIndex   int
	Amount    float32
}

type VoteEvent struct {
	GuardianIndex int
	Candidates    []int
}
