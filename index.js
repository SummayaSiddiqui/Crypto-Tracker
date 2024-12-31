const express = require("express");
const expressWs = require("express-ws");
const path = require("path");

const app = express();
expressWs(app); // Enable WebSocket support

app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

const clientSockets = [];

// Data storage for BTC price and order book analysis
const stockData = {
  BTC: {
    price: 0,
    ordersAbovePrice: 0,
    ordersBelowPrice: 0,
    orderBook: { bids: [], asks: [] },
  },
};

// Fetch current BTC price from Binance API
async function fetchBTCPrice() {
  try {
    const response = await fetch(
      "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT"
      // "https://api.binance.com/api/v3/ticker/price?symbol=SEIUSDT"
    );
    const data = await response.json();
    stockData.BTC.price = parseFloat(data.price);
  } catch (error) {
    console.error("Error fetching BTC price:", error.message);
  }
}

// Fetch order book from Binance API and analyze
// async function analyzeOrderBook() {
//   try {
//     const response = await fetch(
//       "https://api.binance.com/api/v3/depth?symbol=BTCUSDT&limit=100"
//       // "https://api.binance.com/api/v3/depth?symbol=BTCUSDT&limit=100"
//     );
//     const data = await response.json();

//     const currentPrice = stockData.BTC.price;
//     if (currentPrice > 0) {
//       const ordersBelowPrice = data.bids.filter(
//         ([price]) => parseFloat(price) < currentPrice
//       );
//       const ordersAbovePrice = data.asks.filter(
//         ([price]) => parseFloat(price) > currentPrice
//       );

//       stockData.BTC.ordersBelowPrice = ordersBelowPrice.length;
//       stockData.BTC.ordersAbovePrice = ordersAbovePrice.length;

//       // Group bids and asks by price
//       const groupedBids = {};
//       const groupedAsks = {};

//       data.bids.forEach(([price, volume]) => {
//         const roundedPrice = Math.floor(parseFloat(price));
//         groupedBids[roundedPrice] = (groupedBids[roundedPrice] || 0) + 1;
//       });

//       data.asks.forEach(([price, volume]) => {
//         const roundedPrice = Math.floor(parseFloat(price));
//         groupedAsks[roundedPrice] = (groupedAsks[roundedPrice] || 0) + 1;
//       });

//       // Include detailed order book data
//       stockData.BTC.orderBook = {
//         bids: Object.entries(groupedBids).map(([price, count]) => ({
//           price: parseInt(price),
//           count: count,
//         })),
//         asks: Object.entries(groupedAsks).map(([price, count]) => ({
//           price: parseInt(price),
//           count: count,
//         })),
//       };
//     }
//   } catch (error) {
//     console.error("Error fetching order book:", error.message);
//   }
// }
async function analyzeOrderBook() {
  try {
    const response = await fetch(
      "https://api.binance.com/api/v3/depth?symbol=BTCUSDT&limit=100"
    );
    const data = await response.json();

    const currentPrice = stockData.BTC.price;
    if (currentPrice > 0) {
      // Count exact number of orders below and above the current price
      const ordersBelowPrice = data.bids.filter(
        ([price]) => parseFloat(price) < currentPrice
      );
      const ordersAbovePrice = data.asks.filter(
        ([price]) => parseFloat(price) > currentPrice
      );

      stockData.BTC.ordersBelowPrice = ordersBelowPrice.reduce(
        (totalOrders, [_, volume]) => totalOrders + parseFloat(volume),
        0
      );

      stockData.BTC.ordersAbovePrice = ordersAbovePrice.reduce(
        (totalOrders, [_, volume]) => totalOrders + parseFloat(volume),
        0
      );

      // Group bids and asks by price
      const groupedBids = {};
      const groupedAsks = {};

      data.bids.forEach(([price, volume]) => {
        const roundedPrice = Math.floor(parseFloat(price));
        groupedBids[roundedPrice] =
          (groupedBids[roundedPrice] || 0) + parseFloat(volume);
      });

      data.asks.forEach(([price, volume]) => {
        const roundedPrice = Math.floor(parseFloat(price));
        groupedAsks[roundedPrice] =
          (groupedAsks[roundedPrice] || 0) + parseFloat(volume);
      });

      // Include detailed order book data
      stockData.BTC.orderBook = {
        bids: Object.entries(groupedBids).map(([price, count]) => ({
          price: parseInt(price),
          count: count,
        })),
        asks: Object.entries(groupedAsks).map(([price, count]) => ({
          price: parseInt(price),
          count: count,
        })),
      };
    }
  } catch (error) {
    console.error("Error fetching order book:", error.message);
  }
}

// Update BTC price and order book periodically
setInterval(async () => {
  await fetchBTCPrice(); // Fetch latest BTC price
  await analyzeOrderBook(); // Analyze order book
  clientSockets.forEach((socket) =>
    socket.send(JSON.stringify(stockData))
  );
}, 2000);

// WebSocket route for real-time updates
app.ws("/stocks", (socket) => {
  clientSockets.push(socket);
  socket.send(JSON.stringify(stockData));
});

// Render index page
app.get("/", (req, res) => {
  res.render("index", { stocks: Object.keys(stockData) });
});

// Start server
app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
