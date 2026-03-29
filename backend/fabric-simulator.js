const express = require('express');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 5001;

// Hyperledger Fabric Simulation Data Structures
const WorldState = new Map();
const Blockchain = [];

// Initialize Genesis Block
Blockchain.push({
    index: 0,
    timestamp: Date.now(),
    transactions: [],
    previousHash: "0000000000000000000000000000000000000000000000000000000000000000",
    hash: crypto.createHash('sha256').update("Genesis").digest('hex')
});

console.log("\n==================================================");
console.log("\u26D3  [Hyperledger Fabric Sandbox] Network Initialized");
console.log("==================================================\n");
console.log(`[Blockchain] Genesis Block Created: ${Blockchain[0].hash.substring(0,10)}...`);

function createBlock(transaction) {
    const previousBlock = Blockchain[Blockchain.length - 1];
    const newBlock = {
        index: Blockchain.length,
        timestamp: Date.now(),
        transactions: [transaction],
        previousHash: previousBlock.hash,
    };
    newBlock.hash = crypto.createHash('sha256').update(JSON.stringify(newBlock)).digest('hex');
    Blockchain.push(newBlock);
    
    console.log(`\n\u2699\uFE0F  [Fabric Consenter] Orderer endorsing transaction...`);
    console.log(`\u26A1 [Chaincode] Endorsement successful. Committing to ledger.`);
    console.log(`\uD83D\uDCE6 [Ledger] Block #${newBlock.index} added. Hash: ${newBlock.hash.substring(0, 16)}...`);
    return newBlock;
}

// Simulated Chaincode Rest Interface
app.post('/chaincode/invoke', (req, res) => {
    const { fcn, args } = req.body;
    
    try {
        if (fcn === 'registerUser') {
            const { fabricId, name } = args;
            if (WorldState.has(fabricId)) {
                return res.status(400).json({ error: "Identity already exists in World State" });
            }
            const record = { fabricId, name, balance: 0, reputationScore: 0 };
            WorldState.set(fabricId, record);
            
            const tx = { type: 'REGISTER_USER', payload: record };
            createBlock(tx);
            
            return res.json({ status: 'SUCCESS', message: 'Identity successfully registered on-chain' });
        }
        
        else if (fcn === 'depositPool') {
            const { fabricId, amount } = args;
            if (!WorldState.has(fabricId)) {
                return res.status(400).json({ error: "Identity not found" });
            }
            
            const record = WorldState.get(fabricId);
            record.balance += Number(amount);
            WorldState.set(fabricId, record);
            
            const tx = { type: 'DEPOSIT', payload: { fabricId, amount } };
            createBlock(tx);
            
            return res.json({ status: 'SUCCESS', message: 'Funds deposited to TrustPool smart contract' });
        }
        
        else {
            return res.status(400).json({ error: `Function ${fcn} not found in chaincode` });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Chaincode execution error" });
    }
});

// Query World State
app.get('/chaincode/query/:fabricId', (req, res) => {
    const { fabricId } = req.params;
    if (WorldState.has(fabricId)) {
        res.json({ status: 'SUCCESS', data: WorldState.get(fabricId) });
    } else {
        res.status(404).json({ error: "Identity not found in World State" });
    }
});

// View Blockchain
app.get('/ledger', (req, res) => {
    res.json({ blocks: Blockchain.length, ledger: Blockchain });
});

app.listen(PORT, () => {
    console.log(`\uD83D\uDFE2 [Fabric API] REST listener active on port ${PORT}`);
    console.log(`Waiting for invocations...\n`);
});
