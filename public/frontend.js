const socket = new WebSocket("ws://localhost:3000/stocks");

let chart;

socket.addEventListener("message", (event) => {
  const data = JSON.parse(event.data);
  const { price, ordersBelowPrice, ordersAbovePrice, orderBook } =
    data.BTC;

  // Update the summary section
  document.getElementById("current-price").innerText = price.toFixed(2);
  document.getElementById("orders-below").innerText = ordersBelowPrice;
  document.getElementById("orders-above").innerText = ordersAbovePrice;

  // Prepare data for the chart
  const bids = orderBook.bids;
  const asks = orderBook.asks;

  const labels = [
    ...bids.map((order) => order.price),
    ...asks.map((order) => order.price),
  ];
  const bidData = bids.map((order) => order.count);
  const askData = asks.map((order) => order.count);

  // Initialize or update the chart
  if (!chart) {
    const ctx = document.getElementById("heatmap").getContext("2d");
    chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Asks",
            data: askData,
            backgroundColor: "rgba(255, 0, 0, 0.5)",
          },
          {
            label: "Bids",
            data: bidData,
            backgroundColor: "rgba(0, 255, 0, 0.5)",
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: {
            stacked: true,
            title: {
              display: true,
              text: "Price Levels",
            },
          },
          y: {
            stacked: true,
            title: {
              display: true,
              text: "Number of Orders",
            },
          },
        },

        plugins: {
          annotation: {
            annotations: {
              currentPrice: {
                type: "line",
                yMin: 0,
                yMax: "max",
                xMin: price,
                xMax: price,
                borderColor: "black",
                borderWidth: 2,
              },
            },
          },
        },
      },
    });
  } else {
    chart.data.labels = labels;
    chart.data.datasets[0].data = bidData;
    chart.data.datasets[1].data = askData;
    chart.options.plugins.annotation.annotations.currentPrice.xMin = price;
    chart.options.plugins.annotation.annotations.currentPrice.xMax = price;
    chart.update(none);
  }
});
