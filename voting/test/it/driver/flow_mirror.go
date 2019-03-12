package driver

import (
	"github.com/stretchr/testify/require"
	"testing"
)

func RunMirrorFlow(t *testing.T, config *Config, orbs OrbsAdapter, ethereum EthereumAdapter) {

	require.NoError(t, config.Validate(false))
	na := NodeAdater(config)

	currentBlock := ethereum.GetCurrentBlock()

	if config.FirstElectionBlockNumber == 0 {
		logStage("Set election date ...")
		orbs.SetFirstElectionBlockNumber(config.OrbsVotingContractName, currentBlock+1)
		logStageDone("Election date in ethereum block number = %d", currentBlock+1)
	} else {
		logStage("Election starts at block number %d", config.FirstElectionBlockNumber)
	}


	logStage("Running mirror script  ...")
	na.Mirror(config.OrbsVotingContractName, config.EthereumErc20Address, config.EthereumVotingAddress, ethereum.GetStartOfHistoryBlock(), currentBlock,
		ethereum.GetConnectionUrl(), orbs.GetOrbsEnvironment())
	logStageDone("Delegate mirroring")

	//logStage("Running script to find Delegate Transfer Events ...")
	//delegateByTransferEvents := na.FindDelegateByTransferEvents(config.EthereumErc20Address, ethereum.GetStartOfHistoryBlock(), currentBlock)
	//// TODO v1 calculate how many delegate transfer, which to/from -- issue i hold index and not address ??
	////require.Equal(t, 7, len(delegateByTransferEvents), "should be 8 transfer txs")
	//logStageDone("Delegate Transfer events = %v", delegateByTransferEvents)
	//
	//logStage("Mirroring %d Delegate Transfer Events ...", len(delegateByTransferEvents))
	//for _, dt := range delegateByTransferEvents {
	//	orbs.MirrorDelegateByTransfer(config.OrbsVotingContractName, dt.TxHash)
	//}
	//logStageDone("Mirroring Delegate Transfer")
	//
	//logStage("Running script to find Delegate Events ...")
	//delegateEvents := na.FindDelegateEvents(config.EthereumVotingAddress, ethereum.GetStartOfHistoryBlock(), currentBlock)
	//// TODO v1 calculate how many delegate which to/from -- issue i hold index and not address ??
	////require.Equal(t, 7, len(delegateByTransferEvents), "should be 8 transfer txs")
	//logStageDone("Delegate Transfer events = %v", delegateEvents)
	//
	//logStage("Mirroring %d Delegate Events ...", len(delegateEvents))
	//for _, dt := range delegateEvents {
	//	orbs.MirrorDelegate(config.OrbsVotingContractName, dt.TxHash)
	//}
	//logStageDone("Mirroring Delegate")
	//
	//logStage("Running script to find Voting Events ...")
	//votingEvents := na.FindVoteEvents(config.EthereumVotingAddress, ethereum.GetStartOfHistoryBlock(), currentBlock)
	//// TODO v1 calculate how many vote, which to/from -- issue i hold index and not address ??
	////require.Equal(t, 7, len(delegateByTransferEvents), "should be 8 transfer txs")
	//logStageDone("Voting events = %v", votingEvents)
	//
	//logStage("Mirroring %d Voting Events ...", len(votingEvents))
	//for _, vt := range votingEvents {
	//	orbs.MirrorVote(config.OrbsVotingContractName, vt.TxHash)
	//}
	//logStageDone("Mirroring Voting")

	logStage("Advance 10 ethereum blocks ...")
	ethereum.Mine(orbs.GetMirrorVotingPeriod() + 5)
	logStageDone("Advance done")

	logSummary("Mirror Phase all done.\n\n")

}
