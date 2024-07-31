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
    console.log('------------------------------------');
    console.log(params);
    console.log('------------------------------------');
    const { address, privateKey, name, alias, document } = params;
    const { web3, contract, contractAddress } = await getInstanceContract();
    try {
        const method = contract.methods.createUser(address, name, document, alias);

        // Create and sign the transaction
        // 6721976
        const createTransaction = async () => {
            const tx = {
                from: address,
                to: contractAddress,
                gas: 2000000,
                data: method.encodeABI()
            };

            const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);

            // Send the transaction
            const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
            console.log('Transaction receipt:', receipt);
        };

        // Execute the transaction
        await createTransaction().catch(console.error);

        return { result: 'ok' };
    } catch (error) {
        console.error('Error al llamar al método del contrato:', error);
        return error;
    }
}

const obtenerCuenta = async (add) => {
    const { contract } = await getInstanceContract();
    try {
        const result = await contract.methods.getUser(add).call(); 
        return result;
    } catch (error) {
        return error;
    }
}

const obtenerCuentas = async () => {
    const web3 = new Web3(new Web3.providers.HttpProvider(nodeUrl));
    try {
        return await web3.eth.getAccounts();
    } catch (error) {
        return error;
    }
}

const obtenerSaldo = async (account) => {
    const { contract } = await getInstanceContract();
    try {
        const result = await contract.methods.balanceTokens(account).call();
        return result;
    } catch (error) {
        console.error('Error al llamar al método del contrato:', error);
        return error;
    }
};

const obtenerSaldoContrato = async () => {
    const { contract } = await getInstanceContract();
    try {
        const result = await contract.methods.balanceTokensSC().call();
        return result;
    } catch (error) {
        console.error('Error al llamar al método del contrato:', error);
        return error;
    }
};

const abonarSaldoInicial = async (privateKey, numTokens) => {
    const { web3, contract, contractAddress } = await getInstanceContract();
    try {
        // Define the method and parameter
        const account = getAddressFromPrivateKey(web3, privateKey);
        const method = contract.methods.compraTokens(numTokens);

        // Create and sign the transaction
        const createTransaction = async () => {
            const tx = {
                from: account,
                to: contractAddress,
                gas: 2000000,
                data: method.encodeABI()
            };

            const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);

            // Send the transaction
            const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
            console.log('Transaction receipt:', receipt);
        };

       
        await createTransaction()
        return { result: 'ok' };
    } catch (error) {
        console.error('Error al llamar al método del contrato:', error);
        throw error;
    }
};

const transferenciaEntreCuentas = async (privateKey, addressTo, numTokens) => {
    const { web3, contract, contractAddress } = await getInstanceContract();
    try {
        // Define the method and parameter
        const addressFrom = getAddressFromPrivateKey(web3, privateKey);
        const method = contract.methods.transferenciaEntreCuentas(addressTo, numTokens);

        // Create and sign the transaction
        const createTransaction = async () => {
            const tx = {
                from: addressFrom,
                to: contractAddress,
                gas: 2000000,
                data: method.encodeABI()
            };

            const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);

            // Send the transaction
            const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
            console.log('Transaction receipt:', receipt);
        };

        // Execute the transaction
        await createTransaction().catch(console.error);

        return { result: 'ok' };
    } catch (error) {
        console.error('Error al llamar al método del contrato:', error);
        return error;
    }
};

const getAddressFromPrivateKey = (web3, privateKey) => {
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    return account.address;
};

// (async () => {
//     const accounts = await obtenerCuentas();
//     console.log('accounts: ', accounts);

//     const privateKey = '0x224c3cb5bd28ec879f73f5dcc08f36255bbd84f4e7b35db9fd9e96c1929a4004';
//     const privateKey2 = '0x511fdfda22a87be0eade193f4be0ff424b83a9ccb38b9820fb8e17c49ccefc31';

//     await abonarSaldoInicial(privateKey, '100');
//     await abonarSaldoInicial(privateKey2, '10');

//     await transferenciaEntreCuentas(privateKey, accounts[1], '2');

//     const saldoContrato = await obtenerSaldoContrato();
//     console.log('saldoCOntrato: ', saldoContrato);

//     const saldoC1 = await obtenerSaldo(accounts[0]);
//     console.log('saldoCuenta: ', saldoC1);
//     const saldoC2 = await obtenerSaldo(accounts[1]);
//     console.log('saldoCuenta2: ', saldoC2);
// })();

module.exports = {
    obtenerCuentas,
    obtenerSaldo,
    obtenerSaldoContrato,
    abonarSaldoInicial,
    transferenciaEntreCuentas,
    crearCuenta,
    obtenerCuenta
}