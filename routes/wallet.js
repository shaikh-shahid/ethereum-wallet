const express = require("express");
const router = express.Router();
const joi = require("@hapi/joi");
const nconf = require('nconf');
const walletModel = require('../models/wallet');

/**
 * Returns wallet of the user
 */
router.get('/', async (req,res) => {
    try {
        let walletData = await walletModel.returnWallets(req.decoded);
        let walletResponse = {
            name: walletData.data.name,
            address: walletData.data.address,
            balance: walletData.data.balance,
        }        
        return res.json({error: false, message: "", data: walletResponse});
    }
    catch(e) {
        return res.json({error: true, message: "Error occurred fetching wallets", data: []});
    }
});

/**
 * Creates wallet
 */

router.post('/', async (req,res) => {
    try {
        console.log(req.decoded);
        let userData = {
            id: req.decoded.id,
            password: req.body.password,
            walletName: req.body.walletName,
        };
        let walletData = await walletModel.createWallet(userData);
        return res.json({error: false, message: "", data: walletData.data});        
    }
    catch(e) {        
        return res.json({error: true, message: "Error occurred creating wallets", data: []});        
    }
});

/**
 * exports wallet
 */

router.post('/export', async(req,res) => {
    try {
        console.log(req.decoded);
        let userData = {
            id: req.decoded.id,
            password: req.body.password,
        };
        let walletData = await walletModel.exportWallet(userData);
        return res.json({error: false, message: "", data: walletData.data});        
    }
    catch(e) {        
        return res.json({error: true, message: "Error occurred creating wallets", data: []});        
    }
});

/**
 * refresh wallet
 */

 router.get('/refresh', async(req,res) => {
    try {
        let walletData = await walletModel.returnWallets(req.decoded);
        let refreshWallet = await walletModel.refreshWallet(walletData.data.address);
        if(refreshWallet !== walletData.data.balance) {
            // update the mongoDb database
            await walletModel.updateWallet(req.decoded.id, refreshWallet);
        }
        return res.json({error: false, message: "", data: refreshWallet});        
    }
    catch(e) {        
        return res.json({error: true, message: "Error occurred creating wallets", data: []});        
    }
});

module.exports = router;