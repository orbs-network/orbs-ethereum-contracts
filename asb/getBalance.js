
const doSomthing = async () => {
  const Tet = artifacts.require('Tet.sol');
  let tet = await Tet.deployed();
  if (process.argv.length != 5) {
    console.error("Wrong number of arguments expect (truffle exec getBalance.js userAddr\n");
    exit(-1);
  }
  let userAddr = process.argv[4];

  let balance = await tet.balanceOf(userAddr, {from: userAddr})
  console.log(`${balance}\n`)
}

module.exports = function(callback) {
  doSomthing();
}
