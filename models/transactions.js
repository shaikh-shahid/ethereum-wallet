const Web3 = require("web3");
const EthereumTx = require('ethereumjs-tx').Transaction;
const axios = require('axios');
const nconf = require('nconf');
const ethNetwork = nconf.get('ethereumNode');
const web3 = new Web3(new Web3.providers.HttpProvider(ethNetwork));
const { mongoConnection } = require("./connection");

function getTransaction(userData) {
    console.log(userData);
    return new Promise((resolve, reject) => {
        try {
            mongoConnection
             .collection("transactions")
             .find({userId: userData.id})
             .toArray((err, results) => {
                if(err) {
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

function createTransaction(txData) {
    return new Promise(async (resolve, reject) => {
        try {
            let nonce = await web3.eth.getTransactionCount(txData.address);
            let senderBalance = await getBalance(txData.address);
            if(senderBalance < txData.amount) {
                console.log('insufficient funds');
                return reject();
            }
            let gasPrices = await getCurrentGasPrices();
            let details = {
                "to": txData.recieverAddress,
                "value": web3.utils.toHex(web3.utils.toWei(txData.amount.toString(), 'ether')),
                "gas": 21000,
                "gasPrice": gasPrices.low * 1000000000,
                "nonce": nonce,
                "chainId": 3
            };
            const transaction = new EthereumTx(details, {chain: 'ropsten'});
            let privateKey = txData.privateKey.split('0x');
            let privKey = Buffer.from(privateKey[1],'hex');
            transaction.sign(privKey);
            const serializedTransaction = transaction.serialize();
            web3.eth.sendSignedTransaction('0x' + serializedTransaction.toString('hex'), (err, id) => {
                if(err) {
                    console.log(err);
                    return reject();
                }
                const url = `https://ropsten.etherscan.io/tx/${id}`;
                console.log(url);
                let txDbData = {
                    userId: txData.id,
                    address: txData.address,
                    toAddress: txData.recieverAddress,
                    amount: txData.amount,
                    txId: id,
                    trackUrl: url
                };
                mongoConnection
                    .collection("transactions")
                    .insertOne(txDbData, async(error, results) => {
                        if(error) {
                            console.log(error);
                            throw new Error(error);
                        }
                        mongoConnection
                         .collection("wallets")
                         .updateOne({"userId": txData.id}, {"$inc": {"balance": -txData.amount}}, (updateError) => {
                             if(updateError) {
                                console.log(updateError);
                                throw new Error(updateError);
                             }
                            // return data
                            resolve({
                                error: false,
                                data: txDbData
                            });
                         });          
                    });                
            });
        }
        catch(e) {
            reject(e);
        }
    });
}

async function getCurrentGasPrices() {
    let response = await axios.get('https://ethgasstation.info/json/ethgasAPI.json');
    let prices = {
      low: response.data.safeLow / 10,
      medium: response.data.average / 10,
      high: response.data.fast / 10
    };
    return prices;
}

async function getBalance(address) {
    return new Promise((resolve, reject) => {
        web3.eth.getBalance(address, async (err, result) => {
            if(err) {
                return reject(err);
            }
            resolve(web3.utils.fromWei(result, "ether"));
        });
    });
}

module.exports = {
    getTransaction: getTransaction,
    createTransaction: createTransaction,
};