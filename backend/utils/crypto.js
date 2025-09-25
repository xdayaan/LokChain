const crypto = require('crypto');
const CryptoJS = require('crypto-js');

class CryptoUtils {
  // Generate AES-256 encryption key
  static generateEncryptionKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  // AES-256 Encryption
  static encrypt(text, key) {
    try {
      const encrypted = CryptoJS.AES.encrypt(text, key).toString();
      return encrypted;
    } catch (error) {
      throw new Error('Encryption failed: ' + error.message);
    }
  }

  // AES-256 Decryption
  static decrypt(encryptedText, key) {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedText, key);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      throw new Error('Decryption failed: ' + error.message);
    }
  }

  // SHA-256 Hashing
  static createHash(data) {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  // Generate unique voter ID
  static generateVoterId() {
    return 'VOTER_' + crypto.randomBytes(8).toString('hex').toUpperCase();
  }

  // Hash password with bcrypt
  static async hashPassword(password) {
    const bcrypt = require('bcryptjs');
    return await bcrypt.hash(password, 12);
  }

  // Verify password with bcrypt
  static async verifyPassword(password, hash) {
    const bcrypt = require('bcryptjs');
    return await bcrypt.compare(password, hash);
  }
}

module.exports = CryptoUtils;