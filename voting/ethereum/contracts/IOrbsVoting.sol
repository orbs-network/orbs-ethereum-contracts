pragma solidity 0.5.3;


interface IOrbsVoting {
    event VoteOut(address indexed voter, bytes20[] nodes, uint voteCounter);
    event Delegate(
        address indexed delegator,
        address indexed to,
        uint delegationCounter
    );

    function voteOut(address[] calldata nodes) external;
    function delegate(address to) external;
    function getLastVote(address guardian)
        external
        view
        returns (address[] memory nodes, uint blockHeight);
}