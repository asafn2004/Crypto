let data = "";
let coins100 = [];
const coinsListUrl = "https://api.coingecko.com/api/v3/coins/list/";
const coinsRatesBaseUrl = "https://min-api.cryptocompare.com/data/pricemulti";

var coinsRatesFromServer = {};

var coinsSymbolsForReport = [];

var chartIsDisplayed = false;

//Example:
// coinsRatesForChart =
//  {
//     eur:  [
//        { x: new Date(2016, 07, 15, 10, 30), y: 180 },
//        { x: new Date(2016, 07, 15, 10, 35), y: 135 },
//        { x: new Date(2016, 07, 15, 10, 40), y: 144 },
//      ],
//     cat:  [
//        { x: new Date(2016, 07, 15, 10, 30), y: 120 },
//        { x: new Date(2016, 07, 15, 10, 35), y: 155 },
//        { x: new Date(2016, 07, 15, 10, 40), y: 180 },
//      ],
//  }
var coinsRatesForChart = {};

let appendRateToCoinsRatesForChart = (coinName, usdRate) => {
  if (!(coinName in coinsRatesForChart)) {
    coinsRatesForChart[coinName] = [];
  }
  coinsRatesForChart[coinName].push({ time: new Date(), usdRate: usdRate });
};

function hideModal() {
  $("#myModal").modal("hide");
}

// dict_toggleButtonsStates is a dictionary which contains keys-values as follows:  <toggleButtonId>, <check state>
let dict_toggleButtonsStates = {};

let dict_toggleButtonsStates_as_obj_from_localStorage = localStorage.getItem(
  "dict_toggleButtonsStates"
);
if (dict_toggleButtonsStates_as_obj_from_localStorage == null) {
  dict_toggleButtonsStates = {};
} else {
  dict_toggleButtonsStates = JSON.parse(
    dict_toggleButtonsStates_as_obj_from_localStorage
  );
}

// This dictionary saves the changes of each toggle-button
// in the modal.  Only when user clicks on the "Save" button
// the changes in dict_modal_toggleButtonsStates are updated into
// the dict_toggleButtonsStates.
let dict_modal_toggleButtonsStates = {};

const buildCoinsRatesUrl = (coinsSymbols) => {
  let coinsRatesUrlWithQueryString = coinsRatesBaseUrl + "?fsyms=";
  coinsSymbols.forEach((coinName, index) => {
    if (index != 0) {
      coinsRatesUrlWithQueryString += ",";
    }
    coinsRatesUrlWithQueryString += coinName;
  });
  coinsRatesUrlWithQueryString += "&tsyms=USD";
  return coinsRatesUrlWithQueryString;
};

// Example of url we query: "https://min-api.cryptocompare.com/data/pricemulti?fsyms=BTC,ETH&tsyms=USD,EUR"
// Returns for example: {USD:{USD:1},EUR:{USD:1.102},PEN:{USD:0.2626}}
const getCoinsRates = async (coinsSymbols) => {
  if (!coinsSymbols || coinsSymbols.length == 0) {
    return;
  }

  let coinsRatesUrlWithQueryString = buildCoinsRatesUrl(coinsSymbols);
  coinsRatesResponse = await $.get(coinsRatesUrlWithQueryString);

  coinsRatesFromServer = coinsRatesResponse;
};

// =====================================================================================================
// Example which shows that server doesn't have rate information about all the coins that we display:
//https://min-api.cryptocompare.com/data/pricemulti?fsyms=BTC,ETH,COW&tsyms=USD
// response: {"BTC":{"USD":29544.77},"ETH":{"USD":1915.46},"COW":{"USD":0.07623}}
//
//https://min-api.cryptocompare.com/data/pricemulti?fsyms=BZZONE,BZRX,BZET&tsyms=USD
// response: {"BZZONE":{"USD":0.1},"BZRX":{"USD":0.2645}}
// ======================================================================================================

