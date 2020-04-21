/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
BigInt.prototype.toJSON = function() { return this.toString(); };
const OrbsClientSdk = require("orbs-client-sdk");

class Orbs {
    constructor(url, vChainId, name) {
        if (!url) {
            throw new Error("missing orbs url");
        }
        if (!name) {
            throw new Error("missing orbs virtual chain id");
        }
        if (!name) {
            throw new Error("missing orbs contract name");
        }

        this.name = name;
        this.signer = OrbsClientSdk.createAccount();
        this.client = new OrbsClientSdk.Client(url, vChainId, OrbsClientSdk.NetworkType.NETWORK_TYPE_TEST_NET, new OrbsClientSdk.LocalSigner(this.signer));
        this.helpers = OrbsClientSdk;
    }

    get ProcessDone() { return 1; }
    get ProcessContinue() { return 2; }
    get ProcessError() { return 3; }
    get ProcessPending() { return 4; }

    async getCurrentBlockNumber() {
        return Number(await this.queryResult("getCurrentEthereumBlockNumber"));
    }

    async isElectionsOverDue() {
        return Number(await this.queryResult("isElectionOverdue")) > 0;
    }

    async getElectedValidators(electionNumber) {
        let rawOutput = await this.queryResult("getElectedValidatorsEthereumAddressByIndex", OrbsClientSdk.argUint32(electionNumber));
        const addressLength = 20;
        const numOfValidators = rawOutput.length / addressLength;
        const elected = [];
        for (let i = 0; i < numOfValidators; i++) {
            const start = i * addressLength;
            const end = start + addressLength;
            const rawAddress = new Uint8Array(rawOutput.slice(start, end));
            elected.push({rawAddress, address : OrbsClientSdk.encodeHex(rawAddress)});
        }

        return elected;
    }

    async getNumberOfElections() {
        return Number(await this.queryResult("getNumberOfElections"));
    }

    async getNextElectionsBlockNumber() {
        return Number(await this.queryResult("getCurrentElectionBlockNumber"));
    }

    async getTotalStake() {
        return Number(await this.queryResult("getTotalStake"));
    }

    async getValidatorStake(addr) {
        return Number(await this.queryResult("getValidatorStake", OrbsClientSdk.argBytes(addr)));
    }

    async isProcessingPeriod() {
        return Number(await this.queryResult("isProcessingPeriod")) > 0;
    }

    async processVote() {
        let response = await this.transact("processVoting");
        if (response.requestStatus === "COMPLETED") {
            if (response.executionResult === "SUCCESS") {
                return Number(Orbs.getRawValue(response)) === 1 ? this.ProcessDone : this.ProcessContinue;
            } else {
                return Orbs.getRawValue(response).startsWith('mirror period of election') ? this.ProcessDone : this.ProcessError;
            }
        } else if (response.requestStatus === "IN_PROCESS" && response.executionResult === "NOT_EXECUTED" && response.transactionStatus === "PENDING") {
            return this.ProcessPending;
        } else {
            console.error(`request processVoting returned error`, response); // log as this is not a throw "error" kind of fail.
            return this.ProcessError;
        }
    }

    async transact(methodName, ...args) {
        const [t] = await this.client.createTransaction(this.name, methodName, args);
        return this.client.sendTransaction(t);
    }

    async query(methodName, ...args) {
        const q = await this.client.createQuery(this.name, methodName, args);
        return this.client.sendQuery(q);
    }

    async queryResult(methodName, ...args) {
        let response = await this.query(methodName, ...args);
        if(!(response.requestStatus === "COMPLETED" && response.executionResult === "SUCCESS")) {
            throw new Error(`Error: query to method ${methodName} returned error message ${JSON.stringify(response)}`);
        }
        return Orbs.getRawValue(response);
    }

    static getRawValue(response) {
        return response.outputArguments[0].value;
    }
}

async function create(urlsString, vChainId, name) {
    let urls = urlsString.split(',');
    for (let i = 0;i < urls.length;i++) {
        try {
            let orbs = new Orbs(urls[i], vChainId, name);
            await orbs.getNumberOfElections();
            return orbs;
        } catch(e) {
            console.log(`could not connect to ${urls[i]}`);
        }
    }
    throw new Error(`Error: Cannot connect to any of the Orbs urls ${urlsString}`);
}

module.exports = create;
