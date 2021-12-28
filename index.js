const net = require("net");
const dns = require("dns");
const {
  PacketDecoder,
  createHandshakePacket,
  createPingPacket,
} = require("./packet");
const parseDescription = require("./descriptionParser.js");

const ping = (module.exports.ping = (hostname, port = 25565, callback) => {
  resolveSRV(hostname, port)
    .then(openConnection)
    .then((data) => callback(null, data))
    .catch(callback);
});

module.exports.pingWithPromise = (hostname, port) => {
  return new Promise((resolve, reject) => {
    ping(hostname, port, (error, result) =>
      error ? reject(error) : resolve(result)
    );
  });
};

function openConnection(address) {
  const { hostname, port, ip } = address;

  return new Promise((resolve, reject) => {
    let connection = net.createConnection(port, hostname, () => {
      // Decode входящих пакетов
      let packetDecoder = new PacketDecoder();
      connection.pipe(packetDecoder);

      // пишем хендшейк пакет
      connection.write(createHandshakePacket(hostname, port));

      packetDecoder.once("error", (error) => {
        connection.destroy();
        clearTimeout(timeout);
        reject(error);
      });

      packetDecoder.once("packet", (data) => {
        // пишем пинг пакет
        connection.write(createPingPacket(Date.now()));

        packetDecoder.once("packet", (ping) => {
          connection.end();
          clearTimeout(timeout);
          data.ping = ping;
          data.description = parseDescription(data.description);
          data.address = `${hostname}:${port}`;
          data.ip = ip;
          data.port = port;
          resolve(data);
        });
      });
    });

    connection.once("error", (error) => {
      connection.destroy();
      clearTimeout(timeout);
      reject(error);
    });

    connection.once("timeout", () => {
      connection.destroy();
      clearTimeout(timeout);
      reject(new Error("Timed out"));
    });

    let timeout = setTimeout(() => {
      connection.end();
      reject(new Error("Timed out (3 seconds passed)"));
    }, 3000);
  });
}

// function resolveSRV(hostname) {
//   return new Promise((resolve, reject) => {
//     if (net.isIP(hostname) !== 0) {
//       reject(new Error("Hostname is an IP address"));
//     } else {
//       dns.resolveSrv("_minecraft._tcp." + hostname, (error, result) => {
//         if (error) {
//           reject(error);
//         } else if (result.length === 0) {
//           reject(new Error("Empty result"));
//         } else {
//           console.log(result[0].name);
//           resolve({
//             hostname: result[0].name,
//             port: result[0].port,
//           });
//         }
//       });
//     }
//   });
// }

const resolveSRV = (host, port) =>
  new Promise((resolve, reject) => {
    dns.lookup(host, (err, address) => {
      if (err) reject(err);
      resolve({
        hostname: host,
        port: port,
        ip: address,
      });
    });
  });
