/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const BN = require('bn.js');
const chai = require('chai');
chai.use(require('chai-bn')(BN));
const expect = chai.expect;

const {expectRevert} = require('./assertExtensions');
const {RewardsClient} = require('../client/RewardsClient');

const OrbsRewardsDistribution = artifacts.require('./OrbsRewardsDistribution');

const Driver = require('./driver');

contract('OrbsRewardsDistribution', accounts => {
    const distributionEvent = "testName";
    const owner = accounts[0];
    const nonOwner = accounts[1];
    const rewardsDistributor = accounts[2];

    describe('integration test - full flow', () => {
        it('integration test - distributes rewards specified in rewards report', async () => {
            console.log("init driver and deploying contracts...");
            const d = await Driver.newWithContracts(owner);
            let totalGasUsed = 0;

            const rewardsClient = new RewardsClient(d.getRewardsContract());

            console.log(`deployed rewards contract: ${d.rewards.address}`);
            console.log(`owner address:             ${owner} (${web3.utils.fromWei(await web3.eth.getBalance(owner), 'ether')} ether)`);
            console.log(`non-owner address:         ${nonOwner} (${web3.utils.fromWei(await web3.eth.getBalance(nonOwner), 'ether')} ether)`);
            console.log();
            console.log("parsing rewards file...");
            const {totalAmount, rewardsSuperset, batches, hashes} = await rewardsClient.parseBatches("test/dummy_election.csv", 10);

            // owner action: transfer tokens to contract
            console.log(`transferring ${totalAmount} tokens to contract`);
            await d.assignTokenToContract(totalAmount);
            expect(await d.balanceOfContract()).to.be.bignumber.equal(totalAmount);

            // owner action: announce rewards
            console.log("committing to batch hashes...");
            const announcementResult = await d.announceDistributionEvent(distributionEvent, hashes);
            totalGasUsed += announcementResult.receipt.gasUsed;

            // verify batch hashes were recorded
            const {pendingBatchHashes} = await d.getPendingBatches(distributionEvent);
            expect(pendingBatchHashes).to.deep.equal(hashes);

            // execute all batches
            console.log("executing transfers in batches...");
            const firstBlockNumber = await web3.eth.getBlockNumber();
            const batchResults = await rewardsClient.executeBatches(
                distributionEvent,
                batches,
                {from: nonOwner}
            );

            batchResults.forEach(res => {
                totalGasUsed += res.receipt.gasUsed;
            });

            // check balances
            console.log("checking balances...");
            expect(await d.balanceOfContract()).to.be.bignumber.equal(new BN(0));
            rewardsSuperset.map(async (reward) => {
                expect(await d.balanceOf(reward.address)).to.be.bignumber.equal(new BN(reward.amount));
            });

            // check events
            console.log("checking events...");
            const events = await d.getPastEvents("RewardDistributed", {fromBlock: firstBlockNumber});
            const readRewards = events.map(log => ({
                address: log.args.recipient.toLowerCase(),
                amount: log.args.amount.toString()
            }));


            expect(readRewards).to.have.same.deep.members(rewardsSuperset.map(r => {
                return {address: r.address, amount: r.amount.toString()}
            }));

            console.log(`total gas used for ${rewardsSuperset.length} rewards in ${batches.length} batches is ${totalGasUsed}`);
        });
    });

    it('deploys contract successfully with ERC20 instance', async () => {
        const d = await Driver.newWithContracts(owner);

        const rewards = d.getRewardsContract();
        expect(rewards).to.exist;
        expect(await (rewards.orbs())).to.equal(d.erc20.address);
    });

    it('is Ownable', async () => {
        const d = await Driver.newWithContracts(owner);

        const rewards = d.getRewardsContract();
        expect(rewards).to.exist;
        expect(await (rewards.owner())).to.equal(owner);
        expect(await (rewards.isOwner({from: owner}))).to.be.true;
        expect(await (rewards.isOwner({from: nonOwner}))).to.be.false;

        const newOwner = accounts[2];
        await rewards.transferOwnership(newOwner, {from: owner});

        expect(await (rewards.isOwner({from: owner}))).to.be.false;
        expect(await (rewards.isOwner({from: newOwner}))).to.be.true;
    });

    it('fails to deploy contract with zero ERC20 instance', async () => {
        const d = await Driver.newWithContracts(owner);

        const zeroAddress = web3.utils.padLeft("0x0", 40);
        const error = await expectRevert(OrbsRewardsDistribution.new(zeroAddress, {from: owner}));
        expect(error).to.have.property("reason", "Address must not be 0!");
    });

    it('is not payable', async () => {
        const d = await Driver.newWithContracts(owner);
        const rewards = d.getRewardsContract();

        await expectRevert(web3.eth.sendTransaction({
            from: owner,
            to: rewards.address,
            value: "1"
        }));
    });


    describe('announceDistributionEvent', () => {
        it('succeeds for new distributions but fails for ongoing distributions', async () => {
            const d = await Driver.newWithContracts(owner);

            await d.announceDistributionEvent(distributionEvent);
            await expectRevert(d.announceDistributionEvent(distributionEvent)); // second announcment fails

            await d.announceDistributionEvent(distributionEvent + "XX"); // a different name works

            await d.abortDistributionEvent(distributionEvent);
            await d.announceDistributionEvent(distributionEvent); // succeed after aborting
        });

        it('succeeds only for owner', async () => {
            const d = await Driver.newWithContracts(owner);

            await expectRevert(d.announceDistributionEvent(distributionEvent, undefined, {from: nonOwner})); // send by non owner

            await d.announceDistributionEvent(distributionEvent); // sends from owner by default
        });

        it('emits RewardsDistributionAnnounced event', async () => {
            const d = await Driver.newWithContracts(owner);

            const result = await d.announceDistributionEvent(distributionEvent);

            expect(result.logs).to.have.length(1);
            const firstEvent = result.logs[0];
            expect(firstEvent).to.have.property("event", "RewardsDistributionAnnounced");
            expect(firstEvent.args).to.have.property('distributionEvent', distributionEvent);
            expect(firstEvent.args).to.have.property('batchHash');
            expect(firstEvent.args).to.have.property('batchCount');
            expect(firstEvent.args.batchHash).to.deep.equal(d.batchHashes);
            expect(firstEvent.args.batchCount).to.be.bignumber.equal(new BN(d.batchHashes.length));
        });

        it('records batches under the provided distribution name', async () => {
            const d = await Driver.newWithContracts(owner);

            await d.announceDistributionEvent(distributionEvent);

            const {pendingBatchHashes} = await d.getPendingBatches(distributionEvent);
            expect(pendingBatchHashes).to.deep.equal(d.batchHashes);
        });

        it('fails when no batch hash is declared', async () => {
            const d = await Driver.newWithContracts(owner);

            const error = await expectRevert(d.announceDistributionEvent(distributionEvent, []));
            expect(error).to.have.property("reason", "at least one batch must be announced");
        });

        it('fails for zero batch hash', async () => {
            const d = await Driver.newWithContracts(owner);

            const zeroHash = web3.utils.leftPad("0x0", 64);
            const error = await expectRevert(d.announceDistributionEvent(distributionEvent, [zeroHash]));
            expect(error).to.have.property("reason", "batch hash may not be 0x0");
        });
    });

    describe('abortDistributionEvent', () => {
        it('emits RewardsDistributionAborted event', async () => {
            const d = await Driver.newWithContracts(owner);

            await d.announceDistributionEvent(distributionEvent);
            const result = await d.abortDistributionEvent(distributionEvent);

            expect(result.logs).to.have.length(1);
            const firstEvent = result.logs[0];
            expect(firstEvent).to.have.property("event", "RewardsDistributionAborted");
            expect(firstEvent.args).to.have.property('distributionEvent', distributionEvent);
            expect(firstEvent.args).to.have.property('abortedBatchHashes');
            expect(firstEvent.args.abortedBatchHashes).to.deep.equal(d.batchHashes);
            expect(firstEvent.args).to.have.property('abortedBatchIndices');
            expect(firstEvent.args.abortedBatchIndices.map(n => n.toNumber())).to.deep.equal(d.batchHashes.map((h, i) => i));
        });

        it('deletes all pending batches', async () => {
            const d = await Driver.newWithContracts(owner);

            await d.announceDistributionEvent(distributionEvent);

            const beforeAbort = await d.getPendingBatches(distributionEvent);
            expect(beforeAbort.pendingBatchHashes).to.have.length(d.batchHashes.length);

            await d.abortDistributionEvent(distributionEvent);

            const afterAbort = await d.getPendingBatches(distributionEvent);
            expect(afterAbort.pendingBatchHashes).to.have.length(0);
        });

        it('fails if distribution event is not currently ongoing', async () => {
            const d = await Driver.newWithContracts(owner);

            const error = await expectRevert(d.abortDistributionEvent(distributionEvent));
            expect(error).to.have.property('reason', "distribution event is not currently ongoing")
        });
    });

    describe("executeCommittedBatch", () => {
        it("distributes orbs and logs RewardDistributed events for each recipient", async () => {
            const d = await Driver.newWithContracts(owner);

            await d.assignTokenToContract(d.getBatchAmount(0));

            await d.announceDistributionEvent(distributionEvent);
            const executionResult = await d.executeBatch(distributionEvent, 0);

            // check balances
            expect(await d.balanceOfContract()).to.be.bignumber.equal(new BN(0));
            d.batches[0].map(async (aReward) => {
                expect(await d.balanceOf(aReward.address)).to.be.bignumber.equal(new BN(aReward.amount));
            });

            // check events
            const RewardDistributedLogs = executionResult.logs.filter(log => log.event === "RewardDistributed");
            const readRewards = RewardDistributedLogs.map(log => ({
                address: log.args.recipient.toLowerCase(),
                amount: log.args.amount.toNumber()
            }));
            expect(readRewards).to.have.same.deep.members(d.batches[0]);
        });

        it("emits RewardsDistributionCompleted event", async () => {
            const d = await Driver.newWithContracts(owner);

            await d.assignTokenToContract(d.getTotalAmount());

            await d.announceDistributionEvent(distributionEvent);
            const firstBatchResult = await d.executeBatch(distributionEvent, 0);
            const secondBatchResult = await d.executeBatch(distributionEvent, 1);

            const firstBatchCompletedEvents = firstBatchResult.logs.filter(log => log.event === "RewardsDistributionCompleted");
            const secondBatchCompletedEvents = secondBatchResult.logs.filter(log => log.event === "RewardsDistributionCompleted");

            expect(firstBatchCompletedEvents).to.have.length(0);
            expect(secondBatchCompletedEvents).to.have.length(1);
            expect(secondBatchCompletedEvents[0].args).to.have.property("distributionEvent", distributionEvent);
        });

        it("emits RewardsBatchExecuted events", async () => {
            const d = await Driver.newWithContracts(owner);

            await d.assignTokenToContract(d.getTotalAmount());

            await d.announceDistributionEvent(distributionEvent);
            const firstBatchResult = await d.executeBatch(distributionEvent, 0);

            const firstRewardsBatchExecuted = firstBatchResult.logs.filter(log => log.event === "RewardsBatchExecuted");

            expect(firstRewardsBatchExecuted).to.have.length(1);
            expect(firstRewardsBatchExecuted[0].args).to.have.property('distributionEvent', distributionEvent);
            expect(firstRewardsBatchExecuted[0].args).to.have.property('batchHash', d.batchHashes[0]);
            expect(firstRewardsBatchExecuted[0].args.batchIndex).to.be.bignumber.equal(new BN(0));
        });

        it("emits RewardDistributed events", async () => {
            const d = await Driver.newWithContracts(owner);

            await d.assignTokenToContract(d.getTotalAmount());

            await d.announceDistributionEvent(distributionEvent);
            const firstBatchResult = await d.executeBatch(distributionEvent, 0);

            const firstRewardDistributed = firstBatchResult.logs.filter(log => log.event === "RewardDistributed");

            expect(firstRewardDistributed).to.have.length(d.batches[0].length);

            firstRewardDistributed.forEach((l, i) => {
                expect(l.args).to.have.property('distributionEvent', distributionEvent);
                expect(l.args).to.have.property('recipient');
                expect(l.args.recipient.toLowerCase()).to.equal(d.batches[0][i].address);
                expect(l.args.amount).to.be.bignumber.equal(new BN(d.batches[0][i].amount));
            });
        });

        it("supports processing batches out of order", async () => {
            const d = await Driver.newWithContracts(owner);

            await d.assignTokenToContract(d.getTotalAmount());

            await d.announceDistributionEvent(distributionEvent);
            await d.executeBatch(distributionEvent, 1);
            await d.executeBatch(distributionEvent, 0);
        });

        it("fails if distributionEvent or was not announced, but succeeds otherwise", async () => {
            const d = await Driver.newWithContracts(owner);

            await d.assignTokenToContract(d.getBatchAmount(0));

            await expectRevert(d.executeBatch(distributionEvent, 0));

            await d.announceDistributionEvent(distributionEvent);
            await d.executeBatch(distributionEvent, 0);
        });

        it("fails if batch or was not announced at exact position", async () => {
            const d = await Driver.newWithContracts(owner);

            await d.assignTokenToContract(d.getBatchAmount(0));

            await d.announceDistributionEvent(distributionEvent);

            const err1 = await expectRevert(d.executeBatch(distributionEvent, 0, d.batches[0].slice(1))); // wrong batch data
            expect(err1).to.have.property('reason', 'batch hash does not match');

            const err2 = await expectRevert(d.executeBatch(distributionEvent, 1, d.batches[0])); // wrong batchIndex
            expect(err2).to.have.property('reason', 'batch hash does not match');
        });

        it("fails if batch array lengths dont match", async () => {
            const d = await Driver.newWithContracts(owner);

            await d.assignTokenToContract(d.getBatchAmount(0));

            await d.announceDistributionEvent(distributionEvent);

            const batch = d.batches[0];
            const error = await expectRevert(d.rewards.executeCommittedBatch(distributionEvent, batch.map(r => r.address), batch.slice(1).map(r => r.amount), 0));
            expect(error).to.have.property('reason', 'array length mismatch')
        });

        it("fails for an empty batch", async () => {
            const d = await Driver.newWithContracts(owner);

            // TODO - instead of violating encapsulation use builder pattern to replace batch

            // set the first address in the batch to 0x0 and correct the hash
            d.batches[0] = [];
            d.batchHashes[0] = RewardsClient.hashBatch(0, d.batches[0]);

            await d.assignTokenToContract(d.getBatchAmount(0));

            await d.announceDistributionEvent(distributionEvent);

            const error = await expectRevert(d.executeBatch(distributionEvent, 0));
            expect(error).to.have.property("reason", "at least one reward must be included in a batch");
        });

        it("fails for zero-address recipient", async () => {
            const d = await Driver.newWithContracts(owner);

            // TODO - instead of violating encapsulation use builder pattern to replace batch
            const firstBatch = d.batches[0];

            // set the first address in the batch to 0x0 and correct the hash
            firstBatch[0].address = firstBatch[0].address.replace(/[^x]/g, "0");
            d.batchHashes[0] = RewardsClient.hashBatch(0, firstBatch);

            await d.assignTokenToContract(d.getBatchAmount(0));

            await d.announceDistributionEvent(distributionEvent);

            const error = await expectRevert(d.executeBatch(distributionEvent, 0));
            expect(error).to.have.property("reason", "recipient must be a valid address");
        });

        it("succeeds for zero amount", async () => {
            const d = await Driver.newWithContracts(owner);

            // TODO - instead of violating encapsulation use builder pattern to replace batch
            const firstBatch = d.batches[0];

            // set the first amount in the batch to 0 and correct the hash
            firstBatch[0].amount = 0;
            d.batchHashes[0] = RewardsClient.hashBatch(0, firstBatch);

            await d.assignTokenToContract(d.getBatchAmount(0));

            await d.announceDistributionEvent(distributionEvent);

            await d.executeBatch(distributionEvent, 0);
        });

        it("distributes each batch only once", async () => {
            const d = await Driver.newWithContracts(owner);

            await d.assignTokenToContract(d.getTotalAmount() * 2); // provide enough for two payments

            await d.announceDistributionEvent(distributionEvent);

            await d.executeBatch(distributionEvent, 0); // first time

            await expectRevert(d.executeBatch(distributionEvent, 0)); // second time
        });

        it("removes the batch hash from pending batches", async () => {
            const d = await Driver.newWithContracts(owner);

            await d.assignTokenToContract(d.getTotalAmount() * 2);

            await d.announceDistributionEvent(distributionEvent);

            const beforeExec = await d.getPendingBatches(distributionEvent);
            expect(beforeExec.pendingBatchHashes).to.deep.equal(d.batchHashes);
            expect(beforeExec.pendingBatchIndices.map(i => i.toNumber())).to.deep.equal([0, 1]);

            await d.executeBatch(distributionEvent, 0);

            const afterExec = await d.getPendingBatches(distributionEvent);
            expect(afterExec.pendingBatchHashes).to.deep.equal(beforeExec.pendingBatchHashes.slice(1));
            expect(afterExec.pendingBatchIndices.map(i => i.toNumber())).to.deep.equal([1]);
        });
    });

    describe("distributeRewards", () => {
        it('succeeds only for assigned rewards-distributor', async () => {
            const d = await Driver.newWithContracts(owner);

            await d.assignTokenToContract(d.getBatchAmount(0));

            await d.setRewardsDistributor(rewardsDistributor);
            await expectRevert(d.distributeRewards(distributionEvent, 0, undefined, {from: nonOwner}));
            await expectRevert(d.distributeRewards(distributionEvent, 0, undefined, {from: owner}));
            await d.distributeRewards(distributionEvent, 0, undefined, {from: rewardsDistributor})
        });

        it("distributes orbs and logs RewardDistributed events for each recipient", async () => {
            const d = await Driver.newWithContracts(owner);

            await d.assignTokenToContract(d.getBatchAmount(0));
            await d.setRewardsDistributor(rewardsDistributor);

            const executionResult = await d.distributeRewards(distributionEvent, 0);

            // check balances
            expect(await d.balanceOfContract()).to.be.bignumber.equal(new BN(0));
            d.batches[0].map(async (aReward) => {
                expect(await d.balanceOf(aReward.address)).to.be.bignumber.equal(new BN(aReward.amount));
            });

            // check events
            const RewardDistributedLogs = executionResult.logs.filter(log => log.event === "RewardDistributed");
            const readRewards = RewardDistributedLogs.map(log => ({
                address: log.args.recipient.toLowerCase(),
                amount: log.args.amount.toNumber()
            }));
            expect(readRewards).to.have.same.deep.members(d.batches[0]);
        });

        it("emits RewardDistributed events", async () => {
            const d = await Driver.newWithContracts(owner);

            await d.assignTokenToContract(d.getTotalAmount());
            await d.setRewardsDistributor(rewardsDistributor);

            const result = await d.distributeRewards(distributionEvent, 0);

            const rewardDistributedEvents = result.logs.filter(log => log.event === "RewardDistributed");

            expect(rewardDistributedEvents).to.have.length(d.batches[0].length);
            rewardDistributedEvents.forEach((l, i) => {
                expect(l.args).to.have.property('distributionEvent', distributionEvent);
                expect(l.args).to.have.property('recipient');
                expect(l.args.recipient.toLowerCase()).to.equal(d.batches[0][i].address);
                expect(l.args.amount).to.be.bignumber.equal(new BN(d.batches[0][i].amount));
            });
        });

        it("fails if batch array lengths dont match", async () => {
            const d = await Driver.newWithContracts(owner);

            await d.assignTokenToContract(d.getBatchAmount(0));
            await d.setRewardsDistributor(rewardsDistributor);

            const batch = d.batches[0];
            const error = await expectRevert(d.rewards.distributeRewards(distributionEvent, batch.map(r => r.address), batch.slice(1).map(r => r.amount), {from: rewardsDistributor}));
            expect(error).to.have.property('reason', 'array length mismatch')
        });

        it("fails for zero recipient", async () => {
            const d = await Driver.newWithContracts(owner);

            // TODO - instead of violating encapsulation use builder pattern to replace batch
            const firstBatch = d.batches[0];

            // set the first address in the batch to 0x0 and correct the hash
            firstBatch[0].address = firstBatch[0].address.replace(/[^x]/g, "0");
            d.batchHashes[0] = RewardsClient.hashBatch(0, firstBatch);

            await d.assignTokenToContract(d.getBatchAmount(0));
            await d.setRewardsDistributor(rewardsDistributor);

            const error = await expectRevert(d.distributeRewards(distributionEvent, 0));
            expect(error).to.have.property("reason", "recipient must be a valid address");
        });

        it("succeeds for zero amount", async () => {
            const d = await Driver.newWithContracts(owner);

            // TODO - instead of violating encapsulation use builder pattern to replace batch
            const firstBatch = d.batches[0];

            // set the first amount in the batch to 0 and correct the hash
            firstBatch[0].amount = 0;
            d.batchHashes[0] = RewardsClient.hashBatch(0, firstBatch);

            await d.assignTokenToContract(d.getBatchAmount(0));
            await d.setRewardsDistributor(rewardsDistributor);

            await d.distributeRewards(distributionEvent, 0);
        });
    });

    describe("drainOrbs", () => {
        it('succeeds only for owner', async () => {
            const d = await Driver.newWithContracts(owner);

            await d.assignTokenToContract(d.getBatchAmount(0));

            await expectRevert(d.rewards.drainOrbs({from: nonOwner}));
            await d.rewards.drainOrbs({from: owner});
        });

        it('transfers orbs to owner', async () => {
            const d = await Driver.newWithContracts(owner);

            const amount = 1000000000;
            await d.assignTokenToContract(amount);

            expect(await d.erc20.balanceOf(nonOwner)).to.be.bignumber.equal(new BN(0));
            await d.rewards.drainOrbs({from: owner});
            expect(await d.erc20.balanceOf(owner)).to.be.bignumber.equal(new BN(amount));
            expect(await d.erc20.balanceOf(d.rewards.address)).to.be.bignumber.equal(new BN(0));
        });
    });

    describe("defines rewards distributor role", () => {
        it("rewards distributor initializes to 0 address", async () => {
            const d = await Driver.newWithContracts(owner);
            expect(await d.rewards.rewardsDistributor()).to.be.equal("0x0000000000000000000000000000000000000000");
        });

        it("only owner can assign a rewards distributor", async () => {
            const d = await Driver.newWithContracts(owner);

            await expectRevert(d.rewards.reassignRewardsDistributor(accounts[6], {from: nonOwner}));
            await d.rewards.reassignRewardsDistributor(accounts[6], {from: owner});

            expect(await d.rewards.rewardsDistributor()).to.be.equal(accounts[6]);
            expect(await d.rewards.isRewardsDistributor({from: accounts[6]})).to.be.true;

            await expectRevert(d.rewards.reassignRewardsDistributor(accounts[7], {from: nonOwner}));
            await d.rewards.reassignRewardsDistributor(accounts[7], {from: owner});

            expect(await d.rewards.rewardsDistributor()).to.be.equal(accounts[7]);
            expect(await d.rewards.isRewardsDistributor({from: accounts[7]})).to.be.true;
            expect(await d.rewards.isRewardsDistributor({from: accounts[6]})).to.be.false;
        });

        it("emits event", async () => {
            const d = await Driver.newWithContracts(owner);

            const currentDistributor = accounts[5];
            await d.rewards.reassignRewardsDistributor(currentDistributor, {from: owner})
            expect(await d.rewards.rewardsDistributor()).to.equal(currentDistributor);

            const nextDistributor = accounts[6];
            const result = await d.rewards.reassignRewardsDistributor(nextDistributor, {from: owner});

            expect(result).to.have.property('logs');
            expect(result.logs).to.have.length(1);
            expect(result.logs[0]).to.have.property('event', 'RewardsDistributorReassigned');
            expect(result.logs[0]).to.have.property('args');
            expect(result.logs[0].args).to.have.property('previousRewardsDistributor', currentDistributor);
            expect(result.logs[0].args).to.have.property('newRewardsDistributor', nextDistributor);
        });
    });
});
