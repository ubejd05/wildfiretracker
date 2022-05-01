const apiKey = 'I5OkEk4QrssWROnjJ544AXGHONApeSq2iviRTEbe';
// const days = 200;


async function getEvents() {
  const response = await fetch(`https://eonet.sci.gsfc.nasa.gov/api/v2.1/categories/8?status=open`);
  const responseData = await response.json();
  const events = responseData.events;
  const wildfireEvents = [];

  events.forEach(event => {
    // if (event.categories[0].id === 8) {
      wildfireEvents.push(event)
    // }
  });

  setCoordinates(wildfireEvents)
}



// This function is just to format the data in a way that mapbox understands
async function setCoordinates(wildEvents) {
  let data = {
    "type": 'FeatureCollection',
    "features": [],
  } 
  

  let events = wildEvents;
  // console.log(events);
  events.forEach((event) => {
    let geometry = {
      "type": "Point",
      "coordinates": []
    };
    geometry.coordinates = event.geometries[0].coordinates;
    // Object.setPrototypeOf(test, {object})
    data.features.push({type: 'Feature', geometry, properties: {}}); 
  });

  renderMap(data)
}


function renderMap(data) {
  console.log(data);
  let object = {
    type: "geojson",
    data: data,
    cluster: true,
    clusterMaxZoom: 14, // Max zoom to cluster points on
    clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
  };
  mapboxgl.accessToken =
    "pk.eyJ1IjoidWJpMTIzIiwiYSI6ImNrbjAzcW1yMDBqeW0ydnBrY3g1bmF4dGQifQ.RzVYxko64eFrxMDequGUlA";
  const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v10",
    center: [-103.5917, 40.6699],
    zoom: 1,
  });
  
  map.on("load", () => {
    // Add a new source from our GeoJSON data and
    // set the 'cluster' option to true. GL-JS will
    // add the point_count property to your source data.
  
    map.addSource("earthquakes", {
      type: 'geojson',
      data: object.data
    });
  
    map.addLayer({
      id: "clusters",
      type: "circle",
      source: "earthquakes",
      filter: ["has", "point_count"],
      paint: {
        // Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
        // with three steps to implement three types of circles:
        //   * Blue, 20px circles when point count is less than 100
        //   * Yellow, 30px circles when point count is between 100 and 750
        //   * Pink, 40px circles when point count is greater than or equal to 750
        "circle-color": [
          "step",
          ["get", "point_count"],
          "#51bbd6",
          100,
          "#f1f075",
          750,
          "#f28cb1",
        ],
        "circle-radius": ["step", ["get", "point_count"], 20, 100, 30, 750, 40],
      },
    });
  
    map.addLayer({
      id: "cluster-count",
      type: "symbol",
      source: "earthquakes",
      filter: ["has", "point_count"],
      layout: {
        "text-field": "{point_count_abbreviated}",
        "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
        "text-size": 12,
      },
    });
  
    map.addLayer({
      id: "unclustered-point",
      type: "circle",
      source: "earthquakes",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": "red",
        "circle-radius": 5,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#fff",
      },
    });
  
    // inspect a cluster on click
    map.on("click", "clusters", (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["clusters"],
      });
      const clusterId = features[0].properties.cluster_id;
      map
        .getSource("earthquakes")
        .getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
  
          map.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom,
          });
        });
    });
  
    // When a click event occurs on a feature in
    // the unclustered-point layer, open a popup at
    // the location of the feature, with
    // description HTML from its properties.
    map.on("click", "unclustered-point", (e) => {
      const coordinates = e.features[0].geometry.coordinates.slice();
      const mag = e.features[0].properties.mag;
      const tsunami = e.features[0].properties.tsunami === 1 ? "yes" : "no";
  
      // Ensure that if the map is zoomed out such that
      // multiple copies of the feature are visible, the
      // popup appears over the copy being pointed to.
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }
  
      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(`magnitude: ${mag}<br>Was there a tsunami?: ${tsunami}`)
        .addTo(map);
    });
  
    map.on("mouseenter", "clusters", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "clusters", () => {
      map.getCanvas().style.cursor = "";
    });
  }); 
}



getEvents();