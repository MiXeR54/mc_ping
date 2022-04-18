const { Writable } = require("stream");
const varint = require("varint");
const Int64 = require("node-int64");

module.exports.createHandshakePacket = (address, port, protocol = 754) => {
  let portBuffer = Buffer.allocUnsafe(2);
  portBuffer.writeUInt16BE(port, 0);

  // Возвращает hansdhake пакет с пакетом запроса
  return Buffer.concat([
    createPacket(
      0,
      Buffer.concat([
        Buffer.from(varint.encode(protocol)),
        Buffer.from(varint.encode(address.length)),
        Buffer.from(address, "utf8"),
        portBuffer,
        Buffer.from(varint.encode(1)),
      ])
    ),
    createPacket(0, Buffer.alloc(0)),
  ]);
};

module.exports.createPingPacket = (timestamp) => {
  return createPacket(1, new Int64(timestamp).toBuffer());
};

function createPacket(packetId, data) {
  return Buffer.concat([
    Buffer.from(varint.encode(varint.encodingLength(packetId) + data.length)),
    Buffer.from(varint.encode(packetId)),
    data,
  ]);
}

module.exports.PacketDecoder = class PacketDecoder extends Writable {
  constructor(options) {
    super(options);
    this.buffer = Buffer.alloc(0);
  }

  _write(chunk, encoding, callback) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    decodePacket(this.buffer)
      .catch((_) => callback())
      .then((packet) => {
        if (!packet) return;
        if (packet.id === 0) {
          return decodeHandshakeResponse(packet);
        } else if (packet.id === 1) {
          return decodePong(packet);
        }
      })
      .then((packet) => {
        if (!packet) return;

        // Удаляем пакет из буфера
        this.buffer = this.buffer.slice(packet.bytes);

        this.emit("packet", packet.result);
        callback();
      })
      .catch(callback);
  }
};

function decodePacket(buffer) {
  return new Promise((resolve, reject) => {
    // Decode длинны пакета
    let packetLength = varint.decode(buffer, 0);
    if (packetLength === undefined) {
      return reject(new Error("Не получилось раскодировать"));
    }

    // Проверка длинны пакета
    if (buffer.length < varint.encodingLength(packetLength) + packetLength) {
      return reject(new Error("Пакет не полный"));
    }

    // Decode packet id
    let packetId = varint.decode(buffer, varint.encodingLength(packetLength));
    if (packetId === undefined) {
      return reject(new Error("Не получилось раскодировать packet id"));
    }

    // Склейка
    let data = buffer.slice(
      varint.encodingLength(packetLength) + varint.encodingLength(packetId)
    );

    resolve({
      id: packetId,
      bytes: varint.encodingLength(packetLength) + packetLength,
      data,
    });
  });
}

function decodeHandshakeResponse(packet) {
  return new Promise((resolve, reject) => {
    // Читаем ответ
    let responseLength = varint.decode(packet.data, 0);
    let response = packet.data.slice(
      varint.encodingLength(responseLength),
      varint.encodingLength(responseLength) + responseLength
    );

    packet.result = JSON.parse(response);
    resolve(packet);
  });
}

function decodePong(packet) {
  return new Promise((resolve, reject) => {
    // Декодим понг от сервера
    let timestamp = new Int64(packet.data);

    packet.result = Date.now() - timestamp;
    resolve(packet);
  });
}
