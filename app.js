// import http from "http";
// import { Server as SocketServer } from "socket.io";

const fs = require('fs');

const path = require('path');
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server: SocketServer } = require('socket.io');
const {io : ioCliente } = require("socket.io-client");


const addressesJson = require('./addresses.json');
const aliasJson = require('./alias.json');
const contract = require('./domain');

const app = express();



const server = http.createServer(app);
const io = new SocketServer(server, {
    cors: {
        origin: "http://192.168.96.67:3001",
    },
});

const socketCliente = ioCliente("http://192.168.96.67:3000");

app.use(cors());


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
        if (aliasJson[alias]) {
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
        if (!address) {
            throw new Error('No se encontró la cuenta');
        }
        const balance = await contract.obtenerSaldo(address);
        const receipt = await contract.obtenerCuenta(address);
        res.json({ "saldo": balance, ...receipt });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/usuarios', async (req, res) => {
    // const  = req.params;
    try {
        let cuentas = [];
        for (const key in aliasJson) {
            const address = aliasJson[key]?.address;
            if (address) {
                const receipt = await contract.obtenerCuenta(address);
                const balance = await contract.obtenerSaldo(address);
                cuentas.push({ "saldo": balance, ...receipt })
            }
        }
        res.json(cuentas);
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
        console.log(account, amount)
        const privatess = aliasJson[account]?.private;
        console.log(privatess)
        const receipt = await contract.abonarSaldoInicial(privatess, amount);
        res.json(receipt);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to transfer tokens from one account to another
app.post('/transferencias', async (req, res) => {
    const { from, to, amount } = req.body;
    try {
        const privatess = aliasJson[from].private;
        const addressTo = aliasJson[to]?.address;
        const receipt = await contract.transferenciaEntreCuentas(privatess, addressTo, amount);

        socketCliente.emit("message", receipt.body);
        // console.log(JSON.stringify(usuarioConsulta))
        socketCliente.emit("transferencia", {"aliasx":addressTo});

        res.json(receipt);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/balancesSC', async (req, res) => {
    try {
        const balance = await contract.obtenerSaldoContrato();
        res.json({ balance });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++web socket++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
io.on("connection", (socket) => {
    console.log("connection Web socket");
    // console.log(JSON.stringify(socket));
    // console.log(JSON.stringify(socket, null, 2));
    // console.log(socket.id);
    socket.on("message", (body) => {
        console.log(body)
        socket.broadcast.emit("message", {
            body,
            from: socket.id.slice(8),
        });
    });

    socket.on("transferencia", (body) => {
        console.log(body)
        socket.broadcast.emit("transferencia", {
            body,
            from: socket.id.slice(8),
        });
    });
});

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++


// Start the server
// server.listen(PORT);

server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});