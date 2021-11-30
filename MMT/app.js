const express = require('express');
const app = express();
const generator = require('./functions');

const http = require('http');
const { SocketAddress } = require('net');
const server = http.createServer(app);

const { Server } = require('socket.io');
const publicSecret = configurePublicKeys();

const io = new Server(server);
let clients = new Set();
io.on('connection', (socket) => {
    console.log('User connected');
    socket.emit('get_public_key', publicSecret);

    clients.add(socket);
    socket.on('on-chat', data => {
        io.emit('user-chat', data);
    })


})

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/client/index.html');
})


server.listen(3000, () => {
    console.log(__dirname);
})

async function shareKeys() {
    for (let client of clients) {
        let middleMess = undefined;
        for (let middle of clients) {
            if (client !== middle) {
                await compute(middle, middleMess).then((data) => {
                    middleMess = data;
                });
            }
        }
        if (middleMess !== undefined) {
            client.emit('send_mess', middleMess);
        }
    }
    return Promise.resolve(1);
}

function compute(socket, middleMess) {
    return new Promise((resolve, reject) => {
        let timer;
        socket.once('get_mess', responseHandler);

        function responseHandler(data) {
            clearTimeout(timer);
            resolve(data);
        }
        timer = setTimeout(() => {
            reject("Waiting timeout");
        }, 10000);
        socket.emit('get_mess', middleMess);
    })
}

function configurePublicKeys() {
    let prime = generator.randomPrime();
    let g = generator.gGenerator(prime);
    console.log("Configure public keys end.");
    return {
        p: prime,
        g: g
    }
}