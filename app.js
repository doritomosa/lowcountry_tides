const loadBtn = document.getElementById("loadBtn");
const stationSelect = document.getElementById("stationSelect");
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

function clearDisplay() {
  tableBody.innerHTML = "";

  if (tideChart) {
    tideChart.destroy();
    tideChart = null;
  }
}

async function loadTides() {
  clearDisplay();
  statusDiv.textContent = "Loading...";

  const today = getTodayDate();
  const station = stationSelect.value;

  const base =
    `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter`;

  const predictionUrl =
    `${base}` +
    `?product=predictions` +
    `&application=webapp` +
    `&begin_date=${today}` +
    `&end_date=${today}` +
    `&datum=MLLW` +
    `&station=${station}` +
    `&time_zone=lst_ldt` +
    `&units=english` +
    `&interval=6` +
    `&format=json`;

  const waterLevelUrl =
    `${base}` +
    `?product=water_level` +
    `&application=webapp` +
    `&begin_date=${today}` +
    `&end_date=${today}` +
    `&datum=MLLW` +
    `&station=${station}` +
    `&time_zone=lst_ldt` +
    `&units=english` +
    `&format=json`;

  try {
    const [predictionResponse, waterLevelResponse] =
      await Promise.all([
        fetch(predictionUrl),
        fetch(waterLevelUrl)
      ]);

    const predictionData = await predictionResponse.json();
    const waterLevelData = await waterLevelResponse.json();

    statusDiv.textContent = "";

    // predicted tide
    const predictionLabels = [];
    const predictionHeights = [];

    predictionData.predictions.forEach((p) => {
      const time = p.t.split(" ")[1];

      predictionLabels.push(time);
      predictionHeights.push(parseFloat(p.v));

      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${p.t}</td>
        <td>${p.v}</td>
      `;

      tableBody.appendChild(row);
    });

    // actual measured water level
    const measuredHeights = [];

    waterLevelData.data.forEach((d) => {
      measuredHeights.push(parseFloat(d.v));
    });

    drawChart(
      predictionLabels,
      predictionHeights,
      measuredHeights
    );

  } catch (err) {
    console.error(err);
    statusDiv.textContent = "Failed to load tide data.";
  }
}

function drawChart(labels, predicted, measured) {
  const ctx = document.getElementById("tideChart");

  if (tideChart) {
    tideChart.destroy();
  }

  tideChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Predicted Tide",
          data: predicted,
          tension: 0.4
        },
        {
          label: "Measured Water Level",
          data: measured,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      interaction: {
        mode: "index",
        intersect: false
      },
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
stationSelect.addEventListener("change", loadTides);