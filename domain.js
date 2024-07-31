const Web3 = require('web3');
const smartContract = require('./build/contracts/Loteria.json');
const nodeUrl = 'http://127.0.0.1:7545';

const getInstanceContract = async () => {
    
    const web3 = new Web3(new Web3.providers.HttpProvider(nodeUrl));
    const networkId = await web3.eth.net.getId();
    const networkData = smartContract.networks[networkId];
    const abi = smartContract.abi
    const contractAddress = networkData.address
    const contract = new web3.eth.Contract(abi, contractAddress)
    return { web3, contract, contractAddress };
}

const crearCuenta = async (params) => {
    console.log('[crearCuenta] params: ', params);
    const { address, privateKey, name, alias, document } = params;
    const { web3, contract, contractAddress } = await getInstanceContract();
    try {
        const method = contract.methods.createUser(address, name, document, alias);

        const createTransaction = async () => {
            const tx = {
                from: address,
                to: contractAddress,
                gas: 2000000,
                data: method.encodeABI()
            };

            const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
            const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
            console.log('Transaction receipt:', receipt);
            return receipt;
        };

        const result = await createTransaction();
        await showEvents();
        return { result: 'ok', data: { transactionHash: result.transactionHash, blockNumber: result.blockNumber} };
    } catch (error) {
        console.error('Error al llamar al método del contrato:', error);
        throw error;
    }
}

const obtenerCuenta = async (add) => {
    console.log('[obtenerCuenta] cuenta: ', add);
    const { contract } = await getInstanceContract();
    try {
        const result = await contract.methods.getUser(add).call(); 
        return result;
    } catch (error) {
        throw error;
    }
}

const obtenerCuentas = async () => {
    const web3 = new Web3(new Web3.providers.HttpProvider(nodeUrl));
    try {
        return await web3.eth.getAccounts();
    } catch (error) {
        throw error;
    }
}

const obtenerSaldo = async (account) => {
    const { contract } = await getInstanceContract();
    try {
        const result = await contract.methods.balanceTokens(account).call();
        return result;
    } catch (error) {
        console.error('Error al llamar al método del contrato:', error);
        throw error;
    }
};

const obtenerSaldoContrato = async () => {
    const { contract } = await getInstanceContract();
    try {
        const result = await contract.methods.balanceTokensSC().call();
        return result;
    } catch (error) {
        console.error('Error al llamar al método del contrato:', error);
        throw error;
    }
};

const abonarSaldoInicial = async (privateKey, numTokens) => {
    const { web3, contract, contractAddress } = await getInstanceContract();
    try {
        const account = getAddressFromPrivateKey(web3, privateKey);
        const method = contract.methods.cargarSaldoInicial(numTokens);

        const createTransaction = async () => {
            const tx = {
                from: account,
                to: contractAddress,
                gas: 2000000,
                data: method.encodeABI()
            };

            const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
            const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
            console.log('Transaction receipt:', receipt);
            return receipt;
        };

        const result = await createTransaction();
        await showEvents();

        return { result: 'ok', data: { transactionHash: result.transactionHash, blockNumber: result.blockNumber} };
    } catch (error) {
        console.error('Error al llamar al método del contrato:', error);
        throw error;
    }
};

const transferenciaEntreCuentas = async (privateKey, addressTo, numTokens) => {
    const { web3, contract, contractAddress } = await getInstanceContract();
    try {
        const addressFrom = getAddressFromPrivateKey(web3, privateKey);
        const method = contract.methods.transferenciaEntreCuentas(addressTo, numTokens);

        const createTransaction = async () => {
            const tx = {
                from: addressFrom,
                to: contractAddress,
                gas: 2000000,
                data: method.encodeABI()
            };

            const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);

            const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
            console.log('Transaction receipt:', receipt);
            return receipt;
        };

        const result = await createTransaction();
        await showEvents();

        return { result: 'ok', data: { transactionHash: result.transactionHash, blockNumber: result.blockNumber} };
    } catch (error) {
        console.error('Error al llamar al método del contrato:', error);
        throw error;
    }
};

const getAddressFromPrivateKey = (web3, privateKey) => {
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    return account.address;
};

const showEvents = async () => {
    const { contract } = await getInstanceContract();
    const events = await contract.getPastEvents('allEvents', { fromBlock: 0, toBlock: 'latest' });
    console.log('events: ', events);
}

const parseTxData = async (blockNumber) => {
    const result = {}
    try {
        // Obtener el bloque por número
        const { web3, contract } = await getInstanceContract();
        const block = await web3.eth.getBlock(blockNumber, true); // true para obtener las transacciones completas

        if (!block) {
            console.log(`Block ${blockNumber} not found`);
            return;
        }

        console.log(`Block ${blockNumber} data:`, block);

        // Analizar las transacciones del bloque
        block.transactions.forEach(tx => {
            result.txHash = tx.hash;
            result.from = tx.from;
            result.to = tx.to;
            result.value = web3.utils.fromWei(tx.value, 'ether');
            result.gas = tx.gas;
            result.gasPrice = web3.utils.fromWei(tx.gasPrice, 'gwei');
            result.data = tx.input;

            // Decodificar tx.input
            if (tx.input !== '0x') {
                try {
                    const functionSignature = tx.input.slice(0, 10);
                    result.functionSignature = functionSignature;
                    const functionAbi = contract.options.jsonInterface.find(item => item.signature === functionSignature);
                    result.functionAbi = functionAbi?.name;
                    if (functionAbi) {
                        const decodedParameters = web3.eth.abi.decodeParameters(functionAbi.inputs, tx.input.slice(10));
                        result.decodedParameters = decodedParameters;
                    } else {
                        console.log('Function signature not found in ABI');
                    }
                } catch (error) {
                    console.error('Error decoding input:', error);
                }
            } else {
                console.log('Data: No input data');
            }
            console.log('-----------------BLOCK------------------');
            console.log(result);
            console.log('-----------------------------------');
        });
        return result;
    } catch (error) {
        console.error('Error fetching block:', error);
    }
};

module.exports = {
    obtenerCuentas,
    obtenerSaldo,
    obtenerSaldoContrato,
    abonarSaldoInicial,
    transferenciaEntreCuentas,
    crearCuenta,
    obtenerCuenta,
    parseTxData
}