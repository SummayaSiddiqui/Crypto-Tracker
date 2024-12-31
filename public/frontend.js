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

  // Combine all prices for x-axis
  const allPrices = [
    ...bids.map((b) => b.price),
    ...asks.map((a) => a.price),
  ];
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);

  // Initialize or update the chart
  // if (!chart) {
  //   const ctx = document.getElementById("heatmap").getContext("2d");
  //   chart = new Chart(ctx, {
  //     type: "bar",
  //     data: {
  //       labels: allPrices,
  //       datasets: [
  //         {
  //           label: "Bids",
  //           data: bids.map((b) => ({ x: b.price, y: b.count })),
  //           backgroundColor: "rgba(0, 255, 0, 0.5)",
  //         },
  //         {
  //           label: "Asks",
  //           data: asks.map((a) => ({ x: a.price, y: a.count })),
  //           backgroundColor: "rgba(255, 0, 0, 0.5)",
  //         },
  //       ],
  //     },
  //     options: {
  //       responsive: true,
  //       scales: {
  //         x: {
  //           type: "linear",
  //           min: minPrice,
  //           max: maxPrice,
  //           title: {
  //             display: true,
  //             text: "Price Levels",
  //           },
  //         },
  //         y: {
  //           beginAtZero: true,
  //           title: {
  //             display: true,
  //             text: "Number of Orders",
  //           },
  //         },
  //       },
  //       plugins: {
  //         annotation: {
  //           annotations: {
  //             currentPrice: {
  //               type: "line",
  //               scaleID: "x",
  //               value: price,
  //               borderColor: "black",
  //               borderWidth: 5,
  //             },
  //           },
  //         },
  //       },
  //     },
  //   });
  // } else {
  //   // Update datasets
  //   chart.data.datasets[0].data = bids.map((b) => ({
  //     x: b.price,
  //     y: b.count,
  //   }));
  //   chart.data.datasets[1].data = asks.map((a) => ({
  //     x: a.price,
  //     y: b.count,
  //   }));

  //   // Update x-axis range
  //   chart.options.scales.x.min = minPrice;
  //   chart.options.scales.x.max = maxPrice;

  //   // Update the current price line
  //   chart.options.plugins.annotation.annotations.currentPrice.value =
  //     price;

  //   // Update the chart
  //   chart.update();
  // }
  if (!chart) {
    const ctx = document.getElementById("heatmap").getContext("2d");
    chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: bids.map((b) => b.price).concat(asks.map((a) => a.price)), // Use prices for labels
        datasets: [
          {
            label: "Bids",
            data: bids.map((b) => ({ x: b.count, y: b.price })),
            backgroundColor: "rgba(0, 255, 0, 0.5)", // Green for bids
          },
          {
            label: "Asks",
            data: asks.map((a) => ({ x: a.count, y: a.price })),
            backgroundColor: "rgba(255, 0, 0, 0.5)", // Red for asks
          },
        ],
      },
      options: {
        indexAxis: "y", // Flip axes for horizontal bars
        responsive: true,
        plugins: {
          annotation: {
            annotations: {
              currentPrice: {
                type: "line",
                scaleID: "y",
                value: price,
                borderColor: "black",
                borderWidth: 5,
              },
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Number of Orders",
            },
          },
          y: {
            type: "linear", // Linear scale for price levels
            title: {
              display: true,
              text: "Price Levels",
            },
          },
        },
      },
    });
  } else {
    // Update datasets for bids and asks
    chart.data.datasets[0].data = bids.map((b) => ({
      x: b.count,
      y: b.price,
    }));
    chart.data.datasets[1].data = asks.map((a) => ({
      x: a.count,
      y: a.price,
    }));

    // Update the chart
    chart.update();
  }
});
