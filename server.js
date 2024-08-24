'use strict'

const RPC = require('@hyperswarm/rpc')
const DHT = require('hyperdht')
const Hypercore = require('hypercore')
const Hyperbee = require('hyperbee')
const crypto = require('crypto')

class RpcServer {
  constructor() {
    this.rooms = {}
    this.hcore = new Hypercore('./db/rpc-server')
    this.hbee = new Hyperbee(this.hcore, { keyEncoding: 'utf-8', valueEncoding: 'binary' })
  }

  async init() {
    await this.hbee.ready()

    // Resolve or generate DHT seed
    this.dhtSeed = (await this.hbee.get('dht-seed'))?.value
    if (!this.dhtSeed) {
      this.dhtSeed = crypto.randomBytes(32)
      await this.hbee.put('dht-seed', this.dhtSeed)
    }

    // Initialize DHT
    this.dht = new DHT({
      port: 40001,
      keyPair: DHT.keyPair(this.dhtSeed),
      bootstrap: [{ host: '127.0.0.1', port: 30001 }] // Bootstrap points to the DHT started via CLI
    })

    // Resolve or generate RPC seed
    this.rpcSeed = (await this.hbee.get('rpc-seed'))?.value
    if (!this.rpcSeed) {
      this.rpcSeed = crypto.randomBytes(32)
      await this.hbee.put('rpc-seed', this.rpcSeed)
    }

    // Setup RPC server
    this.rpc = new RPC({ seed: this.rpcSeed, dht: this.dht })
    this.rpcServer = this.rpc.createServer()
    await this.rpcServer.listen()
    console.log('RPC server started listening on public key:', this.rpcServer.publicKey.toString('hex'))

    // Bind handlers
    this.rpcServer.respond('ping', this.handlePing.bind(this))
    this.rpcServer.respond('get_room', this.handleGetRooms.bind(this))
    this.rpcServer.respond('create_room', this.handleCreateRoom.bind(this))
    this.rpcServer.respond('end_room', this.handleDeleteRoom.bind(this))
  }

  async handlePing(reqRaw) {
    // reqRaw is Buffer, we need to parse it
    const req = JSON.parse(reqRaw.toString('utf-8'))

    const resp = { nonce: req.nonce + 1 }

    // We need to return buffer response
    const respRaw = Buffer.from(JSON.stringify(resp), 'utf-8')
    return respRaw
  }

  async handleGetRooms() {
    return Buffer.from(JSON.stringify(this.rooms), 'utf-8')
  }

  async handleCreateRoom(reqRaw) {
    // reqRaw is Buffer, we need to parse it
    const req = JSON.parse(reqRaw.toString('utf-8'))

    this.rooms = {
      ...this.rooms,
      [req.key]: req
    }
    return Buffer.from(JSON.stringify('Auction started'), 'utf-8')
  }

  async handleDeleteRoom(reqRaw) {
    const req = JSON.parse(reqRaw.toString('utf-8'))

    delete this.rooms[req.key]
    console.log('auction ended')
    return Buffer.from(JSON.stringify('Auction finished'), 'utf-8')
  }

  async cleanup() {
    await this.rpcServer.close()
    await this.dht.destroy()
  }
}

const main = async () => {
  const server = new RpcServer()
  try {
    await server.init()
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Shutting down...')
      await server.cleanup()
      process.exit()
    })
  } catch (error) {
    console.error('Error:', error)
    await server.cleanup()
  }
}

main().catch(console.error)
