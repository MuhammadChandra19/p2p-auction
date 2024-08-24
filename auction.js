'use strict'

const RPC = require('@hyperswarm/rpc')
const DHT = require('hyperdht')
const Hypercore = require('hypercore')
const Hyperbee = require('hyperbee')
const crypto = require('crypto')
const { CLI } = require("./cli")

class Auction {

  constructor() {
    this.serverPubKey = Buffer.from('4cc04050ce4c31d92bcbbed107c92c2bd360b180ac73aa67829d2f50c323a95f', 'hex')
    this.bidHistory = []
    this.highestBid = {name: '', price: ''}
    this.connectedPairs = {}
    this.cli = new CLI()
    /**
     * The key for auction room
     */
    this.pairPubKey = null
    this.clientName = null
    this.hcore = new Hypercore(`./db/auction-client-${Date.now()}`)
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

    // Bind handlers
    this.rpcServer.respond('join_auction', this.handleJoinRequest.bind(this))
    this.rpcServer.respond('bid', this.handleBidRequest.bind(this))
    this.rpcServer.respond('auction_ended', this.handleAuctionEnded.bind(this))
    this.rpcServer.respond('broadcast_msg', this.handleBroadcast.bind(this))


  }

  async endAuction() {
    const payloadRaw = Buffer.from(JSON.stringify(this.highestBid), 'utf-8')
    Object.keys(this.connectedPairs).forEach(async (pair) => {
      console.log(pair)
      const key = Buffer.from(pair, 'hex')
      await this.rpc.request(key, 'auction_ended', payloadRaw)
    })

    this.rpc.request(this.serverPubKey, 
      'end_room', 
      Buffer.from(JSON.stringify({ key: this.rpcServer.publicKey.toString('hex')}), 'utf-8')
    )
  }

  async handleAuctionEnded(reqRaw) {
    const req = JSON.parse(reqRaw.toString('utf-8'))
    console.log(`\n Auction ended, sold to: ${req.name} for ${req.price} USDt, type menu to exit`)
    return Buffer.from(JSON.stringify({ title: 'auction ended'}), 'utf-8')
  }

  async handleBroadcast(reqRaw) {
    const req = JSON.parse(reqRaw.toString('utf-8'))
    console.log(req.message)
    return Buffer.from(JSON.stringify({ title: 'msg received'}), 'utf-8')
  }

  // Handler
  async handleJoinRequest(reqRaw) {
    // reqRaw is Buffer, we need to parse it
    const req = JSON.parse(reqRaw.toString('utf-8'))

  
    const { name, key } = req
    this.connectedPairs = {
      ...this.connectedPairs,
      [key]: {
        name,
        key
      }
    }
    return Buffer.from(JSON.stringify('Welcome', name), 'utf-8')
  }

  async handleBidRequest(reqRaw) {
    // reqRaw is Buffer, we need to parse it
    const req = JSON.parse(reqRaw.toString('utf-8'))
    const {price, name} = req

    const msg = `\n ${name} makes bid with ${price} USDt \n`
    console.log(msg)


    if(this.highestBid.price > parseInt(price)) {
      return Buffer.from(JSON.stringify(`${price} USDt is lower than current price ${this.highestBid}`), 'utf-8')
    } else {
      this.highestBid = req
    }

    this.bidHistory.push(msg)
    const payloadRaw = Buffer.from(JSON.stringify({ message: msg }), 'utf-8')
    Object.keys(this.connectedPairs).forEach(async (pair) => {
      const key = Buffer.from(pair, 'hex')
      await this.rpc.request(key, 'broadcast_msg', payloadRaw)
    })
    return Buffer.from(JSON.stringify('Bid Placed'), 'utf-8')
  }


  // Requester
  async handleRequestNewRoom({ roomName, price }) {
    // payload for request
    const payload = { roomName, price, key: this.rpcServer.publicKey.toString('hex')}
    const payloadRaw = Buffer.from(JSON.stringify(payload), 'utf-8')

    const respRaw = await this.rpc.request(this.serverPubKey, 'create_room', payloadRaw)
    const resp = JSON.parse(respRaw.toString('utf-8'))
  }


  async handleRequestGetRooms() {
    const respRaw = await this.rpc.request(this.serverPubKey, 'get_room')
    const resp = JSON.parse(respRaw.toString('utf-8'))
    return Object.values(resp)
  }

  async handleRequestEnterRoom(key, roomName,  yourName) {
    this.pairPubKey =  Buffer.from(key, 'hex')
    this.clientName = yourName

    const payload = { name: yourName, key: this.rpcServer.publicKey.toString('hex') }
    const payloadRaw = Buffer.from(JSON.stringify(payload), 'utf-8')

    await this.rpc.request(this.pairPubKey, 'join_auction', payloadRaw)
    console.log('> Start Bidding on:', roomName)
    // this.connectToChannel()
  }

  async handlePlaceBid(price) {
    const payload = { price, name: this.clientName}
    const payloadRaw = Buffer.from(JSON.stringify(payload), 'utf-8')

    await this.rpc.request(this.pairPubKey, 'bid', payloadRaw)
    console.log(`> Bid placed: ${price} \n`)
  }

  async cleanup() {
    await this.rpcServer.close()
    await this.dht.destroy()
  }
}

module.exports = {
  Auction
}