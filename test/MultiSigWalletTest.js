const MultiSigWallet = artifacts.require("MultiSigWallet");
const truffleAssert = require("truffle-assertions");

contract("MultiSigWallet", accounts => {

    it("Only contract owner can add accounts to owners list", async () => {
        let wallet = await MultiSigWallet.deployed()
        await truffleAssert.passes(
            wallet.addOwner(accounts[1], {from: accounts[0]})
        )
        await truffleAssert.reverts(
            wallet.addOwner(accounts[2], {from: accounts[2]})
        )
    })
    it("Get balance function works correctly", async () => {
        let wallet = await MultiSigWallet.deployed()
        await wallet.deposit({value: 1000})
        await truffleAssert.passes(
            assert(await wallet.getContractBalance() == 1000, "Incorrect Balance")
        )
    })
    it("Create Transaction function only works when contract is funded", async () => {
        let wallet = await MultiSigWallet.deployed()
        await truffleAssert.reverts(
            wallet.createTransaction(100, accounts[0], {from: accounts[3]})
        )
        await truffleAssert.reverts(
            wallet.createTransaction(2000, accounts[0])
        )
        await wallet.deposit({value: 1000})
        await truffleAssert.passes(
            wallet.createTransaction(2000, accounts[0])
        )
        let transactionList = await wallet.transactionList()
    })
    it("Only owner can approve transaction", async () => {
        let wallet = await MultiSigWallet.deployed()
        await truffleAssert.reverts(
            wallet.approveTransaction(0, {from: accounts[2]})
        )
        await truffleAssert.passes(
            wallet.approveTransaction(0, {from: accounts[0]})
        )
    })
    it("Cannot vote twice", async () => {
        let wallet = await MultiSigWallet.deployed()
        await truffleAssert.reverts(
        wallet.approveTransaction(0, {from: accounts[0]})
        )
    })
    it("Upon approval sig limit met, transaction sent and balances updated correctly", async () => {
        let wallet = await MultiSigWallet.deployed()
        await truffleAssert.passes(
            wallet.approveTransaction(0, {from: accounts[1]})
        )
        await truffleAssert.passes(
            assert(await wallet.getContractBalance() == 0, "Contract did not send transaction")
        )
        await truffleAssert.passes(
            assert(await wallet.getUserReceivedBalance(accounts[0]) == 2000, "User did not receive payment")
        )
    })
    it("Cannot vote for transaction already sent", async () => {
        let wallet = await MultiSigWallet.deployed()
        await wallet.addOwner(accounts[2], {from: accounts[0]})
        await truffleAssert.reverts(
            wallet.approveTransaction(0, {from: accounts[2]})
        )
    })
    it("Cannot approve a pending created transaction if contract balance was deducted by other transaction", async () => {
        let wallet = await MultiSigWallet.deployed()
        await wallet.deposit({value: 100})
        await wallet.createTransaction(100, accounts[1])
        await wallet.createTransaction(100, accounts[2])
        await wallet.approveTransaction(1, {from: accounts[0]})
        await wallet.approveTransaction(2, {from: accounts[0]})
        await truffleAssert.passes(
            wallet.approveTransaction(1, {from: accounts[1]})
        )
        await truffleAssert.reverts(
            wallet.approveTransaction(2, {from: accounts[1]})
        )
    })
    /*console.log(await wallet.ownersList())
    console.log(await wallet.transactionList())
    console.log(await wallet.getContractBalance())
    console.log(await wallet.getUserReceivedBalance(accounts[0])) */
})