import net from "net";
import dns from "dns";
const {
  PacketDecoder,
  createHandshakePacket,
  createPingPacket,
} = require("./packet");
const parseDescription = require("./descriptionParser.js");

interface ServerI {
  hostname: string,
  port: number
}

const ping = (hostname, port = 25565, callback) => {
  resolveSRV(hostname, port)
    .then(openConnection)
    .then((data) => callback(null, data))
    .catch(callback);
});

module.exports.pingWithPromise = (hostname, port) => {
  return new Promise((resolve, reject) => {
    resolveSRV(hostname, port).then(openConnection)
    ping(hostname, port, (error, result) =>
      error ? reject(error) : resolve(result)
    );
  });
};

function openConnection(address) {
  const { hostname, port, ip, displayHost } = address;

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
          data.displayHost = displayHost;
          data.resolvedAddress = `${hostname}:${port}`;
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

const resolveSRV = (host, port, protocol = "tcp") => {
  return new Promise((resolve) => {
    dns.resolveSrv(`_minecraft._${protocol}.${host}`, (error, addresses) => {
      let address = {};

      if (!error) {
        address.name = addresses[0].name;
        address.port = addresses[0].port;
      } else {
        address.name = host;
      }

      dns.lookup(address.name, (err, res) => {
        if (err) reject(err);
        resolve({
          displayHost: host,
          hostname: address.name,
          port: address.port || port,
          ip: res,
        });
      });
    });
  });
};
