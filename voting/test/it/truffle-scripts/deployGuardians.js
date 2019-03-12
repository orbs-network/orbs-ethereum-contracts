module.exports = async function(done) {
  try {

    const guardians = artifacts.require('OrbsGuardians');
    let instance = await guardians.new();

    console.log(JSON.stringify({
      Address: instance.address
    }, null, 2));

    done();

  } catch (e) {
    console.log(e);
    done(e);
  }
};
