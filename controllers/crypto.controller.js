const crypto = require('crypto');

// Crible d'Eratosthène
function getPrime(min, max) {
    let liste = Array(max + 1).fill(0).map((_, i) => i);

    for (let i = 2; i < Math.sqrt(max + 1); i++) {
        for (let j = i * 2; j < max + 1; j += i)
            delete liste[j];
    }

    liste = Object.values(liste = liste.slice(min));
    let index = Math.floor(Math.random() * liste.length);

    return liste[index];
}


let DH = crypto.createDiffieHellman(20); // bit length // todo : pourquoi ça marche pas avec + de bits ?
const p = parseInt(DH.getPrime('hex'), 16);
const g = parseInt(DH.getGenerator('hex'), 16);
console.log("p:",p);
console.log("g:", g);

exports.p = p;
exports.g = g;
