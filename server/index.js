const express = require('express');
const app = express();
const port = 5000;
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const sample = require('./samples/sample');
const amenitiesSample = require('./samples/amenitiesSample');
const webScrapingApiClient = require('webscrapingapi');
const dotenv = require('dotenv');
const morgan = require('morgan');
const {
  getElementByText,
  getElementByExactText,
  getElementByAttributeValue,
} = require('./utilis/parsingMethods');
const { getPage } = require('./utilis/webScrapingApi');
const reviewFeatures = require('./constants/reviewFeatures');

app.use(express.json());
dotenv.config();
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const airBnbListing = 'https://www.airbnb.com/rooms/661558087126699190';

app.post('/api/airbnb', (req, res) => {
  setTimeout(() => {
    res.send({
      submittedUrl: req.body.url,
      platform: 'airbnb',
    });
  }, 3000);
});

// -----------------------------------------------------------
// Web Scraping API
// -----------------------------------------------------------

app.get('/web-scraping-api', async (req, res) => {
  const client = new webScrapingApiClient(process.env.WEB_SCRAPING_KEY);

  const response = await getPage(client, airBnbListing);
  // uncomment this line to use sample data
  // const response = {
  //   success: true,
  // };

  if (response.success) {
    const dom = new JSDOM(response.response.data);

    // uncomment this line to use sample data
    // const dom = new JSDOM(sample);

    const liElements = dom.window.document.querySelectorAll('li');
    const divElements = dom.window.document.querySelectorAll('div');
    const spanElements = dom.window.document.querySelectorAll('span');

    // response rate
    const responseText = getElementByText('Response rate', liElements)
      .textContent;
    const responseRate = responseText.split('Response rate: ')[1];

    // description
    const descriptionText = getElementByAttributeValue(
      divElements,
      'description'
    ).textContent;

    // Amenities

    // const amenitiesResponse = await getPage(
    //   client,
    //   `${airBnbListing}/amenities`
    // );

    const amenitiesResponse = {
      success: true,
    };
    let amenitiesList = [];
    if (amenitiesResponse.success) {
      // const dom = new JSDOM(amenitiesResponse.response.data);

      const dom = new JSDOM(amenitiesSample);

      // get amenities H2
      const h2Elements = dom.window.document.querySelectorAll('h2');
      const amenitiesH2 = getElementByText(
        'What this place offers',
        h2Elements
      );

      // find the right section that has a amenities H2
      const sectionElements = dom.window.document.querySelectorAll('section');
      const sectionArr = Array.from(sectionElements);
      const sectionIndex = sectionArr.findIndex(
        (section) =>
          section.textContent.includes(amenitiesH2.textContent) &&
          !section.textContent.includes('Show all')
      );

      const amenitiesDivs = sectionArr[sectionIndex].querySelectorAll('div');
      amenitiesDivs.forEach((div) => {
        if (div.className === '_vzrbjl') {
          amenitiesList.push(div.textContent);
        }
      });

      // TODO: create a hard coded array of strings with amenities and compare to content on the page to get final amenity list
    }

    // Reviews
    const reviewText = getElementByText('reviews', spanElements).textContent;
    const reviewNumber = parseInt(
      reviewText.split(' ·')[1].split('reviews')[0]
    );
    const reviewRating = parseFloat(reviewText.split(' ·')[0]);

    //select all divs in a section that has an h2 with 'reviews' as textcontent

    // get reviews H2
    const h2Elements = dom.window.document.querySelectorAll('h2');
    const reviewsH2 = getElementByText('reviews', h2Elements);

    // find the right section that has a review H2
    const sectionElements = dom.window.document.querySelectorAll('section');
    const sectionArr = Array.from(sectionElements);
    const sectionIndex = sectionArr.findIndex((section) =>
      section.textContent.includes(reviewsH2.textContent)
    );

    // get all divs from reviews section
    const reviewDivs = sectionArr[sectionIndex].querySelectorAll('div');

    const divArr = Array.from(reviewDivs);
    const reviewFeatureScore = {};

    reviewFeatures.forEach((feature) => {
      const reviewFeatureDiv = getElementByExactText(feature, divElements)
        .outerHTML;
      const index =
        divArr.findIndex((el) => el.outerHTML === reviewFeatureDiv) + 1;

      const featureRating = parseFloat(divArr[index].textContent);

      reviewFeatureScore[feature.toLowerCase()] = featureRating;
    });

    const listingData = {
      responseRate,
      descriptionText,
      reviews: {
        reviewNumber,
        reviewRating,
        ...reviewFeatureScore,
      },
      amenities: [...amenitiesList],
    };

    res.send(listingData);
  } else {
    console.log(response.error);
  }
});

// -----------------------------------------------------------

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
