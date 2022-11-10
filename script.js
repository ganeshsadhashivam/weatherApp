const API_KEY ="0973e06d73e213acbe67f6c93d7765d9";


const DAYS_OF_THE_WEEK = ["sun","mon","tue","wed","thu","fri","sat"];


let selectedCityText;

let selectedCity;




const getCitiesUsingGeoLocation = async(searchText)=>{

 const response =   await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${searchText}&limit=5&appid=${API_KEY}`);
 
 
    return response.json();

}

const getCurrentWeatherData = async({lat,lon,name:city})=>{

    //ternery condition
    const url = lat&&lon? `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`:`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
    const response = await fetch(url);
    return response.json();

}

const getHourlyForeCast = async ({name :city})=>{

   const response = await  fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}`);

   const data  = await response.json();
   console.log(data);
   return data.list.map(forecast =>{

    const {main:{temp,temp_max,temp_min},dt,dt_txt,weather:[{description,icon}]} = forecast;
    
    return {temp,temp_max,temp_min,dt,dt_txt,description,icon}


})

}


const formatTemperature = (temp) => `${temp?.toFixed(1)}°`

const createIconUrl = (icon) => `http://openweathermap.org/img/wn/${icon}@2x.png`

const loadCurrentForeCast = ({name,main:{temp,temp_min,temp_max},weather:[{description}]})=>{


   const currentForCastElement =  document.querySelector("#current-forecast");
    currentForCastElement.querySelector(".city").textContent = name;
    currentForCastElement.querySelector(".temp").textContent = formatTemperature(temp);
    currentForCastElement.querySelector(".description").textContent = description;
    currentForCastElement.querySelector(".min-max-temp").textContent = `H: ${formatTemperature(temp_max)} L: ${formatTemperature(temp_min)}`;
}


// <h1>City names</h1>
// <p class="temp">Temp</p>
// <p class="description">Descripton</p>
// <p class="min-max-temp">High Low</p>

const loadHourlyForeCast = ({main:{temp:tempNow},weather:[{icon:iconNow}]},hourlyForeCast) =>{
    console.log(hourlyForeCast);
   
    const timeFormatter = Intl.DateTimeFormat("en",{
        hour12:true,hour:"numeric"
    })

    let dataOfTwelveHours = hourlyForeCast.slice(2,14);//12 entries

    const hourlyContainer = document.querySelector(".hourly-container");

    let innerHTMLString = 
    
    `<article>
        <h3 class="time">Now</h3>
        <img class="icon"src="${createIconUrl(iconNow)}" alt="">
        <p class="hourly-temp">${formatTemperature(tempNow)}</p>
    </article>`


    for(let {temp,icon,dt_txt} of dataOfTwelveHours){

        // console.log(temp)
        // console.log(icon)
        // console.log(dt_txt)
        /*in this case i forget to add shothand operator + */
        innerHTMLString +=`<article>
                        <h3 class="time">${timeFormatter.format(new Date(dt_txt))}</h3>
                        <img class="icon"src="${createIconUrl(icon)}" alt="">
                        <p class="hourly-temp">${formatTemperature(temperatureKelvinToCelcius(temp))}</p>
                       </article>`
    }

    hourlyContainer.innerHTML = innerHTMLString
}




calculateDayWiseForeCast = (hourlyForeCast)=>{
    let dayWiseForeCast = new Map();
    for(let forecast of hourlyForeCast){
        const [date] = forecast.dt_txt.split(" ");
        const dayOfTheWeek = DAYS_OF_THE_WEEK[new Date(date).getDay()];
        console.log(dayOfTheWeek);
        if(dayWiseForeCast.has(dayOfTheWeek)){

            let foreCastForTheDay = dayWiseForeCast.get(dayOfTheWeek);
            foreCastForTheDay.push(forecast);
            dayWiseForeCast.set(dayOfTheWeek,[forecast]);

        } else{

            dayWiseForeCast.set(dayOfTheWeek,[forecast]);

        }
    }
    console.log(dayWiseForeCast);

     for(let [key,value] of dayWiseForeCast){
       
        let minTemp = Array.from(value, val =>val.temp_min)
        let maxTemp = Array.from(value, val =>val.temp_max);

        console.log(minTemp);

        dayWiseForeCast.set(key,{minTemp,maxTemp,icon:value.find(v=>v.icon).icon})
     }


     console.log(dayWiseForeCast);
     return dayWiseForeCast;
}


