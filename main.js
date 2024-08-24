'use strict'

const readline = require('readline')
const { Auction } = require('./auction')
const { CLI } = require("./cli")

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const main = async () => {
  const auction = new Auction()
  try {
    await auction.init()
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Shutting down...')
      await auction.cleanup()
      process.exit()
    })

  } catch (error) {
    console.error('Error:', error)
    await auction.cleanup()
  }

  return auction
}

const start = async () => {
  console.log('Starting client...')
  const auction = await main()
  const cli = new CLI()

  const backToMenuOption = async () => {
    const ans = await cli.ask('\n\n\n\n\n> press 0 to back to menu, press 1 to end auction')
    if(ans === '0') {
      menu()
    }
    if(ans === '1') {
      auction.endAuction()
    }
    backToMenuOption()
  }

  const menu = async () => {
    const menuChoice = await cli.ask('-------P2P AUCTION-------\n1. Sell an item\n2. Bid on an item\n----------------------------\nChoose an option: >')
    switch (menuChoice) {
      case '1':
        const roomName = await cli.ask('----- Create the item -----\nEnter item name: ')
        const price = await cli.ask('Enter price (USDt): ')
        await auction.handleRequestNewRoom({ roomName, price })

        backToMenuOption()
        break
      case '2':
        await bidOnItem()
        break
      default:
        console.log('Invalid choice.')
        menu()
        break
    }
  }

  const bidOnItem = async () => {
    console.log('----- getting room list -----')
    const res = await auction.handleRequestGetRooms()
    let cliMsg = '-------P2P AUCTION ROOM-------\n------------------------------------\n'
    res.forEach((r, idx) => cliMsg += `${idx + 1}. ${r.roomName}\n`)
    console.log(cliMsg)

    const roomChoice = await cli.ask('Choose auction room number: ')
    console.log(roomChoice)
    if(res[roomChoice - 1] === undefined) {
      console.log('Invalid choice.')
      bidOnItem()
    } else {
      const yourName = await cli.ask('> input your name: ')
      const room = res[roomChoice - 1]
      console.log(room)
      await auction.handleRequestEnterRoom(room.key, room.roomName, yourName)
      startBidding()
    }
  }

  const startBidding = async () => {
    const action = await cli.ask('>\n\n  command (bid, menu): ')
    if (action === 'bid') {
      const price = await cli.ask('>\n  enter your price: ')
      await auction.handlePlaceBid(price)
      startBidding()
    } else {
      menu()
    }

  }

  menu()
}

start().catch(console.error)
