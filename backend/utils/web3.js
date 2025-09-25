const { Web3 } = require('web3');
const contractABI = require('../contracts/VotingSystem.json'); // Will be generated

class Web3Utils {
  constructor() {
    this.web3 = new Web3(process.env.GANACHE_URL);
    this.contract = null;
    this.adminAccount = null;
    this.init();
  }

  async init() {
    try {
      // Set up admin account
      if (process.env.ADMIN_PRIVATE_KEY) {
        this.adminAccount = this.web3.eth.accounts.privateKeyToAccount(
          process.env.ADMIN_PRIVATE_KEY
        );
        this.web3.eth.accounts.wallet.add(this.adminAccount);
      }

      // Initialize contract
      if (process.env.CONTRACT_ADDRESS) {
        this.contract = new this.web3.eth.Contract(
          contractABI.abi,
          process.env.CONTRACT_ADDRESS
        );
      }
    } catch (error) {
      console.error('Web3 initialization error:', error);
    }
  }

  async createPoll(title, description, options, duration) {
    try {
      const result = await this.contract.methods
        .createPoll(title, description, options, duration)
        .send({
          from: this.adminAccount.address,
          gas: 500000
        });
      
      return result;
    } catch (error) {
      throw new Error('Failed to create poll: ' + error.message);
    }
  }

  async registerVoter(voterAddress) {
    try {
      const result = await this.contract.methods
        .registerVoter(voterAddress)
        .send({
          from: this.adminAccount.address,
          gas: 200000
        });
      
      return result;
    } catch (error) {
      throw new Error('Failed to register voter: ' + error.message);
    }
  }

  async castVote(pollId, encryptedVote, voteHash, voterPrivateKey) {
    try {
      // Get voter's address from private key for validation
      const voterAccount = this.web3.eth.accounts.privateKeyToAccount(voterPrivateKey);
      const voterAddress = voterAccount.address;

      // Use castVoteFor to vote on behalf of the registered voter
      const result = await this.contract.methods
        .castVoteFor(voterAddress, pollId, encryptedVote, voteHash)
        .send({
          from: this.adminAccount.address,
          gas: 500000
        });

      return result;
    } catch (error) {
      throw new Error('Failed to cast vote: ' + error.message);
    }
  }  async fundAccount(address) {
    try {
      // Send 1 ETH to the account for gas fees
      await this.web3.eth.sendTransaction({
        from: this.adminAccount.address,
        to: address,
        value: this.web3.utils.toWei('1', 'ether'),
        gas: 21000
      });
    } catch (error) {
      console.error('Failed to fund account:', error);
      // Continue anyway - the account might already be funded
    }
  }

  async getPollDetails(pollId) {
    try {
      const result = await this.contract.methods.getPollDetails(pollId).call();
      return result;
    } catch (error) {
      throw new Error('Failed to get poll details: ' + error.message);
    }
  }

  async hasUserVoted(pollId, voterAddress) {
    try {
      const result = await this.contract.methods.hasUserVoted(pollId, voterAddress).call();
      return result;
    } catch (error) {
      throw new Error('Failed to check vote status: ' + error.message);
    }
  }

  async getVotesByPoll(pollId) {
    try {
      const result = await this.contract.methods.getVotesByPoll(pollId).call({
        from: this.adminAccount.address
      });
      return result;
    } catch (error) {
      throw new Error('Failed to get votes: ' + error.message);
    }
  }
}

module.exports = new Web3Utils();