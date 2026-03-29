#!/bin/bash
echo "Installing jq locally to bypass sudo..."
mkdir -p ~/.local/bin
curl -sSL -o ~/.local/bin/jq https://github.com/jqlang/jq/releases/download/jq-1.7.1/jq-linux-amd64
chmod +x ~/.local/bin/jq
export PATH="$HOME/.local/bin:$PATH"

if ! command -v jq &> /dev/null
then
    echo "jq failed to install"
    exit 1
fi
echo "jq installed successfully!"

cd ~/fabric-trustpool/fabric-samples/test-network
echo "Cleaning up..."
./network.sh down

echo "Bringing up network..."
./network.sh up createChannel -c mychannel -ca

echo "Deploying Chaincode..."
./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-javascript/ -ccl javascript
