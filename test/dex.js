const Dai = artifacts.require('./Dai.sol');
const Bat = artifacts.require('./Bat.sol');
const Rep = artifacts.require('./Rep.sol');
const Zrx = artifacts.require('./Zrx.sol');
const Dex = artifacts.require('./Dex.sol')
contract('Dex',() => {
    let dai,bat,rep,zrx;

    beforeEach(async () => {
        dai = await Dai.new();
        bat = await Bat.new();
        rep = await Rep.new();
        zrx = await Zrx.new();
        
    });
});