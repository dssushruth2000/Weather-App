document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('locationForm');
  form.addEventListener('submit', function (e) {
      e.preventDefault();
      const locationType = document.querySelector('input[name="locationType"]:checked').value;
      const locationValue = document.getElementById('locationInput').value.trim();

      const { isValid, message } = validateInput(locationType, locationValue);
      if (!isValid) {
          displayError(message);
          return;
      }

      getWeather(locationType, locationValue);
  });
});

async function getWeather(locationType, locationValue) {
    const apiKey = 'ENTER YOU API KEY';
    let url = 'https://api.openweathermap.org/data/2.5/forecast?';
    if (locationType === 'city') {
        url += `q=${locationValue}`;
    } else if (locationType === 'zip') {
        url += `zip=${locationValue}`;
    } else if (locationType === 'coords') {
        const [lat, lon] = locationValue.split(',');
        url += `lat=${lat}&lon=${lon}`;
    }
    url += `&appid=${apiKey}&units=metric`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (response.ok) {
            displayForecast(data);
        } else {
            displayError(data.message);
        }
    } catch (error) {
        displayError('An error occurred while fetching the data.');
    }
}

function displayForecast(data) {
    const resultContainer = document.getElementById('forecastResult');
    resultContainer.innerHTML = '';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const relevantForecasts = data.list.filter(forecast => {
        const forecastDate = new Date(forecast.dt * 1000);
        return forecastDate > today;
    });

    const nextThreeDays = [];
    relevantForecasts.forEach(forecast => {
        const forecastDate = new Date(forecast.dt * 1000);
        if (!nextThreeDays.some(day => day.getDate() === forecastDate.getDate())) {
            nextThreeDays.push(forecastDate);
        }
    });

    const upcomingDays = nextThreeDays.slice(1, 4);

    upcomingDays.forEach(day => {
        const dayForecast = relevantForecasts.filter(forecast => {
            const forecastDate = new Date(forecast.dt * 1000);
            return forecastDate.getDate() === day.getDate();
        });

        const maxTemperature = Math.max(...dayForecast.map(forecast => forecast.main.temp_max));
        const averageCloudCover = dayForecast.reduce((sum, forecast) => sum + forecast.clouds.all, 0) / dayForecast.length;
        const averagePressure = dayForecast.reduce((sum, forecast) => sum + forecast.main.pressure, 0) / dayForecast.length;

        resultContainer.innerHTML += `
            <div class="forecast">
                <h3>${day.toDateString()}</h3>
                <p>Max Temperature: ${maxTemperature.toFixed(2)}°C</p>
                <p>Average Cloud Cover: ${averageCloudCover.toFixed(2)}%</p>
                <p>Average Pressure: ${averagePressure.toFixed(2)} hPa</p>
            </div>
        `;
    });
}


function displayError(message) {
    const resultContainer = document.getElementById('forecastResult');
    resultContainer.innerHTML = `<p class="error">Error: ${message}</p>`;
}

function validateInput(locationType, locationValue) {
    let isValid = true;
    let message = "";

    switch (locationType) {
        case 'city':
            isValid = /^[a-zA-Z\u0080-\u024F\s\/\-\)\(\`\.\"\']+$/.test(locationValue);
            message = isValid ? "" : "Invalid city name";
            break;
        case 'zip':
            isValid = /^\d{5}(-\d{4})?$/.test(locationValue);
            message = isValid ? "" : "Invalid ZIP code";
            break;
        case 'coords':
            const regex = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;
            isValid = regex.test(locationValue);
            if (isValid) {
                const [lat, lon] = locationValue.split(',').map(Number);
                isValid = lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
                message = isValid ? "" : "Latitude must be between -90 and 90 and longitude between -180 and 180.";
            } else {
                message = "Invalid coordinates";
            }
            break;
        default:
            isValid = false;
            message = "Invalid input.";
    }

    return { isValid, message };
}