$(async () => {
  setInterval(() => {
    getCoinsRates(coinsSymbolsForReport);
    Object.keys(coinsRatesFromServer).forEach((fieldName) =>
      appendRateToCoinsRatesForChart(
        fieldName,
        coinsRatesFromServer[fieldName].USD
      )
    );
    if (chartIsDisplayed) {
      createChart();
    }
  }, 2000);

  data = await $.get(coinsListUrl);
  coins100 = data.slice(1600, 1700);
  // all coins to append
  $("#cardsInsert").html("");
  $("#cardsInsert").append(coinCards());

  // Toggle
  $(".toggleCoin").on("change", async function () {
    let countChecked = $(".toggleCoin:checked").length;

    if ($(this).is(":checked") == false) {
      setTimeout(hideModal, 500);
    }

    dict_toggleButtonsStates[$(this).attr("id")] = $(this).is(":checked");
    localStorage.setItem(
      "dict_toggleButtonsStates",
      JSON.stringify(dict_toggleButtonsStates)
    );

    coinsSymbolsForReport = Object.keys(dict_toggleButtonsStates)
      .filter((toggleId) => dict_toggleButtonsStates[toggleId] == true)
      .map((toggleIdOfToggleOn) =>
        toggleIdOfToggleOn.substring("toggle-".length)
      )
      .map((cardId) => coins100.filter((card) => card.id == cardId))
      .map(([card]) => card.symbol.toUpperCase());

    if (countChecked > 5) {
      // For now set the CHECKED state of the current toggle-button to OFF
      $(this).prop("checked", false);

      dict_toggleButtonsStates[`${$(this).attr("id")}`] = false;
      localStorage.setItem(
        "dict_toggleButtonsStates",
        JSON.stringify(dict_toggleButtonsStates)
      );

      // Show the modal
      $("#myModal").modal("show");

      $("#myModal").on("shown.bs.modal", function () {
        // When the modal is closed, append the checked cards back to the main page
        $("#myModal").on("hidden.bs.modal", function () {
          checkedCards.insertAfter(
            $("#cardsInsert").children().eq(checkedCards.index())
          );
        });

        // Fill the toggle-button that are checked into the modal
        let checkedCards = $("div.col .toggleCoin:checked").parents("div.col");
        checkedCards.detach();
        $("#myToggles").html(checkedCards);

        // Add click event listener to "More Info" buttons inside the modal
        $(".modal-body").on("click", "a[name]", async function () {
          let name = this.name;
          let linkData = `https://api.coingecko.com/api/v3/coins/${name}`;
          // Your code for handling the "More Info" button click event goes here
          $(`#${name}`).append(`
            <div class="progress" role="progressbar" aria-label="Success striped example" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">
                <div class="progress-bar progress-bar-striped bg-success" style="width: 0%"></div>
            </div><br>
        `);
          let collapserData = await $.get(linkData);
          $(`#${name} .progress-bar`).css("width", "100%");
          $(`#${name} .progress-bar`).attr("aria-valuenow", 100);
          $(`#${name}`).html(`
            <img src="${collapserData.image.large}" /><br />
            <span>Currency Prices In USD-${collapserData.market_data.current_price.usd}&#36;</span><hr>
            <span>Currency Prices In EUR-${collapserData.market_data.current_price.eur}&#128;</span><hr>
            <span>Currency Prices In ILS-${collapserData.market_data.current_price.ils}&#8362;</span><hr>
        `);
          setTimeout(function () {
            $(`#${name} .progress`).hide();
          }, 1000);
        });
      });
    }
  });

  // More Info button

  $("#cardsInsert").on("click", "a[name]", async function () {
    let name = this.name;
    let linkData = `https://api.coingecko.com/api/v3/coins/${name}`;
    let cache = await caches.open("myCache");
    let cacheData = await cache.match(linkData);
    if (cacheData) {
      let cacheResponse = await cacheData.json();
      let currentTime = new Date().getTime();
      let cacheTime = new Date(cacheResponse.timestamp).getTime();
      // Check if 2 minutes have passed
      if (currentTime - cacheTime < 120000) {
        // If less than 2 minutes have passed, retrieve data from cache
        $(`#${name}`).html(`
                <img src="${cacheResponse.image.large}" /><br />
                <span>Currency Prices In USD-${cacheResponse.market_data.current_price.usd}&#36;</span><hr>
                <span>Currency Prices In EUR-${cacheResponse.market_data.current_price.eur}&#128;</span><hr>
                <span>Currency Prices In ILS-${cacheResponse.market_data.current_price.ils}&#8362;</span><hr>
            `);
      } else {
        // If 2 minutes or more have passed, fetch data from API and update cache
        await fetchAndUpdateData(name, linkData, cache);
      }
    } else {
      // If data doesn't exist in cache, fetch data from API and store in cache
      await fetchAndUpdateData(name, linkData, cache);
    }
  });

  async function fetchAndUpdateData(name, linkData, cache) {
    $(`#${name}`).append(`
        <div class="progress" role="progressbar" aria-label="Success striped example" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">
            <div class="progress-bar progress-bar-striped bg-success" style="width: 0%"></div>
        </div><br>
    `);
    let collapserData = await $.get(linkData);
    $(`#${name} .progress-bar`).css("width", "100%");
    $(`#${name} .progress-bar`).attr("aria-valuenow", 100);
    $(`#${name}`).append(`
        <img src="${collapserData.image.large}" /><br />
        <span>Currency Prices In USD-${collapserData.market_data.current_price.usd}&#36;</span><hr>
        <span>Currency Prices In EUR-${collapserData.market_data.current_price.eur}&#128;</span><hr>
        <span>Currency Prices In ILS-${collapserData.market_data.current_price.ils}&#8362;</span><hr>
    `);
    let response = new Response(
      JSON.stringify({ ...collapserData, timestamp: new Date() })
    );
    cache.put(linkData, response);
    setTimeout(function () {
      $(`#${name}.progress`).hide();
    }, 1000);
  }
});

