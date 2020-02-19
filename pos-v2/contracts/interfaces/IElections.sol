pragma solidity 0.4.26;
import "./IContractRegistry.sol";

/// @title Elections contract interface
interface IElections {
	event ValidatorRegistered(address addr, bytes4 ip, address orbsAddr);
	event CommitteeChanged(address[] addrs, address[] orbsAddrs, uint256[] stakes);
	event TopologyChanged(address[] orbsAddrs, bytes4[] ips);
	event VotedOutEvent(address votedOut);
	event Delegated(address from, address to);
	event TotalStakeChanged(address addr, uint256 newTotal); // TODO - do we need this?

	/*
	 *   External methods
	 */

	/// @dev Called by a participant who wishes to register as a validator
	function registerValidator(bytes4 _ip, address _orbsAddress) external;

	/// @dev Called by a validator when ready to join the committee, typically after syncing is complete or after being voted out
	function notifyReadyForCommittee() external;

	/// @dev Stake delegation
	function delegate(address to) external;

	/// @dev Called by a validator as part of the automatic vote-out flow
	function voteOut(address addr) external;

	/// @dev Refreshes the staking information (and the corresponding rank in committee and topology) for the given addresses.
	function refreshStakes(address[] addrs) external;

	/// @dev casts a banning vote by the sender to the given address
	function voteForBanning(address against) external;

	/// @dev uncasts a banning vote by the sender to the given address
	function unvoteForBanning(address against) external;

	/// @dev refreshes a banning vote by the given voter to reflect stake changes that occured since the actual vote. Can be called by anyone.
	function refreshBanningVote(address voter, address against) external;

	/*
	 *   Methods restricted to other Orbs contracts
	 */

	/// @dev Called by: staking contract
	/// Notifies a batch of stake updates
	function distributedStake(address[] stakeOwners, uint256[] amounts) external /* onlyStakingContract */;

	/// @dev Called by: staking contract
	/// Notifies an increase of stake
	function staked(address staker, uint256 amount) external /* onlyStakingContract */;

	/// @dev Called by: staking contract
	/// Notifies a decrease of stake
	function unstaked(address staker, uint256 amount) external /* onlyStakingContract */;

	/*
	 * Governance
	 */
	/// @dev Updates the address of the contract registry
	function setContractRegistry(IContractRegistry _contractRegistry) external /* onlyOwner */;

	/*
	 *   Test helpers
	 */

	function getTopology() external view returns (address[]);
}