const temperatureKelvinToCelcius = (temp)=>{
    let celcius = temp-273.15;
    return celcius;
}


const loadFiveDayForeCast = (hourlyForeCast)=>{

    const dayWiseForeCast = calculateDayWiseForeCast(hourlyForeCast);

    const container = document.querySelector(".five-day-forecast-container");

    let dayWiseInfo = "";

    Array.from(dayWiseForeCast).map(([day,{maxTemp,minTemp,icon}],index)=>{

    if(index < 5){
       dayWiseInfo+=`
        <article class="day-wise-forecast">
            <h3 class="day">${index === 0?"Today":day}</h3>
            <img class="icon" src="${createIconUrl(icon)}" alt="icon for the forecast">
            <p class="min-temp">${formatTemperature(temperatureKelvinToCelcius(maxTemp))}</p>
            <p class="max-temp">${formatTemperature(temperatureKelvinToCelcius(minTemp))}</p>
        </article>`;
    }
    })

    container.innerHTML = dayWiseInfo;
}








const loadFeelsLike = ({main:{feels_like}})=>{

    const container = document.querySelector("#feels-like");
    container.querySelector(".feels-like-temp").textContent = formatTemperature(feels_like);
}


const loadHumidity = ({main:{humidity}})=>{

    const humidityContainer = document.querySelector("#humidity");

    humidityContainer.querySelector(".humidity-value").textContent = `${humidity}%`;
}




const onSelectedCity = (event) =>{

    selectedCity = event.target.value;
    console.log(selectedCity)
    let options = document.querySelectorAll("#cities > option");
    console.log(options)
    if(options?.length){
      
        let selectedOptions = Array.from(options).find(opt => opt.value === selectedCity);
        console.log(selectedOptions)
        selectedCity = JSON.parse(selectedOptions.getAttribute("data-city-details"));
        console.log(selectedCity);
        
        loadData();
    }

}






//when we are typing in search for every input character seach request will go 
//so to avoid that debounch 

function debounce(func){
    let timer;
    return(...args )=>{
        clearTimeout(timer); // clear existing timer
        //creates a new timer
        console.log("debounce")
        timer = setTimeout(()=>{
            func.apply(this,args);
        },500);
    }
}


const onSearchChange = async (event)=>{

    let {value} = event.target;
    if(!value){

        selectedCity = null;
        selectedCityText = "";
    }

    if(value && (selectedCityText !== value)){

        const listOfCities = await getCitiesUsingGeoLocation(value);
     
        let options = "";
        for(let{lat,lon,name,state,country} of listOfCities){
     
             options +=` <option data-city-details=${JSON.stringify({lat,lon,name})} value=${name},${state},${country}></option>`
        }
     
        document.querySelector("#cities").innerHTML = options;
        console.log(listOfCities);
    }


}

const debounceSearch = debounce((event)=> onSearchChange(event))


const loadData = async ()=>{
    const currentWeather = await getCurrentWeatherData(selectedCity);

    console.log(currentWeather)
    loadCurrentForeCast(currentWeather);
   
    const hourlyForeCast = await getHourlyForeCast(currentWeather);
   
    loadHourlyForeCast(currentWeather,hourlyForeCast)
   
    loadFiveDayForeCast(hourlyForeCast)
   
    loadFeelsLike(currentWeather);
   
    loadHumidity(currentWeather);
}


//load  forecast using geolocationAPI

const loadForeCastUsingGeoLoaction = () =>{

    navigator.geolocation.getCurrentPosition(({coords}) =>{

        const {latitude:lat,longitude:lon} = coords;

        selectedCity = {lat,lon};

        loadData();

    },error =>console.log(error))
}

document.addEventListener("DOMContentLoaded",async ()=>{

//load forecast using geo location

loadForeCastUsingGeoLoaction();


const searchInput = document.querySelector("#search");
searchInput.addEventListener("input",debounceSearch);
searchInput.addEventListener("change",onSelectedCity)

// console.log(searchInput)



 
})