// ALLCOINS Main Page:
const coinCards = () => {
  let result = "";
  coins100.map((item) => {
    result += `  <div class="col">
    <div class="card">
      <div class="card-body">
        <div class="form-check form-switch float-end">
          <input
            class="form-check-input toggleCoin"
            type="checkbox"
            role="switch"
            id="toggle-${item.id}" ${
      dict_toggleButtonsStates[`toggle-${item.id}`] &&
      dict_toggleButtonsStates[`toggle-${item.id}`] == true
        ? "checked"
        : ""
    }
          />
          <label
            class="form-check-label"
            for="toggle-${item.id}"
          ></label>
        </div>
        <h2 class="card-title">${item.symbol.toUpperCase()}</h2>

        <br />
        <h5 class="card-title">${item.id}</h5>
        <br />
        <a
        class="btn btn-primary"
        data-bs-toggle="collapse"
        href="#${item.id}"
        name="${item.id}"
        role="button"
        aria-expanded="false"
        aria-controls="collapseExample"
        >More Info</a
      >
      <div class="collapse card card-body collapseStyle" id="${item.id}">
     
  
  
  
      
      </div>
    </div>
  </div>
</div>`;
  });
  return result;
};

// Nav Search :
$("form").submit(() => {
  const searchString = $("#searchInput").val();
  $("#cardsInsert").html(getCoins(searchString));

  $(".toggleCoin").on("change", function () {
    dict_toggleButtonsStates[$(this).attr("id")] = $(this).is(":checked");
    localStorage.setItem(
      "dict_toggleButtonsStates",
      JSON.stringify(dict_toggleButtonsStates)
    );

    let countCheckedToggleButtons = Object.entries(
      dict_toggleButtonsStates
    ).filter(([key, value]) => value == true).length;

    if (countCheckedToggleButtons > 5) {
      // Uncheck the last checked toggle card
      $(this).prop("checked", false);
      // Alert the user that they can only choose 5 toggle cards
      alert("You can only choose up to 5 Coin Cards.");
    }
  });

  return false;
});

const getCoins = () => {
  const searchString = $("#searchInput").val().toUpperCase();
  let result = "";
  coins100
    .filter((item) => item.symbol.toUpperCase() === searchString)
    .map((item) => {
      result += `  <div class="col">
        <div class="card">
          <div class="card-body">
            <div class="form-check form-switch float-end">
              <input
                class="form-check-input toggleCoin"
                type="checkbox"
                role="switch"
                id="toggle-${item.id}" ${
        dict_toggleButtonsStates[`toggle-${item.id}`] &&
        dict_toggleButtonsStates[`toggle-${item.id}`] == true
          ? "checked"
          : ""
      }
              />
              <label
                class="form-check-label"
                for="toggle-${item.id}"
              ></label>
            </div>
            <h2 class="card-title">${item.symbol.toUpperCase()}</h2>

            <br />
            <h5 class="card-title">${item.id}</h5>
            <br />
            <a
            class="btn btn-primary"
            data-bs-toggle="collapse"
            href="#${item.id}"
            name="${item.id}"
            role="button"
            aria-expanded="false"
            aria-controls="collapseExample"
            >More Info</a
          >
          <div class="collapse card card-body collapseStyle" id="${item.id}">

          </div>
        </div>
      </div>
    </div>`;
    });
  return result;
};

const toggleDataSeries = (e) => {
  if (typeof e.dataSeries.visible === "undefined" || e.dataSeries.visible) {
    e.dataSeries.visible = false;
  } else {
    e.dataSeries.visible = true;
  }
  e.chart.render();
};

