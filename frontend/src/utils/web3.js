import Web3 from 'web3';

class Web3Service {
  constructor() {
    this.web3 = null;
    this.account = null;
    this.init();
  }

  async init() {
    try {
      // For development, connect directly to Ganache
      if (process.env.NODE_ENV === 'development') {
        this.web3 = new Web3('http://127.0.0.1:7545');
        // Use the first default Ganache account
        this.account = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1';
        console.log('Connected to Ganache for development');
      }
      // For production or if MetaMask is available
      else if (typeof window !== 'undefined' && window.ethereum) {
        this.web3 = new Web3(window.ethereum);
        console.log('Connected to MetaMask');
      } else {
        console.warn('No Web3 provider found. Using HTTP provider as fallback.');
        this.web3 = new Web3('http://127.0.0.1:7545');
      }
    } catch (error) {
      console.error('Web3 initialization error:', error);
    }
  }

  async connectWallet() {
    try {
      // In development, we're already connected to Ganache
      if (process.env.NODE_ENV === 'development') {
        return this.account;
      }

      // For production, try to connect to MetaMask
      if (typeof window !== 'undefined' && window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });

        this.account = accounts[0];
        return this.account;
      } else {
        throw new Error('MetaMask not found. Please install MetaMask or use development mode.');
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      throw error;
    }
  }

  async getAccount() {
    // In development, return the default Ganache account
    if (process.env.NODE_ENV === 'development') {
      return this.account;
    }

    // For production, try to get account from MetaMask
    if (!this.account && typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts'
        });
        this.account = accounts[0] || null;
      } catch (error) {
        console.error('Error getting account:', error);
      }
    }
    return this.account;
  }

  async signMessage(message) {
    try {
      const account = await this.getAccount();
      if (!account) {
        throw new Error('No account connected');
      }

      // In development with HTTP provider, we can't sign messages the same way
      // For now, return a mock signature for development
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Mock signature for message:', message);
        return `0x${Date.now().toString(16)}`; // Mock signature
      }

      // For production with MetaMask
      if (typeof window !== 'undefined' && window.ethereum) {
        const signature = await this.web3.eth.personal.sign(message, account);
        return signature;
      }

      throw new Error('Unable to sign message');
    } catch (error) {
      console.error('Message signing error:', error);
      throw error;
    }
  }

  isConnected() {
    return !!this.account;
  }
}

export default new Web3Service();