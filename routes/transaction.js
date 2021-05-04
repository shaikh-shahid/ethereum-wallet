const express = require("express");
const router = express.Router();
const joi = require("@hapi/joi");
const nconf = require('nconf');
const transactionModel = require('../models/transactions');
const walletModel = require('../models/wallet');

/**
 * Returns transaction of the wallet
 */
router.get('/', async (req,res) => {
    try {
        let txData = await transactionModel.getTransaction(req.decoded);
        return res.json({"error": false, "message": "", "data": txData.data});
    }
    catch(e) {
        res.json({"error": true, "message": "Error occurred fetching transactions", "data": []});
    }
});

/**
 * create transaction
 */

router.post('/', async (req,res) => {
    try {
        let userData = req.decoded;
        let bodyData = req.body;
        // get address and private key of the user
        let walletDetails = await walletModel.returnWallets(userData);   
        let decodedPrivateKey = walletModel.decrypt(walletDetails.data.privateKey, bodyData.password);        
        let txData = {
            id: userData.id,
            address: walletDetails.data.address,
            amount: bodyData.amount,
            recieverAddress: bodyData.recieverAddress,
            privateKey: decodedPrivateKey,
        };
        let txResponse = await transactionModel.createTransaction(txData);
        return res.json({"error": false, "message": "", "data": txResponse});
    }
    catch(e) {
        console.log(e)
        res.json({"error": true, "message": "Error occurred during creating transactions", "data": []});
    }
});

module.exports = router;