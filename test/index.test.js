// @flow
/* eslint no-underscore-dangle: 0 */
import { weather } from 'index';
import { expect } from 'chai';
import httpMocks from 'node-mocks-http';
import moment from 'moment';

function createRequestMock(parameters: ?Object, fulfillmentText: ?string): httpMocks.request {
  return httpMocks.createRequest({
    body: {
      queryResult: {
        parameters,
        fulfillmentText,
        allRequiredParamsPresent: parameters.date && typeof parameters['geo-city'] === 'string' && moment(parameters.date).isValid(),
      },
    },
  });
}


describe('weather tests', () => {
  describe('format', () => {
    it('should return a fulfillmentText', () => {
      const resMock = httpMocks.createResponse();
      weather({}, resMock);
      const data = JSON.parse(resMock._getData());
      expect(data).to.have.property('fulfillmentText');
    });

    it('should ask for the location if no provided', () => {
      const resMock = httpMocks.createResponse();
      weather(createRequestMock({}), resMock);
      const data = JSON.parse(resMock._getData());
      expect(data.fulfillmentText).to.equal('Could you please tell me for what location you want to know the weather ?');
    });

    it('should ask for the date if no provided', () => {
      const resMock = httpMocks.createResponse();
      weather(createRequestMock({ 'geo-city': 'Paris' }), resMock);
      const data = JSON.parse(resMock._getData());
      expect(data.fulfillmentText).to.equal('Could you please tell me for when you want to know the weather in Paris');
    });

    it('should handle invalid parameters', () => {
      const resMock = httpMocks.createResponse();
      weather(createRequestMock({ date: true, 'geo-city': 0 }), resMock);
      const data = JSON.parse(resMock._getData());
      expect(data).to.have.property('fulfillmentText');
    });
  });

  describe('API call', () => {
    it('should give the weather', () => {
      const resMock = httpMocks.createResponse();
      return weather(createRequestMock({ date: '2018-05-26T12:00:00+02:00', 'geo-city': 'Edinburgh' }), resMock).then(() => {
        const data = JSON.parse(resMock._getData());
        expect(data.fulfillmentText).to.equal('Current conditions in the City Edinburgh, United Kingdom are Partly cloudy with a projected high of 18°C or 65°F and a low of 11°C or 51°F on 2018-05-28.');
      });
    });

    it('should handle bad location', () => {
      const resMock = httpMocks.createResponse();
      return weather(createRequestMock({ date: '2018-05-26T12:00:00+02:00', 'geo-city': ' ' }), resMock).then(() => {
        const data = JSON.parse(resMock._getData());
        expect(data.fulfillmentText).to.equal('I don\'t know the weather but I hope it\'s good!');
      });
    });

    it('should return the provided fulfillmentText', () => {
      const resMock = httpMocks.createResponse();
      return weather(createRequestMock({ date: '2018-05-26T12:00:00+02:00', 'geo-city': ' ' }, 'test'), resMock).then(() => {
        const data = JSON.parse(resMock._getData());
        expect(data.fulfillmentText).to.equal('test');
      });
    });
  });
});
