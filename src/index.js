// @flow
import http from 'http';
import getOr from 'lodash/fp/getOr';
import moment from 'moment';


const wwoApiKey = '80fe5c09c66f4d389ab191330182705'; // should be environment variable

function callWeatherApi(city: string, date: string, apiKey: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const host = 'api.worldweatheronline.com';
    const path = `${'/premium/v1/weather.ashx?format=json&num_of_days=1&q='}${encodeURIComponent(city)}&key=${apiKey}&date=${date}`;

    http.get({ host, path }, (res) => {
      let body = '';
      res.on('data', (d) => { body += d; });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          const forecast = response.data.weather[0];
          const location = response.data.request[0];
          const conditions = response.data.current_condition[0];
          const currentConditions = conditions.weatherDesc[0].value;

          const output = `Current conditions in the ${location.type} ${location.query} are ${currentConditions} with a projected high of ${forecast.maxtempC}°C or ${forecast.maxtempF}°F and a low of ${forecast.mintempC}°C or ${forecast.mintempF}°F on ${forecast.date}.`;
          resolve(output);
        } catch (e) {
          reject(e);
        }
      });
      res.on('error', () => {
        reject();
      });
    });
  });
}


exports.weather = (req: $Request, res: $Response): Promise<Object> => {
  const city = getOr(null, 'body.queryResult.parameters["geo-city"]')(req);

  const stringDate = getOr(null, 'body.queryResult.parameters.date')(req);
  const momentDate = moment(stringDate, 'YYYY-MM-DDTHH:mm:ssZ', true);

  if (typeof city !== 'string') {
    res.json({ fulfillmentText: 'Could you please tell me for what location you want to know the weather ?' });
    res.end();
  } else if (!momentDate.isValid()) {
    res.json({ fulfillmentText: `Could you please tell me for when you want to know the weather in ${city}` });
    res.end();
  } else {
    return callWeatherApi(city, stringDate, wwoApiKey).then((output) => {
      res.json({ fulfillmentText: output });
    }).catch(() => {
      res.json({ fulfillmentText: getOr('I don\'t know the weather but I hope it\'s good!', 'body.queryResult.fulfillmentText')(req) });
    });
  }
  return new Promise(() => {});
};
