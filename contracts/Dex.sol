pragma solidity 0.6.3;

import 'https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/IERC20.sol';

contract Dex {
    //type of order buy or sell
    enum Side{
        BUY,
        SELL
    }
    
    struct Token{
        bytes32 ticker;
        address tokenAddress;
    }
    //details of each order
    struct Order {
        uint id;
        Side side;
        bytes32 ticker;
        uint amount;
        uint filled;
        uint price;
        uint date;
    }
    
    bytes32 constant DAI = bytes32('DAI');
    
    //array or order structure(ticker => uint(buy,0/sell,1) => all orders)
    //all orders(decreasing order) of x token of buy type
    mapping(bytes32 => mapping(uint => Order[])) public orderBook;
    
    mapping(bytes32 => Token) public tokens;
    mapping(address => mapping(bytes32=>uint)) public traderBalances;
    bytes32[] public tokenList;
    
    address public admin;
    
    //tracker for next order ID
    uint public nextOrderId;
    
    constructor() public {
        admin= msg.sender;
    }
    function addToken(
        bytes32 ticker,
        address  tokenAddress
        ) onlyAdmin() external{
            tokens[ticker] = Token(ticker, tokenAddress);
            tokenList.push(ticker);
        }
        
    modifier onlyAdmin(){
        require(msg.sender == admin, "only admin can access");
        _;
    }
    
    function deposit(
        uint amount,
        bytes32 ticker)
        tokenExist(ticker) 
        external {
        IERC20(tokens[ticker].tokenAddress).transferFrom(
                msg.sender,
                address(this),
                amount
        );
        traderBalances[msg.sender][ticker] += amount;    
    }
    
    function withdraw(
        uint amount,
        bytes32 ticker)
        tokenExist(ticker) 
        external {
        require(
            traderBalances[msg.sender][ticker] >= amount,
            'insufficient tokens'
        );
        traderBalances[msg.sender][ticker] -= amount;
        IERC20(tokens[ticker].tokenAddress).transfer(msg.sender, amount);
    }
    
    function createLimitOrder(
        bytes32 ticker, 
        uint amount,
        uint price, 
        Side side) 
        tokenExist(ticker) 
        external {
        //DAI is quote currency, all erc20 tokens are sold/purchased agains DAI coin
        require(ticker != DAI,'cannot trade DAI');
        if(side == Side.SELL){
            require(
                traderBalances[msg.sender][ticker] >= amount,
                'token balance too low'
            );
        }else {
            require(
                traderBalances[msg.sender][DAI] >= amount * price,
                'dai balance too low'
            );
        }
        
        Order[] storage orders = orderBook[ticker][uint(side)];
        orders.push(Order(
            nextOrderId,
            side,
            ticker,
            amount,
            0,
            price,
            now
        ));
        
        //bubble sort to arrange orders on basis or price
        uint i = orders.length - 1 ;
        while(i>0){
            if(side == Side.BUY && orders[i-1].price>orders[i].price){
                break;
            }
            if(side == Side.SELL && orders[i-1].price<orders[i].price){
                break;
            }
            
            Order memory order = orders[i-1];
            orders[i-1] = orders[i];
            orders[i] = order;
            i--;
        }
    }
    
    modifier tokenExist(bytes32 ticker) {
        require(tokens[ticker].tokenAddress != address(0));
        _;
    }
    
}