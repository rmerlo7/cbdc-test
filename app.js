const fs = require('fs');
const path = require('path');
const express = require('express');
const contract = require('./domain');

const addressesJson = require('./addresses.json');
const aliasJson = require('./alias.json');

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Route for create users
app.post('/usuarios', async (req, res) => {
    const alias = req.body?.alias
    try {
        const keys = Object.keys(addressesJson);
        if (keys.length === 0) {
            throw new Error('No hay direcciones disponibles');
        }
        if(aliasJson[alias]) {
            throw new Error('El alias ya existe');
        }

        // save account in the blockchain
        req.body.address = keys[0];
        req.body.privateKey = addressesJson[keys[0]];
        const receipt = await contract.crearCuenta(req.body);
        
        // TODO: validate result save
        // register the alias
        aliasJson[alias] = { address: keys[0], private: addressesJson[keys[0]] };
        fs.writeFile(path.join(__dirname, 'alias.json'), JSON.stringify(aliasJson, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            console.log('Alias creado correctamente.');
        });
    
        // delete the address from the json
        delete addressesJson[keys[0]];
        const updatedJson = JSON.stringify(addressesJson, null, 2);
        fs.writeFile(path.join(__dirname, 'addresses.json'), updatedJson, 'utf8', (err) => {
            if (err) {
                console.error('Error al escribir el archivo:', err);
                return;
            }
            console.log('Clave eliminada y archivo actualizado correctamente.');
        });
        res.json(receipt);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/usuarios/:account', async (req, res) => {
    const { account } = req.params;
    try {
        const address = aliasJson[account]?.address;
        if (!address){
            throw new Error('No se encontró la cuenta');
        }
        const receipt = await contract.obtenerCuenta(address);
        res.json(receipt);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to get the balance of an account
app.get('/balances/:account', async (req, res) => {
    const { account } = req.params;
    try {
        const address = aliasJson[account]?.address;
        const balance = await contract.obtenerSaldo(address);
        res.json({ balance });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to initialize the balance of an account
app.post('/saldoInicial', async (req, res) => {
    const { account, amount } = req.body;
    try {
        const private = aliasJson[account]?.private;
        const receipt = await contract.abonarSaldoInicial(private, amount);
        res.json(receipt);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to transfer tokens from one account to another
app.post('/transferencias', async (req, res) => {
    const { from, to, amount } = req.body;
    try {
        const private = aliasJson[from].private;
        const addressTo = aliasJson[to]?.address;
        const receipt = await contract.transferenciaEntreCuentas(private, addressTo, amount);
        res.json(receipt);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});