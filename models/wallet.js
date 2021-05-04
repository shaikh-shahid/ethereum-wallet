const Web3 = require("web3");
const ethers = require('ethers');
const crypto = require('crypto-js');
const nconf = require('nconf');
const bip39 = require('bip39');
const ethNetwork = nconf.get('ethereumNode');
const web3 = new Web3(new Web3.providers.HttpProvider(ethNetwork));
const { mongoConnection } = require("./connection");

function createWallet(userData) {
    return new Promise(async (resolve, reject) => {
        try {
            // check if wallet exists
            let walletData = await checkIfWalletExists({userId: userData.id});
            if(walletData.data.length !== 0) {
                return resolve({
                    error: true, 
                    message: "Wallet already exists", 
                    data: []
                });
            }
            // create wallet
            // step 1: generate menomic
            const mnemonic = bip39.generateMnemonic(256);
            const path = "m/44'/60'/0'/0/0";
            const mnemonicWallet = ethers.Wallet.fromMnemonic(mnemonic, path);            
            // encrypt private key
            var privateKey = encrypt(mnemonicWallet.privateKey, userData.password);
            const newWalletData = {
                userId: userData.id,
                name: userData.walletName,
                address: mnemonicWallet.address,
                privateKey: privateKey,
                publicKey: mnemonicWallet.publicKey,
                path: path,
                balance: 0,
            };
            mongoConnection
             .collection("wallets")
             .insertOne(newWalletData, async (err, results) => {
                 if(err) {
                     console.log(err);
                     throw new Error(err);
                 }
                 // return data
                 resolve({
                     error: false,
                     data: mnemonic
                 });
             });
        }
        catch(e) {
            reject(e);
        }
    });
}

function returnWallets(userData) {
    return new Promise(async (resolve, reject) => {
        try {            
            let walletData = await checkIfWalletExists(userData);
            if(walletData.data.length === 0) {
                // no wallet yet
                return resolve({error: false, message: "", data: []});
            }
            resolve({error: false, message: "", data: walletData.data[0]});
        }
        catch(e) {
            reject(e);
        }
    });
}

function checkIfWalletExists(userData) {
    return new Promise(async (resolve, reject) => {
        try {
            mongoConnection
             .collection("wallets")
             .find({userId: userData.id})
             .toArray((err, results) => {
                 if(err) {
                     console.log(err);
                     throw new Error(err);
                 }
                 resolve({error: false, data: results});
             });
        }
        catch(e) {
            reject(e);
        }
    });
}

function encrypt(text, password) {
    try {
        let encrypted = crypto.AES.encrypt(text, password).toString();
        return encrypted;
    }    
    catch(e) {
        return null;
    }
}

function exportWallet(userData) {
    return new Promise(async (resolve, reject) => {
        try {
            let walletData = await checkIfWalletExists(userData);
            if(walletData.data.length === 0) {
                return resolve({"error": true, "message": "Wallet does not exists"});
            }
            // decrypt the private key
            let privateKey = decrypt(walletData.data[0].privateKey, userData.password);
            resolve({
                "error": false,
                "message": "",
                "data": {
                    privateKey: privateKey,
                    publicKey: walletData.data[0].publicKey
                }
            });
        }
        catch(e) {
            reject(e);
        }
    });
}

function decrypt(text, password) {
    try {
        let decrypted = crypto.AES.decrypt(text, password);
        return decrypted.toString(crypto.enc.Utf8);
    }    
    catch(e) {
        return null;
    }
}

function refreshWallet(address) {
    return new Promise((resolve, reject) => {
        try {
            web3.eth.getBalance(address, async (err, result) => {
                if(err) {
                    return reject(err);
                }
                resolve(parseFloat(web3.utils.fromWei(result, "ether")));
            });
        }
        catch(e) {
            return null;
        }
    });
}

function updateWallet(userId, balance) {
    console.log(balance);
    return new Promise((resolve, reject) => {
        try {
            mongoConnection
             .collection("wallets")
             .updateOne({userId: userId}, {"$set": {"balance": balance}},(err) => {
                if(err) {
                    return reject(err);
                }
                resolve();
             });
        }
        catch(e) {
            return null;
        }
    });
}

module.exports = {
    createWallet: createWallet,
    returnWallets: returnWallets,
    exportWallet: exportWallet,
    decrypt: decrypt,
    refreshWallet: refreshWallet,
    updateWallet: updateWallet,
};