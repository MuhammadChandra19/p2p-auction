# Step-by-Step Instructions:

### 1. **Install Dependencies:**
Before running the server or client, you need to make sure all the required dependencies are installed. Navigate to the directory containing your project and run:
```
npm install
```

### 2. **Start the Server:**
Once the dependencies are installed, start the server by running:
```
node server.js
```

### 3. **Run the Client:**
In another terminal window or tab, run the client application:
```
node main.js
```

### EXAMPLE
Make sure the server is started, and copy the public key to  `auction.js` line 13  
```
   this.serverPubKey = Buffer.from('c8ecc58fce0bac50dbbe6c4a26b1e2a4f172a6508c18fe8e0be5d0a64ae2728e', 'hex')
```

then run `node main.js` in different terminal:
seller output:
```
Starting client...
-------P2P AUCTION-------
1. Sell an item
2. Bid on an item
----------------------------
Choose an option: >1
----- Create the item -----
Enter item name: nft card
Enter price (USDt): 10

> 
 rui makes bid with 14 USDt 


 kai makes bid with 40 USDt 

1

```

bid output:
```
Starting client...
-------P2P AUCTION-------
1. Sell an item
2. Bid on an item
----------------------------
Choose an option: >2
----- getting room list -----
-------P2P AUCTION ROOM-------
------------------------------------
1. nft card

> 1
1
> input your name: rui
{
  roomName: 'nft card',
  price: '10',
  key: 'db14f5c78b334c8584f49a6565f6afc6fbfc48d9f98c382493688f1efba450cb'
}
> Start Bidding on: nft card
>

  command (bid, menu): bid
>
  enter your price: 14
> Bid placed: 14 

>

  command (bid, menu): 
 rui makes bid with 14 USDt 


 kai makes bid with 40 USDt 


 Auction ended, sold to: kai for 40 USDt, type menu to exit
```

bid output
```
Starting client...
-------P2P AUCTION-------
1. Sell an item
2. Bid on an item
----------------------------
Choose an option: >2
----- getting room list -----
-------P2P AUCTION ROOM-------
------------------------------------
1. nft card

Choose auction room number: 1
1
> input your name: kai
{
  roomName: 'nft card',
  price: '10',
  key: 'db14f5c78b334c8584f49a6565f6afc6fbfc48d9f98c382493688f1efba450cb'
}
> Start Bidding on: nft card
>

  command (bid, menu): bid
>
  enter your price: 40
> Bid placed: 40 

>

  command (bid, menu): 
 kai makes bid with 40 USDt 


 Auction ended, sold to: kai for 40 USDt, type menu to exit
```