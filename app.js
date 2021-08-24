const apiKey = 'I5OkEk4QrssWROnjJ544AXGHONApeSq2iviRTEbe';
const days = 200;


async function getEvents() {
  const response = await fetch(`https://eonet.sci.gsfc.nasa.gov/api/v2.1/events?status=open`);
  const responseData = await response.json();
  const events = responseData.events;
  const wildfireEvents = [];

  events.forEach(event => {
    if (event.categories[0].id === 8) {
      wildfireEvents.push(event)
    }
  });

  return wildfireEvents;
}



// This function is just to format the data in a way that mapbox understands
async function setCoordinates() {
  let data = {
    type: 'Feature',
    features: [],
  } 
  

  let events = await getEvents();
  events.forEach((event) => {
    let geometry = {
      coordinates: []
    };
    geometry.coordinates = Object.create(event.geometries[0].coordinates);
    // Object.setPrototypeOf(test, {object})
    data.features.push({geometry}); 
  });

  return JSON.stringify(data);
}

// setCoordinates()
//   .then(data => console.log(data))



// data: {features: [
//   {geometry: {
//     "coordinates": [ 19.368286586, 42.635352272 ]
//     }
//   },
// ]},