#!/bin/bash
export PATH="$HOME/.local/bin:$PATH"
cd ~/fabric-trustpool/fabric-samples/test-network
export PATH="${PWD}/../bin:$PATH"
export FABRIC_CFG_PATH=$PWD/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

echo "=== Invoking Chaincode: CreateAsset TX_DEPOSIT_TEST ==="
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
  -C mychannel -n basic \
  --peerAddresses localhost:7051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
  --peerAddresses localhost:9051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt \
  -c '{"function":"CreateAsset","Args":["TX_DEPOSIT_TEST","DEPOSIT:USER_DA9534DF","5","ramesh@trustpool.ai","500"]}'

echo ""
echo "=== Querying Asset TX_DEPOSIT_TEST from Ledger ==="
peer chaincode query -C mychannel -n basic \
  -c '{"Args":["ReadAsset","TX_DEPOSIT_TEST"]}'
