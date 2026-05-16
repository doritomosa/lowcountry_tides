const loadBtn = document.getElementById("loadBtn");
const tableBody = document.querySelector("#tideTable tbody");
const statusDiv = document.getElementById("status");

let tideChart = null;

function getTodayDate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

async function loadTides() {
  tableBody.innerHTML = "";
  statusDiv.textContent = "Loading...";

  const today = getTodayDate();

  const url =
    `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter` +
    `?product=predictions` +
    `&application=webapp` +
    `&begin_date=${today}` +
    `&end_date=${today}` +
    `&datum=MLLW` +
    `&station=8665530` +
    `&time_zone=lst_ldt` +
    `&units=english` +
    `&interval=6` +
    `&format=json`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    statusDiv.textContent = "";

    const labels = [];
    const heights = [];

    data.predictions.forEach((prediction) => {
      const time = prediction.t.split(" ")[1];

      labels.push(time);
      heights.push(parseFloat(prediction.v));

      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${prediction.t}</td>
        <td>${prediction.v}</td>
      `;

      tableBody.appendChild(row);
    });

    drawChart(labels, heights);

  } catch (err) {
    console.error(err);
    statusDiv.textContent = "Failed to load tide data.";
  }
}

function drawChart(labels, heights) {
  const ctx = document.getElementById("tideChart");

  // destroy old chart before drawing new one
  if (tideChart) {
    tideChart.destroy();
  }

  tideChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Tide Height (ft)",
        data: heights,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: {
            display: true,
            text: "Time"
          }
        },
        y: {
          title: {
            display: true,
            text: "Height (ft)"
          }
        }
      }
    }
  });
}

loadBtn.addEventListener("click", loadTides);