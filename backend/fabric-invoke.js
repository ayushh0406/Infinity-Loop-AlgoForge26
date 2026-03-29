const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

function invokeFabric(fabricId, name, balance) {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, 'temp-invoke.sh');
        const bashScript = `#!/bin/bash
cd ~/fabric-trustpool/fabric-samples/test-network
export PATH=\${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=\${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=\${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \\
  --tls --cafile \${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \\
  -C mychannel -n basic \\
  --peerAddresses localhost:7051 --tlsRootCertFiles \${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \\
  --peerAddresses localhost:9051 --tlsRootCertFiles \${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt \\
  -c '{"function":"CreateAsset","Args":["${fabricId}","blue","5","${name}","${balance}"]}'
`;
        fs.writeFileSync(scriptPath, bashScript);
        
        // Execute via WSL, mapping Windows path to WSL path 
        const wslPath = "/mnt/c/Users/Balram\\ Panigrahi/Downloads/loan\\ app/backend/temp-invoke.sh";
        
        console.log(`[Fabric Gateway] Invoking true chaincode transaction for ${fabricId}...`);
        exec(`wsl -d Ubuntu-22.04 -- bash -c "chmod +x ${wslPath} && bash ${wslPath}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`[Fabric Error] ${error.message}`);
                return reject(error);
            }
            console.log(`[Fabric Endorsement] ${stderr}`);
            console.log(`[Fabric Success] ${stdout}`);
            resolve(stdout);
        });
    });
}
module.exports = { invokeFabric };
