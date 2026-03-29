#!/bin/bash
export PATH="$HOME/.local/bin:$PATH"

if ! command -v jq &> /dev/null
then
    echo "CRITICAL: jq is somehow still missing!"
    exit 1
fi

echo "Path looks good. jq is working."

cd ~/fabric-trustpool/fabric-samples/test



-network
./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-javascript/ -ccl javascript
