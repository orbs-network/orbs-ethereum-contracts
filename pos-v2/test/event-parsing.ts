import Web3 from "web3";
declare const web3: Web3;

const elections = artifacts.require("Elections");
const staking = artifacts.require("StakingContract");
const subscriptions = artifacts.require("Subscriptions");
const rewards = artifacts.require("Rewards");

function parseLogs(txResult, inputs, eventSignature) {
    const eventSignatureHash = web3.eth.abi.encodeEventSignature(eventSignature);
    return txResult.receipt.rawLogs
        .filter(rl => rl.topics[0] === eventSignatureHash)
        .map(rawLog => web3.eth.abi.decodeLog(inputs, rawLog.data, rawLog.topics.slice(1) /*assume all events are non-anonymous*/));
}

export function committeeChangedEvents(txResult) {
    const inputs = elections.abi.find(e => e.name == "CommitteeChanged").inputs;
    const eventSignature = "CommitteeChanged(address[],address[],uint256[])";

    return parseLogs(txResult, inputs, eventSignature)
}

export function validatorRegisteredEvents(txResult) {
    const inputs = elections.abi.find(e => e.name == "ValidatorRegistered").inputs;
    const eventSignature = "ValidatorRegistered(address,bytes4)";

    return parseLogs(txResult, inputs, eventSignature)
}

export function stakedEvents(txResult) {
    const inputs = staking.abi.find(e => e.name == "Staked").inputs;
    const eventSignature = "Staked(address,uint256,uint256)";

    return parseLogs(txResult, inputs, eventSignature)
}

export function unstakedEvents(txResult) {
    const inputs = staking.abi.find(e => e.name == "Unstaked").inputs;
    const eventSignature = "Unstaked(address,uint256,uint256)";

    return parseLogs(txResult, inputs, eventSignature)
}

export function delegatedEvents(txResult) {
    const inputs = elections.abi.find(e => e.name == "Delegated").inputs;
    const eventSignature = "Delegated(address,address)";

    return parseLogs(txResult, inputs, eventSignature)
}

export function totalStakeChangedEvents(txResult) {
    const inputs = elections.abi.find(e => e.name == "TotalStakeChanged").inputs;
    const eventSignature = "TotalStakeChanged(address,uint256)";

    return parseLogs(txResult, inputs, eventSignature)
}

export function subscriptionChangedEvents(txResult) {
    const inputs = subscriptions.abi.find(e => e.name == "SubscriptionChanged").inputs;
    const eventSignature = "SubscriptionChanged(uint256,uint256,uint256,string)";

    return parseLogs(txResult, inputs, eventSignature);
}

export function paymentEvents(txResult) {
    const inputs = subscriptions.abi.find(e => e.name == "Payment").inputs;
    const eventSignature = "Payment(uint256,address,uint256,string,uint256)";

    return parseLogs(txResult, inputs, eventSignature);
}

export function feeAddedToBucketEvents(txResult) {
    const inputs = rewards.abi.find(e => e.name == "FeeAddedToBucket").inputs;
    const eventSignature = "FeeAddedToBucket(uint256,uint256,uint256)";

    return parseLogs(txResult, inputs, eventSignature);
}

export function rewardAssignedEvents(txResult) {
    const inputs = rewards.abi.find(e => e.name == "RewardAssigned").inputs;
    const eventSignature = "RewardAssigned(address,uint256,uint256)";

    return parseLogs(txResult, inputs, eventSignature);
}
