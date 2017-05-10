var loader = {
  show: function(){
    document.getElementById("loader").style.display = 'block';
  },
  hide: function(){
       document.getElementById("loader").style.display = 'none';
  }
}
// check for Geolocation support
if (navigator.geolocation) {
  loader.show();
 navigator.geolocation.getCurrentPosition(getWeatherConditions, getError, options); 
}
else {
  var err_message = "O no:( Geolocation is not supported for this Browser/OS version.";
  displayError(err);
}

function getWeatherConditions(position) { 
  var latitude = position.coords.latitude;
  var longitude = position.coords.longitude;
   //FOR SF weather: 
  /*var url = "https://api.forecast.io/forecast/1106832f9a4519567ec533f2f2e9e407/37.774929,-122.419416?exclude=minutely,hourly,alerts,flags" 
  */
    var APIKEY = '1106832f9a4519567ec533f2f2e9e407';
    var exclude_block='?exclude=minutely,hourly,alerts,flags';
   var url = "https://api.forecast.io/forecast/" + APIKEY + "/" + latitude + ',' + longitude + exclude_block;
    $.ajax({
      url: url,
      dataType: "jsonp",
      success: function(jsonp) {
        loader.hide();
        //Check that the returned objects contains data
         if (Object.keys(jsonp).length !== 0){
           getCity(jsonp.latitude, jsonp.longitude);
           getCurrent(jsonp.currently, jsonp.daily, getDayByDay);    
        }
      }
  });
}

var conditions = [{},{},{},{}];
//retrieving 4 days worth of data conditions
var DAYS = 4;

//unique for current day
function getCurrent(dataPoint, dataBlock, callback){
  var current = {};
  current.id = 'current';
  current.tempFahrenheit = parseInt(Math.round(dataPoint.temperature)); 
  current.tempCelsius = Math.round(((current.tempFahrenheit - 32) / 1.8));
  current.weather_icon = dataPoint.icon;
  current.summary = dataPoint.summary; 
  conditions[0] = current;
  setCurrent(current);
  callback(dataBlock);
  
  function setCurrent(current){
    var currentCond = document.getElementById("current");
    currentCond.getElementsByClassName("temperature")[0].innerHTML = current.tempFahrenheit + '&deg';
    currentCond.getElementsByClassName("summary")[0].innerHTML = current.summary;
  }       
}

//get  day by day conditions for multiple days
function getDayByDay(dailyBlock){
  var i;
  for(i=0; i<DAYS;i++){
    var daily = dailyBlock.data[i];
    if(conditions[i].id !== "current"){
        conditions[i].id = 'day' + (i+1);
        conditions[i].weather_icon = daily.icon;      
    }
    conditions[i].tempMaxF = parseInt(Math.round(daily.temperatureMax)); 
    conditions[i].tempMaxC = Math.round(((conditions[i].tempMaxF - 32) / 1.8));
    conditions[i].tempMinF = parseInt(Math.round(daily.temperatureMin)); 
    conditions[i].tempMinC = Math.round(((conditions[i].tempMinF - 32) / 1.8));
    var date = new Date(daily.time * 1000);
    conditions[i].weekday = getWeekdayName(date.getDay());
  } 
  setDayByDay();
  setIcons(conditions);
  createEventListeners();

  function setDayByDay(){
    conditions.forEach(function (cond){
      var day = document.getElementById(cond.id); 
      day.getElementsByClassName("maxMinTemp")[0].innerHTML = cond.tempMaxF + '&deg' + '|' + cond.tempMinF + '&deg';

     if(cond.id !== "current"){
        day.getElementsByClassName("weekDay")[0].innerHTML = cond.weekday;
      }  
    });
  }

  function setIcons(conditions){
    var icons = new Skycons();
    conditions.forEach(function (day){
      icons.set(day.id +'_icon', day.weather_icon);
      icons.play();
    });
  }

}

function createEventListeners(){
    document.getElementById('toggleExtraDays').style.visibility = 'visible';
    document.getElementById("toggleExtraDays").addEventListener("click", function(){
    var extraDays = document.getElementById('extraDays');
    var selection = this;
    if(selection.innerHTML === "Show More"){
      selection.innerHTML = 'Show Less'
      extraDays.style.visibility  = 'visible';
    }
    else{
    selection.innerHTML = "Show More";
    extraDays.style.visibility = 'hidden';
    }
  });
 
  $('#toggleTempScale').change(function() {
    var useFarenheit = $(this).prop('checked');
    var deg = '&deg';
    
    conditions.forEach(function(obj){
       var day = document.getElementById(obj.id);
       if (useFarenheit){
         if (obj.id === 'current'){
          day.getElementsByClassName("temperature")[0].innerHTML = obj.tempFahrenheit + deg;
        }
        day.getElementsByClassName("maxMinTemp")[0].innerHTML = obj.tempMaxF + deg + '|' + obj.tempMinF + deg;
       }
      else {
         if (obj.id === 'current'){
           day.getElementsByClassName("temperature")[0].innerHTML = obj.tempCelsius + deg; 
          }
          day.getElementsByClassName("maxMinTemp")[0].innerHTML = obj.tempMaxC + deg + '|' + obj.tempMinC + deg;
      }
    }
   );
  });
}

function getWeekdayName(day){
  var weekday = new Array(7);
    weekday[0] = "Sun";
    weekday[1] = "Mon";
    weekday[2] = "Tue";
    weekday[3] = "Wed";
    weekday[4] = "Thu";
    weekday[5] = "Fri";
    weekday[6] = "Sat";
  return weekday[day];
}

 // retrieves city name using Google Maps Geocoding API
function getCity(lat,long){
    var google_api_url = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + lat + ',' + long;
    $.ajax({
      url: google_api_url,
      dataType: "json",
      success: function(json) {
          var addressComponents = json["results"][0].address_components; //returns an array of objects
          var city = '';
          //If we want to add state and country for future version
          //var state, country = '';
          addressComponents.forEach(function(obj){
            var types = obj["types"];
            if (types.indexOf("locality") !== -1){
              city = obj["long_name"];
            }
            //for future use if we want to get the state and country
            /*else if (types.indexOf("administrative_area_level_1") !== -1){
              state = obj["short_name"];
            }
            else if(types.indexOf("country") !== -1){
               country = obj["short_name"];
            } 
            */  
        });
        document.getElementById("city").innerHTML = city;
    }
   })
 }

function getError(err) {
  var error_message = '';
  switch(err.code) {
        case err.PERMISSION_DENIED:
            err_message = "O no:( Looks like you did not allow your current location to be shared.";
            break;
        case err.POSITION_UNAVAILABLE:
            err_message = "O no:( Location information is unavailable. Try reloading the page.";
            break;
        case err.TIMEOUT:
           err_message =  "O no:( The request timed out. Try reloading the page."
           break;
        case err.UNKNOWN_ERROR:
           err_message = "Oops we don't know what happened:( Try reloading the page."
           break;
  } 
  displayError(err_message); 
}
                
function displayError(err_message){
  document.getElementById("err_message").textContent=err_message;
  document.getElementById("content").style.display = 'none';
  document.getElementById('error').style.display = 'block';
  setRainIcon();

  function setRainIcon(){
    var icons = new Skycons();
    icons.set('error_rain_icon', "rain");
    icons.play();
  }
}

var options = {
  //enableHighAccuracy: true,
  timeout: 10000,
};