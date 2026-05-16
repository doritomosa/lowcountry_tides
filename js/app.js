const STATIONS = [
  { id: "8665530", name: "Charleston Harbor, SC" },
  { id: "8661070", name: "Myrtle Beach, SC" },
  { id: "8670870", name: "Savannah, GA" }
];

const loadBtn = document.getElementById("loadBtn");
const stationSelect = document.getElementById("stationSelect");
const predictionTableBody =
  document.querySelector("#predictionTable tbody");

const observedTableBody =
  document.querySelector("#observedTable tbody");

const diagnosticsDiv =
  document.getElementById("diagnostics");
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
  predictionTableBody.innerHTML = "";
  observedTableBody.innerHTML = "";

  diagnosticsDiv.innerHTML =
    "No diagnostics available.";

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

    predictionTableBody.appendChild(row);
    });

    // actual measured water level
    const measuredHeights = [];

    waterLevelData.data.forEach((d) => {
      measuredHeights.push(parseFloat(d.v));

      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${d.t}</td>
        <td>${d.v}</td>
      `;

      observedTableBody.appendChild(row);
    });

    const predictedLatest =
      predictionHeights[predictionHeights.length - 1];

    const measuredLatest =
      measuredHeights[measuredHeights.length - 1];

    const residual =
      (measuredLatest - predictedLatest).toFixed(2);

    diagnosticsDiv.innerHTML = `
      <p><strong>Latest Predicted:</strong>
      ${predictedLatest} ft</p>

      <p><strong>Latest Observed:</strong>
      ${measuredLatest} ft</p>

      <p><strong>Residual (Observed - Predicted):</strong>
      ${residual} ft</p>
    `;

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

function populateStations() {
  const select = document.getElementById("stationSelect");

  STATIONS.forEach((station) => {
    const option = document.createElement("option");
    option.value = station.id;
    option.textContent = station.name;
    select.appendChild(option);
  });
  select.value = "8665530";
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
populateStations();
