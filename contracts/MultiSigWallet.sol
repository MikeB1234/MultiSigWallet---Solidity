pragma solidity 0.8;
pragma abicoder v2;

contract MultiSigWallet {
    
    address contractOwner;
    address[] public owners;
    uint limit;
    
    mapping(address => mapping(uint => bool)) voted;
    mapping(address => uint) public balance;
   
    struct Transaction {
        uint amount;
        address payable recipient;
        uint numVotes;
        bool hasBeenSent;
        uint id;
    }
    
    Transaction[] transactionArray;
    
    constructor() payable {
        contractOwner = msg.sender;
        limit = 2;
        owners.push(msg.sender);
    }
    
    modifier onlyOwner() {
         for(uint i=0; i < owners.length; i++) {
            if (owners[i] == msg.sender) {
                _;
                return;
            }
        }
        revert();
    }
    
    function deposit() public payable onlyOwner {}
    
    function addOwner(address _owner) public {
        require(msg.sender == contractOwner, "You are not contract owner");
        owners.push(_owner);
    }
    
    function createTransaction(uint _amount, address payable _recipient) public onlyOwner {
        require(address(this).balance >= _amount, "Not enough funds");
        transactionArray.push(Transaction(_amount, _recipient, 0, false, transactionArray.length));
    }
    
    function approveTransaction(uint _id) public payable onlyOwner {
        require(transactionArray[_id].hasBeenSent == false, "Transaction already sent");
        require(voted[msg.sender][_id] == false, "Already voted");
        require(address(this).balance >= transactionArray[_id].amount, "Not enough funds");
        transactionArray[_id].numVotes++;
        voted[msg.sender][_id] = true;
        
        if(transactionArray[_id].numVotes == limit) {
            transactionArray[_id].hasBeenSent = true;
            uint prevBalance = transactionArray[_id].recipient.balance;
            transactionArray[_id].recipient.transfer(transactionArray[_id].amount);
            uint newBalance = transactionArray[_id].recipient.balance;
            uint receivedBalance = newBalance - prevBalance;
            balance[transactionArray[_id].recipient] += receivedBalance;
        }
    }
    
    function ownersList() public view returns(address[] memory) {
       return owners;
    }
   
    function transactionList() public view returns(Transaction[] memory) {
        return transactionArray;
    }
    
    function getContractBalance() public view returns(uint) {
        return address(this).balance;
    }

    function getUserReceivedBalance(address _user) public view returns(uint) {
        return balance[_user];
    }
    
}