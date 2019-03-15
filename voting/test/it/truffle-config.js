const helpers = require("./truffle-scripts/helpers");

const HDWalletProvider = require('truffle-hdwallet-provider');

const mnemonic_ropsten = process.env.ROPSTEN_SECRET;
const mnemonic_mainnet = process.env.MAINNET_SECRET;

module.exports = {
  networks: {
    mainnet: {
      // provider: () => new HDWalletProvider(mnemonic_mainnet, process.env.MAINNET_URL, 0, 25),
      // network_id: '1',
      // gasPrice: helpers.GAS_PRICE
    },
    ropsten: {
      provider: () => new HDWalletProvider(mnemonic_ropsten, process.env.ROPSTEN_URL, 0, 25),
      network_id: '3',
      gasPrice: helpers.GAS_PRICE
    },
    ganache: {
      host: 'localhost',
      port: 7545,
      network_id: '5777',
      accounts: 25,
      gasPrice: 20 * 1000000000 // 20 gwei
    },
  },
  compilers: {
    solc: {
      version: '0.5.3',
    },
  },
};
