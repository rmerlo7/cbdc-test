# CBDC - BCB

## Pre-requisitos 

Antes de iniciar debes tener instalado truffle y ganache

## Para levantar el proyecto seguir los siguientes pasos:

1. Clonar
```sh
git clone 
```

2. Configurar archivos
Copiar los archivos `addresses.json.sample` y `alias.json.sample` -> renombrar a `addresses.json` y `alias.json` respectivamente.

Configurar el archivos `addresses.json` con las direcciones y llaves privadas de las cuentas de ganache (`address->private`).

3. Instalar dependencias
```sh
npm install
```

4. Compilar los contratos
```sh
truffle compile --all
```

5. Desplegar el contrato en ganache
```
truffle migrate --network development
```

6. Iniciar el proyecto 
```
node app.js
```

## Apis para consultar el contrato
* Obtener balance de una cuenta
```
curl --location 'localhost:3000/balances/:cuenta'
```
Ejemplo:
```
localhost:3000/balances/c1
```

* Solicitar saldo inicial
```
curl --location 'localhost:3000/saldoInicial' \
--header 'Content-Type: application/json' \
--data '{
    "account": "c2",
    "amount": "10"
}'
```

* Transferencia entre cuentas
```
curl --location 'localhost:3000/transferencias' \
--header 'Content-Type: application/json' \
--data '{
    "from": "c0",
    "to": "c2",
    "amount": "5"
}'
```

* Crear cuenta
```
curl --request POST \
  --url http://localhost:3000/usuarios \
  --header 'Content-Type: application/json'
  --data '{
	"name": "juan perez",
	"alias": "c2",
	"document": "1234567"
}'
```

* obtener usuarios
```
curl --request GET \
  --url http://localhost:3000/usuarios/c2 \
  --header 'Content-Type: application/json'
```