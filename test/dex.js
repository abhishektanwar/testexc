const { expectRevert } = require('@openzeppelin/test-helpers');
const Dai = artifacts.require('./Dai.sol');
const Bat = artifacts.require('./Bat.sol');
const Rep = artifacts.require('./Rep.sol');
const Zrx = artifacts.require('./Zrx.sol');
const Dex = artifacts.require('./Dex.sol');
const SIDE = {
    BUY:0,
    SELL:1
};
contract('Dex',(accounts) => {
    let dai,bat,rep,zrx,dex;

    //generating bytes32 ticker
    const [DAI,BAT,REP,ZRX] = ['DAI','BAT','REP','ZRX']
        .map(ticker => web3.utils.fromAscii(ticker));
    const [trader1,trader2] = [accounts[1],accounts[2]];

    beforeEach(async () => {
        ([dai,bat,rep,zrx] = await Promise.all([
            Dai.new(),
            Bat.new(),
            Rep.new(),
            Zrx.new()
        ]));
        //deploy Dex smart contract
        dex = await Dex.new();

        //adding tokens
        await Promise.all([
            dex.addToken(DAI,dai.address),
            dex.addToken(BAT,bat.address),
            dex.addToken(REP,rep.address),
            dex.addToken(ZRX,zrx.address),
        ]);

        const amount = web3.utils.toWei('1000');

        //token is instance of DAI/BAT/REP/ZRX
        // token.faucet mints amount number of tokens in trader's wallet
        //trader sends a txn to each token wallet to approve dex to withdraw amount number of tokens
        const seedTokenBalance = async(token,trader)=> {
            await token.faucet(trader,amount);
            await token.approve(
                dex.address,
                amount,
                {from:trader}
            );
        };

        await Promise.all(
            [dai,bat,rep,zrx].map(token => seedTokenBalance(token,trader1))
        );

        await Promise.all(
            [dai,bat,rep,zrx].map(token => seedTokenBalance(token,trader2))
        );
        
    });

    //test1 : deposit function
    it('should deposit tokens', async () => {
        const amount = web3.utils.toWei('100');

        await dex.deposit(
            amount,
            DAI,
            {from:trader1}
        );

        const balance = await dex.traderBalances(trader1, DAI);
        assert(balance.toString() === amount );
    });
    //test 2:deposit function , passing an undefined token(fail case)
    it('should not deposit tokens', async () => {
        await expectRevert(
            dex.deposit(
                web3.utils.toWei('100'),
                web3.utils.fromAscii('token does not exist'),
                {from:trader1}
            ),
            'this token does not exist'
        );
        
    });

    //test3 : withdraw function
    it('should withdraw tokens',async () => {
        const amount = web3.utils.toWei('100');

        await dex.deposit(
            amount,
            DAI,
            {from:trader1}
        );

        await dex.withdraw(
            amount,
            DAI,
            {from:trader1}
        );

        const [balanceDex, balanceDai] = await Promise.all([
            dex.traderBalances(trader1,DAI),
            dai.balanceOf(trader1)
        ]);

        assert(balanceDex.isZero());
        assert(balanceDai.toString() === web3.utils.toWei('1000'));
    });

    //test4 : withdraw function,fail case []
    it('should not withdraw tokens if token does not exist',async () => {
        await expectRevert(
            dex.withdraw(
                web3.utils.toWei('100'),
                web3.utils.fromAscii('token does not exist'),
                {from:trader1}
            ),
            'this token does not exist'
        );
    });
    //test 5 : withdraw function ,withdrawing invalid token
    it('should not withdraw tokens if token does not exist',async () => {
        const amount = web3.utils.toWei('100');

        await dex.deposit(
            amount,
            DAI,
            {from:trader1}
        );
        
        await expectRevert(
            dex.withdraw(
                web3.utils.toWei('1000'),
                DAI,
                {from:trader1}
            ),
            'insufficient tokens'
        );
    });

    //test 6 : create limit order
    it('should create limit order',async () => {
        const amount = web3.utils.toWei('100');

        await dex.deposit(
            amount,
            DAI,
            {from:trader1}
        );

        await dex.createLimitOrder(
            REP,
            web3.utils.toWei('10'), //selling 10 tokens
            10,
            SIDE.BUY,
            {from:trader1}
        );
        let buyOrders = await dex.getOrders(REP,SIDE.BUY);
        let sellOrders = await dex.getOrders(REP,SIDE.SELL);
        assert(buyOrders.length === 1);
        assert(buyOrders[0].trader === trader1);
        assert(buyOrders[0].ticker === web3.utils.padRight(REP,64));
        assert(buyOrders[0].price === '10');
        assert(buyOrders[0].amount === web3.utils.toWei('10'));    
        assert(sellOrders.length === 0);
    
        await dex.deposit(
            web3.utils.toWei('200'),
            DAI,
            {from:trader2}
        );

        await dex.createLimitOrder(
            REP,
            web3.utils.toWei('10'), //selling 10 tokens
            11,
            SIDE.BUY,
            {from:trader2}
        );
        buyOrders = await dex.getOrders(REP,SIDE.BUY);
        sellOrders = await dex.getOrders(REP,SIDE.SELL);
        assert(buyOrders.length === 2);
        assert(buyOrders[0].trader === trader2);
        assert(buyOrders[1].trader === trader1);   
        assert(sellOrders.length === 0);

        await dex.createLimitOrder(
            REP,
            web3.utils.toWei('10'), //selling 10 tokens
            9,
            SIDE.BUY,
            {from:trader2}
        );
        buyOrders = await dex.getOrders(REP,SIDE.BUY);
        sellOrders = await dex.getOrders(REP,SIDE.SELL);
        assert(buyOrders.length === 3);
        assert(buyOrders[0].trader === trader2);
        assert(buyOrders[1].trader === trader1);   
        assert(buyOrders[2].trader === trader2); 
        assert(buyOrders[2].price === '9'); 
        assert(sellOrders.length === 0);
    });

    

    //test 7 : crete Limit Order, failcase
    it('should not create limit order if token does not exist',async () => {
        await expectRevert(
            dex.createLimitOrder(
                web3.utils.fromAscii('undefined token'),
                web3.utils.toWei('1000'), //selling 10 tokens
                10,
                SIDE.BUY,
                {from:trader1}
            ),
            'this token does not exist'
        ); 
    });

    it('should not create limit order if token is DAI',async () => {
        await expectRevert(
            dex.createLimitOrder(
                DAI,
                web3.utils.toWei('1000'), //selling 10 tokens
                10,
                SIDE.BUY,
                {from:trader1}
            ),
            'cannot trade DAI'
        ); 
    });

    it('should not create limit order if token balance is too low',async () => {
        const amount = web3.utils.toWei('99');

        await dex.deposit(
            web3.utils.toWei('99'),
            REP,
            {from:trader1}
        );

        await expectRevert(
            dex.createLimitOrder(
                REP,
                web3.utils.toWei('100'), //selling 10 tokens
                10,
                SIDE.SELL,
                {from:trader1}
            ),
            'token balance too low'
        ); 
    });

    it('should not create limit order if DAI balance is too low',async () => {
        const amount = web3.utils.toWei('99');

        await dex.deposit(
            web3.utils.toWei('99'),
            DAI,
            {from:trader1}
        );

        await expectRevert(
            dex.createLimitOrder(
                REP,
                web3.utils.toWei('10'), //selling 10 tokens
                10,
                SIDE.BUY,
                {from:trader1}
            ),
            'dai balance too low'
        );
        
        
    });
});