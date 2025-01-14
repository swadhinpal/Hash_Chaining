const crypto = require('crypto');

class ServerRing {
    constructor() {
        this.servers = [];
        this.data = new Map();
    }

    generateHash(value) {
        return crypto.createHash('sha1').update(value).digest('hex');
    }

    addServer(serverName) {
        const serverHash = this.generateHash(serverName);
        this.servers.push({ name: serverName, hash: serverHash });
        this.servers.sort((a, b) => this.compareHash(a.hash, b.hash));
        this.moveDataToNewServer(serverName); 
    }

    
    removeServer(serverName) {
        const serverHash = this.generateHash(serverName);
        
        this.servers = this.servers.filter(server => server.name !== serverName);
        this.data.forEach((data, hash) => {
            const currentServer = data.server;
            if (currentServer.name === serverName) {
                let newServer = this.findNextServer(currentServer);
                data.server = newServer;
                console.log(`Data moved from server ${serverName} to server ${newServer.name}`);
            }
        });
    }

   
    addData(value) {
        let dataHash = this.generateHash(value);
        let originalDataHash = dataHash;
        let counter = 0;
        while (this.data.has(dataHash)) {
            counter++;
            dataHash = this.generateHash(`${originalDataHash}${counter}`);
        }

        let closestServer = this.findClosestServer(dataHash);
        this.data.set(dataHash, { value, server: closestServer });
        return closestServer;
    }

    removeData(value) {
        const dataHash = this.generateHash(value);
        if (this.data.has(dataHash)) {
            this.data.delete(dataHash);
        }
    }

    showRing() {
        this.servers.forEach(server => {
            console.log(`Server: ${server.name}, Hash: ${server.hash}`);
        });
    }

    
    showData() {
        this.data.forEach((data, hash) => {
            console.log(`Data Hash: ${hash}, Value: ${data.value}, Assigned to Server: ${data.server.name}`);
        });
    }

   
    showServers() {
        this.servers.forEach(server => {
        console.log(`Server: ${server.name}, Hash: ${server.hash}`);
        let assignedData = [];
        
        // Check which data is assigned to this server
        this.data.forEach((data, hash) => {
            if (data.server.name === server.name) {
                assignedData.push({ dataHash: hash, value: data.value });
            }
        });

        if (assignedData.length > 0) {
            console.log('  Assigned Data:');
            assignedData.forEach(data => {
                console.log(`    Data Hash: ${data.dataHash}, Value: ${data.value}`);
            });
        } else {
            console.log('  No data assigned to this server.');
        }
      });
    }


    findClosestServer(dataHash) {
        if (this.servers.length === 0) return null;

        let closestServer = this.servers[0];
        let minDifference = Math.abs(parseInt(closestServer.hash, 16) - parseInt(dataHash, 16));

        for (let i = 1; i < this.servers.length; i++) {
            let diff = Math.abs(parseInt(this.servers[i].hash, 16) - parseInt(dataHash, 16));
            if (diff < minDifference) {
                minDifference = diff;
                closestServer = this.servers[i];
            }
        }

        return closestServer;
    }

    // Find the next server in the ring (clockwise)
    findNextServer(currentServer) {
        if (this.servers.length === 1) {
            return currentServer;  
        }
    
        const currentIndex = this.servers.findIndex(server => server.name === currentServer.name);
        return this.servers[(currentIndex + 1) % this.servers.length]; 
    }
    

    compareHash(hashA, hashB) {
        return parseInt(hashA, 16) - parseInt(hashB, 16);
    }

    moveDataToNewServer(newServerName) {
        const newServer = this.servers.find(server => server.name === newServerName);
        console.log(`New Server: ${newServer.name}, Hash: ${newServer.hash}`);
    
        const nextServer = this.findNextServer(newServer);
        console.log(`Next Server: ${nextServer.name}, Hash: ${nextServer.hash}`);
    
        this.data.forEach((data, hash) => {
            if (data.server.name === nextServer.name) {
                const distanceToNewServer = Math.abs(this.compareHash(hash, newServer.hash));
                const distanceToNextServer = Math.abs(this.compareHash(hash, nextServer.hash));
                if (distanceToNewServer < distanceToNextServer) {
                    data.server = newServer;
                    console.log(`Data ${data.value} moved from server ${nextServer.name} to server ${newServer.name}`);
                }
            }
        });
    } 
}


const serverRing = new ServerRing();

const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
    while (true) {
        const action = await askQuestion(
            '1. Add Server\n2. Remove Server\n3. Add Data\n4. Remove Data\n5. Show Ring\n6. Show Data\n7. Show Servers\n8. Exit\nChoose an option: '
        );

        switch (action) {
            case '1':
                const serverName = await askQuestion('Enter server name: ');
                serverRing.addServer(serverName);
                break;
            case '2':
                const removeServerName = await askQuestion('Enter server name to remove: ');
                serverRing.removeServer(removeServerName);
                break;
            case '3':
                const dataValue = await askQuestion('Enter data value: ');
                const serverAssigned = serverRing.addData(dataValue);
                console.log(`Data assigned to server: ${serverAssigned.name}`);
                break;
            case '4':
                const removeDataValue = await askQuestion('Enter data value to remove: ');
                serverRing.removeData(removeDataValue);
                break;
            case '5':
                console.log('Server Ring:');
                serverRing.showRing();
                break;
            case '6':
                console.log('Data in Ring:');
                serverRing.showData();
                break;
            case '7':
                console.log('Servers:');
                serverRing.showServers();
                break;
            case '8':
                rl.close();
                return;
            default:
                console.log('Invalid option!');
                break;
        }
    }
}

main();
