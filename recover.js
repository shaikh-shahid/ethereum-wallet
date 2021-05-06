const bip39 = require('bip39');
const ethers = require('ethers');

let mnemonic = "cup ribbon myth gap affair merry immune pilot type mass any embody toward fence twelve gaze anchor patient humor perfect ankle creek review correct";

const path = "m/44'/60'/0'/0/0";
const mnemonicWallet = ethers.Wallet.fromMnemonic(mnemonic, path); 

console.log(mnemonicWallet.address)
console.log(mnemonicWallet.privateKey)
console.log(mnemonicWallet.publicKey)