const createChart = () => {
  if (!chartIsDisplayed) {
    return;
  }

  let dataForChart = [];
  Object.keys(coinsRatesForChart).forEach((coinName) => {
    dataForChart.push({
      type: "spline",
      name: coinName,
      //axisYType: "secondary",
      showInLegend: true,
      xValueFormatString: "HH:MM",
      yValueFormatString: "$#,##0.#",
      // dataPoints: [
      //   { x: new Date(2016, 07, 15, 10, 30), y: 130 },
      //   { x: new Date(2016, 07, 15, 10, 35), y: 170 },
      // ],
      dataPoints: coinsRatesForChart[coinName].map((item) => ({
        x: item["time"],
        y: item.usdRate,
      })),
    });
  });

  var options = {
    exportEnabled: true,
    animationEnabled: true,
    title: {
      text: "Coins rates",
    },
    subtitles: [
      {
        text: "Click Legend to Hide or Unhide Data Series",
      },
    ],
    axisX: {
      title: "Coins",
    },
    axisY: {
      title: "Coin Value",
      titleFontColor: "#4F81BC",
      lineColor: "#4F81BC",
      labelFontColor: "#4F81BC",
      tickColor: "#4F81BC",
    },
    // axisY2: {
    //   title: "cow",
    //   titleFontColor: "#C0504E",
    //   lineColor: "#C0504E",
    //   labelFontColor: "#C0504E",
    //   tickColor: "#C0504E",
    // },
    toolTip: {
      shared: true,
    },
    legend: {
      cursor: "pointer",
      itemclick: toggleDataSeries,
    },
    // data: [
    //   {
    //     type: "spline",
    //     name: "eur",
    //     //axisYType: "secondary",
    //     showInLegend: true,
    //     xValueFormatString: "HH:MM",
    //     yValueFormatString: "$#,##0.#",
    //     // dataPoints: [
    //     //   { x: new Date(2016, 07, 15, 10, 30), y: 130 },
    //     //   { x: new Date(2016, 07, 15, 10, 35), y: 170 },
    //     // ],
    //     dataPoints: coinsRatesForChart["eur"],
    //   },
    //   {
    //     type: "spline",
    //     name: "cat",
    //     //axisYType: "secondary",
    //     showInLegend: true,
    //     xValueFormatString: "HH:MM",
    //     yValueFormatString: "$#,##0.#",
    //     dataPoints: coinsRatesForChart["cat"],
    //   },

    // ],

    data: dataForChart,
  };
  $("#chartContainer").CanvasJSChart(options);
};

// Nav Live Reports page:
$("#liveReports").on("click", () => {
  chartIsDisplayed = true;
  $("#cardsInsert").html("");
  $("#cardsInsert").append(makeLiveReports());
  //createChart();
});

const makeLiveReports = () => {
  let result = "";
  result += `
  <div id="chartContainer" style="height: 370px; width: 100%;"></div>
`;
  return result;
};

// Nav About page:
$("#aboutClick").on("click", () => {
  $("#cardsInsert").html("");
  $("#cardsInsert").append(makeAbout());
});

const makeAbout = () => {
  let result = "";
  result += `
  <div class="aboutStyle">
  <br><br>
<h1>Crypto API Project</h1>
<p>This crypto project is a single page that provides information and reports from the virtual trading world. The world of virtual trade has become very popular in recent years, at the same time a variety of API'S have been created that provide free information (usually with a one-time registration) about the state of the currencies, price, history, sale, purchase, etc. The application I built is a client-side application only that contains calls to API's Various. All information is saved exclusively on the client side, there is no information that requires saving in the backend & database</p>
<br><br>
<p>This project has the following topics implemented:  HTML + CSS - New HTML5 tags - CSS3 media queries and advanced selectors - Dynamic page layouts - Bootstrap & flex  JavaScript - Objects - Callbacks, Promises, Async Await - jQuery - Single page application basics - Events - Ajax (RESTful API) - Documentation  External APIs</p>
<hr>
<h4>Asaf Nahmias<br>Programming Languages :</h4>
<span>
HTML |
CSS |
JAVASCRIPT |
JQUERY </span><br><br>
<h4>Personal Details :</h4>
<span>Lives in Tirat Hakarmel, Israel <br>
Married to Sapir, <br>
Age - 32 Years Old, <br>
Programming Study Institutes : <br> <b>John Bryce | Udemy</b>
</span><br><br>
<img
src="img/asaf.jpg"
class="asafImg"
/>
</div>
`;
  return result;
};
