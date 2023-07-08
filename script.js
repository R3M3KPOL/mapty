'use strict';

class Workouts {
    date = new Date();
    id = (Date.now() + '').slice(-10);
    clicks = 0;

    constructor(coords, distance, duration){
        // this.date = ... 
        // this.id = ...
        this.coords = coords; // [lat, lng]
        this.distance = distance; //in km
        this.duration = duration; //in minutes
    }
    _setDescription() {
        
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]}
        ${this.date.getDate()}`
    }

    click() {
        this.clicks++;
    }
}
class Running extends Workouts {
    type = 'running'
    constructor(coords, distance, duration, cadence){
        super(coords, distance, duration)
        this.cadence = cadence;
        this.calcPace()
        this._setDescription()
    }

    calcPace() {
        //minutes to km
        this.pace = this.duration / this.distance ;
        return this.pace
    }
}
class Cycling extends Workouts {  
    type = 'cycling';
    constructor(coords, distance, duration, elevationGain){
    super(coords, distance, duration)
    this.elevationGain = elevationGain;
    // this.type = 'cycling'
    this.calcSpeed()
    this._setDescription()
    }
    calcSpeed() {
        //km to h
        this.speed = this.distance / (this.duration / 60) ;
        return this.speed;
    }
}

const running1 = new Running ([33, -33], 5.5, 24, 175)

// const cycling1 = new Cycling ([33, -33], 23, 95, 175)



/////////////////////////////////////////////////////////////////////////
//APPLICATION ARCHITECTURE

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
    #map;
    #mapZoomLevel = 10
    #mapEvent;
    #workouts = [];
    constructor() {
        this._getPosition();
        //get data from local storage
        this._getLocalStorage();
        form.addEventListener('submit', this._newWorkout.bind(this)
        )
        inputType.addEventListener('change', this._toggleElevationField);
        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this))
    }

    _getPosition(){
        if(navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this),function(){
                alert(`could not get your position`)
            });
        };
    }
    _loadMap(position){
            const {latitude} = position.coords;
            const {longitude} = position.coords;
            const coords = [latitude, longitude]

            this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
                L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.#map);

            this.#map.on('click', this._showForm.bind(this))

             this.#workouts.forEach(work => {
                this._renderWorkout(work);
                this._renderWorkoutMarker(work)
            })
    }
    _showForm(mapE){
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus()

    }
    _hideForm() {
        //empty inputs
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '' ;
        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => form.style.display = 'grid', 1000)
    }
    _toggleElevationField(){
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }
    _newWorkout(e){
        e.preventDefault()

        const validInputs =(...inputs) => {
            return inputs.every(inp => Number.isFinite(inp))
        }

        const allPositive = (...inputs) => inputs.every(inp => inp >= 0);
        
        //get data from form

        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const {lat, lng} =this.#mapEvent.latlng
        let workout;
        
        //if activity running, create running object
        if(type ==='running') {
            const cadence = +inputCadence.value;
            
            //check if data is valid
            if(
                // !Number.isFinite(distance) || 
                // !Number.isFinite(duration) || 
                // !Number.isFinite(cadence))
                !validInputs(distance, duration, cadence) ||
                !allPositive(distance,duration,cadence)
            )
             return alert('Inputs have to be positive numbers!')

            workout = new Running([lat, lng], distance, duration, cadence)
        }
        //if activity cylcing, create cycling object
        if(type ==='cycling') {
            const elevation = +inputElevation.value;
            if(
                // !Number.isFinite(distance) || 
                // !Number.isFinite(duration) || 
                // !Number.isFinite(cadence))
                !validInputs(distance, duration, elevation) ||
                !allPositive(distance,duration)
            )
             return alert('Inputs have to be positive numbers!')
             workout = new Cycling([lat, lng], distance, duration, elevation)
        }
        //add new object to workout array
        this.#workouts.push(workout);
       

        //Render workout on map as marker
          //display marker
        this._renderWorkoutMarker(workout)
       

        //Render workout on the list
          this._renderWorkout(workout)
        //Hide the form + clear input fields


        //clear inputs
        this._hideForm()
    
        //Set local storage to all workouts
        this._setLocalStorage()
    }
    _renderWorkoutMarker(workout, months) {        
        L.marker(workout.coords).addTo(this.#map)
        .bindPopup(L.popup({
            maxWidth: 250,
            minWidth: 100,
            autoClose: false,
            closeOnClick: false,
            className: `${workout.type}-popup`
        }))
        // .setPopupContent(`${workout.type === 'running' ? `🏃‍♂️${workout.description}` : `🚴‍♀️${workout.description} `}`)
        .setPopupContent(`${workout.type === 'running'? `🏃‍♂️${workout.type[0].toUpperCase()}${workout.type.slice(1)} on  `: `🚴‍♀️${workout.type[0].toUpperCase()}${workout.type.slice(1)} on  `}`)
        .openPopup()
        // const date = new Date()
        // const dateString = date.toLocaleDateString()
        // console.log('dateString: ', dateString)
    }

    _renderWorkout(workout){
        let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
            <h2 class="workout__title">${workout.description}</h2>
            <button>x</button>
            <div class="workout__details">
                <span class="workout__icon">${workout.type === 'running'? '🏃‍♂️': '🚴‍♀️'}</span>
                <span class="workout__value">${workout.distance}</span>
                <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⏱</span>
                <span class="workout__value">${workout.duration}</span>
                <span class="workout__unit">min</span>
            </div>
            `
        if(workout.type === 'running') {
        html += `
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.pace.toFixed(1)}</span>
                <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">🦶🏼</span>
                <span class="workout__value">${workout.cadence}</span>
                <span class="workout__unit">spm</span>
            </div>
        </li>
        `;
        }
        if(workout.type === 'cycling') {
            html += `
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.speed.toFixed(1)}</span>
                <span class="workout__unit">km/h</span>
            </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
        `
        }
        form.insertAdjacentHTML('afterend', html)
    }
    _moveToPopup(e) {
        const workoutEl = e.target.closest('.workout');
        if(!workoutEl) return;
        const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id)
        this.#map.setView(workout.coords, this.#mapZoomLevel, {
            animate : true,
            pan: {
                duration: 1,
            }
        } )
        // workout.click();
    }
        _setLocalStorage() {
            localStorage.setItem('workouts', JSON.stringify(this.#workouts));
        }
        _getLocalStorage() {
            const data = JSON.parse(localStorage.getItem('workouts'));
        
            if(!data) return;

            this.#workouts = data;
            this.#workouts.forEach(work => {
                this._renderWorkout(work);
            })
        }


    reset() {
        localStorage.removeItem('workouts')
        location.reload()
    }
}

const app = new App();

