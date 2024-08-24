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
output:
```
Starting client...
-------P2P AUCTION-------
1. Sell an item
2. Bid on an item
----------------------------
Choose an option: >

```
