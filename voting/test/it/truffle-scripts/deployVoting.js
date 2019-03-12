module.exports = async function(done) {
  try {

    const voting = artifacts.require('OrbsVoting');
    let instance = await voting.new(3);

    console.log(JSON.stringify({
      Address: instance.address
    }, null, 2));

    done();

  } catch (e) {
    console.log(e);
    done(e);
  }
};
