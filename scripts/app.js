
(function() {
  'use strict';

  var injectedForecast = {
    key: 'raleigh',
       "list": [
        {
            "dt": 1519333200,
            "main": {
                "temp": 24.3,
                "temp_min": 24.3,
                "temp_max": 26.4,
                "pressure": 1028.95,
                "sea_level": 1041.82,
                "grnd_level": 1028.95,
                "humidity": 54,
                "temp_kf": -2.1
            },
            "weather": [
                {
                    "id": 800,
                    "main": "Clear",
                    "description": "clear sky",
                    "icon": "01d"
                }
            ],
            "clouds": {
                "all": 0
            },
            "wind": {
                "speed": 3.61,
                "deg": 218.504
            },
            "rain": {},
            "sys": {
                "pod": "d"
            },
            "dt_txt": "2018-02-22 21:00:00"
        }],
         "city": {
            "id": 4487042,
            "name": "Raleigh",
            "coord": {
                "lat": 35.7804,
                "lon": -78.6391
            },
            "country": "US",
            "population": 403892
    }
  };

  var weatherAPIUrlBase = 'http://api.openweathermap.org/data/2.5/forecast?appid="Insert the Key"&units=metric&q=';

  var app = {
    isLoading: true,
    visibleCards: {},
    selectedCities: [],
    spinner: document.querySelector('.loader'),
    cardTemplate: document.querySelector('.cardTemplate'),
    container: document.querySelector('.main'),
    addDialog: document.querySelector('.dialog-container')
  };


  /*****************************************************************************
   *
   * Event listeners for UI elements
   *
   ****************************************************************************/

  /* Event listener for refresh button */
  document.getElementById('butRefresh').addEventListener('click', function() {
    app.updateForecasts();
  });

  /* Event listener for add new city button */
  document.getElementById('butAdd').addEventListener('click', function() {
    // Open/show the add new city dialog
    app.toggleAddDialog(true);
  });

  /* Event listener for add city button in add city dialog */
  document.getElementById('butAddCity').addEventListener('click', function() {
    var selected = document.getElementById('selectedCity');
    var key = selected.value;
    app.getForecast(key);
    app.selectedCities.push({key: key});
    app.saveSelectedCities();
    app.toggleAddDialog(false);
  });

  /* Event listener for cancel button in add city dialog */
  document.getElementById('butAddCancel').addEventListener('click', function() {
    app.toggleAddDialog(false);
  });


  /*****************************************************************************
   *
   * Methods to update/refresh the UI
   *
   ****************************************************************************/

  // Toggles the visibility of the add new city dialog.
  app.toggleAddDialog = function(visible) {
    if (visible) {
      app.addDialog.classList.add('dialog-container--visible');
    } else {
      app.addDialog.classList.remove('dialog-container--visible');
    }
  };

  // Updates a weather card with the latest weather forecast. If the card
  // doesn't already exist, it's cloned from the template.
  app.updateForecastCard = function(data) {
    var card = app.visibleCards[data.key];
    if (!card) {
      card = app.cardTemplate.cloneNode(true);
      card.classList.remove('cardTemplate');
      card.querySelector('.location').textContent = data.city.name + ',' + data.city.country ;
      card.removeAttribute('hidden');
      app.container.appendChild(card);
      app.visibleCards[data.key] = card;
    }

    // Verify data is newer than what we already have, if not, bail.
    var dateElem = card.querySelector('.date');
    if (dateElem.getAttribute('data-dt') >= data.list[0].dt) {
      return;
    }

    dateElem.setAttribute('data-dt', data.list[0].dt);
    dateElem.textContent = (new Date(data.list[0].dt * 1000)).toDateString();
    card.querySelector('.description').textContent = data.list[0].weather[0].main;
    var imgIcon = document.createElement("img");
    imgIcon.src = "http://openweathermap.org/img/w/" + data.list[0].weather[0].icon + ".png";  
    card.querySelector('.current .icon').appendChild(imgIcon);
    card.querySelector('.current .temperature .value').textContent =
      Math.round(data.list[0].main.temp);
     card.querySelector('.current .maximum .value').textContent =
      Math.round(data.list[0].main.temp_max);
      card.querySelector('.current .minimum .value').textContent =
      Math.round(data.list[0].main.temp_min);
    card.querySelector('.current .humidity').textContent =
      Math.round(data.list[0].main.humidity) + '%';


    if (app.isLoading) {
      app.spinner.setAttribute('hidden', true);
      app.container.removeAttribute('hidden');
      app.isLoading = false;
    }
  };


  /*****************************************************************************
   *
   * Methods for dealing with the model
   *
   ****************************************************************************/

  // Gets a forecast for a specific city and update the card with the data
  app.getForecast = function(key) {
    var url = weatherAPIUrlBase + key;
    if ('caches' in window) {
      caches.match(url).then(function(response) {
        if (response) {
          response.json().then(function(json) {
            json.key = key;
            app.updateForecastCard(json);
          });
        }
      });
    }
    // Make the XHR to get the data, then update the card
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
      if (request.readyState === XMLHttpRequest.DONE) {
        if (request.status === 200) {
          var response = JSON.parse(request.response);
          response.key = key;
          app.updateForecastCard(response);
        }
      }
    };
    request.open('GET', url);
    request.send();
  };

  // Iterate all of the cards and attempt to get the latest forecast data
  app.updateForecasts = function() {
    var keys = Object.keys(app.visibleCards);
    keys.forEach(function(key) {
      app.getForecast(key);
    });
  };

  app.saveSelectedCities = function() {
    window.localforage.setItem('selectedCities', app.selectedCities);
  };

  document.addEventListener('DOMContentLoaded', function() {
    window.localforage.getItem('selectedCities', function(err, cityList) {
      if (cityList) {
        app.selectedCities = cityList;
        app.selectedCities.forEach(function(city) {
          app.getForecast(city.key);
        });
      } else {
        app.updateForecastCard(injectedForecast);
        app.selectedCities = [
          {key: injectedForecast.key}
        ];
        app.saveSelectedCities();
      }
    });    
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
     .register('/service-worker.js')
     .then(function() { 
        console.log('Service Worker Registered'); 
      });
  }

})();
