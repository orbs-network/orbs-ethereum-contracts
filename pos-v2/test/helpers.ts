import Web3 from "web3";
import BN from "bn.js";

declare const web3: Web3;

export const retry = (n: number, f: () => Promise<void>) => async  () => {
    for (let i = 0; i < n; i++) {
        await f();
    }
};

export const evmIncreaseTime = async (seconds: number) => new Promise(
    (resolve, reject) =>
        (web3 as any).currentProvider.send(
            {method: "evm_increaseTime", params: [seconds]},
            (err, res) => err ? reject(err) : resolve(res)
        )
);

export function bn(x: string|BN|number|Array<string|BN|number>) {
    if (Array.isArray(x)) {
        return x.map(n => bn(n))
    }
    return new BN(x);
}
