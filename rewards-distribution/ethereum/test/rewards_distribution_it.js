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
const ERC20 = artifacts.require('./TestingERC20');

contract('OrbsRewardsDistribution', accounts => {
    const owner = accounts[0];
    const nonOwner = accounts[1];

    describe('integration test - full flow', () => {
        it('integration test - distributes rewards specified in rewards report', async () => {
            let step = 0;
            console.log("init...", step++);
            const d = await Driver.newWithContracts(owner);
            let totalGasUsed = 0;

            const rewardsClient = new RewardsClient(d.getRewardsContract());

            console.log("parsing rewards file...", step++);
            const {totalAmount, rewardsSuperset, batches, hashes} = await rewardsClient.parseBatches("test/dummy_election.csv", 7);

            // owner action: transfer tokens to contract
            console.log(`transferring ${totalAmount} tokens to contract`, step++);
            await d.assignTokenToContract(totalAmount);
            expect(await d.balanceOfContract()).to.be.bignumber.equal(totalAmount);

            // owner action: announce rewards
            console.log("committing to batch hashes...", step++);
            const announcementResult = await d.announceDistributionEvent(distributionEvent, hashes);
            totalGasUsed += announcementResult.receipt.gasUsed;

            // verify batch hashes were recorded
            const {pendingBatchHashes} = await d.getPendingBatches(distributionEvent);
            expect(pendingBatchHashes).to.deep.equal(hashes);

            // execute all batches
            console.log("executing transfers in batches...", step++);
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
            console.log("checking balances...", step++);
            expect(await d.balanceOfContract()).to.be.bignumber.equal(new BN(0));
            rewardsSuperset.map(async (reward) => {
                expect(await d.balanceOf(reward.address)).to.be.bignumber.equal(new BN(reward.amount));
            });

            // check events
            console.log("checking events...", step++);
            const events = await d.getPastEvents("RewardDistributed", {fromBlock: firstBlockNumber});
            const readRewards = events.map(log => ({
                address: log.args.recipient.toLowerCase(),
                amount: log.args.amount.toNumber()
            }));
            expect(readRewards).to.have.same.deep.members(rewardsSuperset);

            console.log(`total gas used for ${rewardsSuperset.length} rewards in ${batches.length} batches is ${totalGasUsed}`);
        });
    });

    it('deploys contract successfully with ERC20 instance', async () => {
        const d = await Driver.newWithContracts(owner);

        expect(d.getRewardsContract()).to.exist;
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


    const distributionEvent = "testName";
    describe('announceDistributionEvent', () => {
        it('succeeds for new distributions but fails for ongoing distributions', async () => {
            const d = await Driver.newWithContracts(owner);

            await d.announceDistributionEvent(distributionEvent);
            await expectRevert(d.announceDistributionEvent(distributionEvent)); // second announcment fails

            await d.announceDistributionEvent(distributionEvent + "XX"); // a different name works

            await d.abortDistributionEvent(distributionEvent);
            await d.announceDistributionEvent(distributionEvent); // succeed after aborting
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

            const {pendingBatchHashes} = await d.getPendingBatches(distributionEvent);
            expect(pendingBatchHashes).to.deep.equal(d.batchHashes);
        });

        it('records batches under the provided distribution name', async () => {
            const d = await Driver.newWithContracts(owner);

            await d.announceDistributionEvent(distributionEvent);

            const {pendingBatchHashes} = await d.getPendingBatches(distributionEvent);
            expect(pendingBatchHashes).to.deep.equal(d.batchHashes);
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

        it("fails if batch or was not announced at exact position, but succeeds for declared batches", async () => {
            const d = await Driver.newWithContracts(owner);

            await d.assignTokenToContract(d.getBatchAmount(0));

            await d.announceDistributionEvent(distributionEvent);

            await expectRevert(d.executeBatch(distributionEvent, 0, d.batches[0].slice(1))); // wrong batch list

            await expectRevert(d.executeBatch(distributionEvent, 1, d.batches[0])); // wrong batchIndex

            await d.executeBatch(distributionEvent, 0, d.batches[0]);
        });

        it("fails for zero recipient", async () => {
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
});

// TODO use builder pattern to allow creation of batches and also to override batch content
class Driver {
    constructor(owner, batchCount, batchSize) {
        this.owner = owner;
        const superset = this.generateRewardsSet(batchSize * batchCount);
        this.batches = [];
        this.batchHashes = [];
        while (superset.length) {
            const nextHashIdx = this.batchHashes.length;
            this.batches.push(superset.splice(0, batchSize));
            this.batchHashes.push(RewardsClient.hashBatch(nextHashIdx, this.batches[nextHashIdx]));
        }
    }

    generateRewardsSet(count) {
        const result = [];
        for (let i = 0; i < count; i++) {
            const addr = "0x" + (i + 1).toString(16).padStart(40, "0");
            result.push({address: addr, amount: i + 1});
        }
        return result;
    }

    static async newWithContracts(owner) {
        const d = new Driver(owner, 2, 5);
        d.erc20 = await ERC20.new();
        d.rewards = await OrbsRewardsDistribution.new(d.erc20.address, {from: owner});
        return d;
    }

    getRewardsContract() {
        return this.rewards;
    }

    async assignTokenToContract(amount) {
        return this.erc20.assign(this.rewards.address, amount);
    }

    async balanceOfContract() {
        return this.erc20.balanceOf(this.rewards.address);
    }

    async balanceOf(address) {
        return this.erc20.balanceOf(address);
    }

    async getPastEvents(name, options) {
        return this.rewards.getPastEvents(name, options);
    }

    async getPendingBatches(distributionEvent) {
        return this.rewards.getPendingBatches(distributionEvent);
    }

    async abortDistributionEvent(distributionEvent) {
        return this.rewards.abortDistributionEvent(distributionEvent);
    }

    async announceDistributionEvent(distributionEvent, hashes) {
        if (hashes === undefined) {
            hashes = this.batchHashes;
        }
        return this.rewards.announceDistributionEvent(distributionEvent, hashes, {from: this.owner});
    }

    async executeBatch(distributionEvent, batchIndex, batch) {
        if (batch === undefined) {
            batch = this.batches[batchIndex];
        }
        return this.rewards.executeCommittedBatch(distributionEvent, batch.map(r => r.address), batch.map(r => r.amount), batchIndex);
    }

    getTotalAmount() {
        const merged = [].concat(...this.batches);
        return merged.reduce((sum, reward) => sum + reward.amount, 0)
    }

    getBatchAmount(batchIndex) {
        return this.batches[batchIndex].reduce((sum, reward) => sum + reward.amount, 0)
    }
}