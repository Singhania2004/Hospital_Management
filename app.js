
// Initialize the map
const map = L.map('map').setView([28.63, 77.21], 11);

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Function to handle successful location
function onLocationFound(e) {
    L.marker(e.latlng).addTo(map).bindPopup("You are here").openPopup();
    map.setView(e.latlng, 12);
}

// Function to handle location error
function onLocationError(e) {
    alert(e.message);
}

// Add event listeners
map.on('locationfound', onLocationFound);
map.on('locationerror', onLocationError);

// Request the user's location and set the view
map.locate({setView: true, maxZoom: 12});


var customIcon = L.icon({
    iconUrl: './hospital-location-pin-10718.svg',
    iconSize: [38, 95], // size of the icon
    iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
    popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
});




let hospitalCards = {};


function createHospitalCards(hospitals, appointments) {
    const display = document.querySelector('.display');
    hospitals.forEach(hospital => {
        const card = document.createElement('div');
        card.className = 'hospital-card';
        card.innerHTML = `
            <div class="hospital-name">${hospital.name}</div>
            <div class="hospital-info">
                <img src="${hospital.picture}" alt="${hospital.name}" class="hospital-image">
                <div class="hospital-details">
                    <div class="hospital-address">${hospital.address}</div>
                    <div class="hospital-website"><a href="${hospital.website}" target="_blank">${hospital.website}</a></div>
                    <div class="hospital-helpline"><img src="Call.svg" alt="Call" class="call-icon">: ${hospital.helpline}</div>
                </div>
            </div>
            <div class="available-beds-toggle">Available Beds</div>
            <div class="available-beds-info" style="display: none;">
                <p>Available Free Critical Bed (without ventilator): ${hospital.beds['Available Free Critical Bed (without ventilator)'] || 'N/A'}</p>
                <p>Available Free Critical Bed (with ventilator): ${hospital.beds['Available Free Critical Bed (with ventilator)'] || 'N/A'}</p>
                <p>Available Free Non-Critical Bed: ${hospital.beds['Available Free Non-Critical Bed'] || 'N/A'}</p>
            </div>
            <div class="book-appointments-toggle">Book Appointments</div>
            <div class="book-appointments-info" style="display: none;">
                ${createDoctorsList(appointments, hospital.name)}
            </div>
        `;
        display.appendChild(card);
        hospitalCards[hospital.name] = card;

        const bedsToggle = card.querySelector('.available-beds-toggle');
        const bedsInfo = card.querySelector('.available-beds-info');
        bedsToggle.addEventListener('click', () => {
            bedsInfo.style.display = bedsInfo.style.display === 'none' ? 'block' : 'none';
        });

        const appointmentsToggle = card.querySelector('.book-appointments-toggle');
        const appointmentsInfo = card.querySelector('.book-appointments-info');
        appointmentsToggle.addEventListener('click', () => {
            appointmentsInfo.style.display = appointmentsInfo.style.display === 'none' ? 'block' : 'none';
        });
    });
}

function createDoctorsList(appointments, hospitalName) {
    const hospitalAppointments = appointments.find(a => a.name === hospitalName);
    if (!hospitalAppointments) return 'No appointments available';

    return hospitalAppointments.doctors.map(doctor => `
        <div class="doctor-info">
            <span>${doctor.name} - ${doctor.speciality}</span>
            <button class="book-button" onclick="bookAppointment('${hospitalName}', '${doctor.name}')">Book</button>
        </div>
    `).join('');
}

function bookAppointment(hospitalName, doctorName) {
    alert(`Booking appointment with ${doctorName} at ${hospitalName}`);
    // Implement actual booking logic here
}




function moveCardToTop(hospitalName) {
    const display = document.querySelector('.display');
    const card = hospitalCards[hospitalName];
    if (card) {
        display.removeChild(card);
        display.insertBefore(card, display.firstChild);
        card.scrollIntoView({ behavior: 'smooth' });
    }
}




function getHospitals(){
    const dataUrl = './data.json';
    const bedsUrl = './beds.json';
    const appointmentsUrl = './appointment.json';

    Promise.all([
        fetch(dataUrl).then(response => response.json()),
        fetch(bedsUrl).then(response => response.json()),
        fetch(appointmentsUrl).then(response => response.json())
    ])
    .then(([data, bedsData, appointmentsData]) => {
        const bedsByHospital = Object.fromEntries(bedsData.Beds.map(bed => [bed.name, bed]));
        
        data.hospitals.forEach(hospital => {
            hospital.beds = bedsByHospital[hospital.name] || {};
            L.marker([hospital.latitude, hospital.longitude], {icon: customIcon})
                    .addTo(map)
                    .bindPopup(hospital.name)
                    .on('click', function() {
                        moveCardToTop(hospital.name);
                    });
        });
        createHospitalCards(data.hospitals, appointmentsData.appointments);
    })
    .catch(error => {
        console.error('Error fetching JSON:', error);
    });
}



getHospitals()
