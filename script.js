// Initialization and DOMContentLoaded Listener
document.addEventListener('DOMContentLoaded', async function () {
    resetInactivityTimeout();
    const mySelect = document.getElementById('PM');
    const mySelect2 = document.getElementById('WL');
    const startDatePicker = document.getElementById('startDatePicker');
    const today = new Date();
    //Format the date to YYYY-MM-DD
    const formattedDate = today.toISOString().split('T')[0];

    // Set the value of the date picker
    startDatePicker.value = formattedDate;


    // Initialize calendar to the start of the current week
    let currentStartDate = adjustToStartOfWeek(new Date());

    // Populate the PM dropdown and update the calendar on initial load
    await populatePMsDropdown(mySelect);
    
    await populateWLsDropdown(mySelect2);
    await updateCalendar(currentStartDate, mySelect.value, mySelect2.value);

    // Update calendar based on PM selection
    mySelect.addEventListener('change', async () => {
        mySelect2.value = "*";
        var PM = mySelect.value;
        sessionStorage.setItem(`dossiers_${PM}`, "");
        await updateCalendar(currentStartDate, mySelect.value, mySelect2.value);
    });
    mySelect2.addEventListener('change', async () => {
        mySelect.value = "*";
        var WL = mySelect2.value;
        sessionStorage.setItem(`dossiers_${WL}`, "");
        await updateCalendar(currentStartDate, mySelect.value, mySelect2.value);
    });

    // Update calendar when a new start date is picked
    startDatePicker.addEventListener('change', async function () {
        var PM = mySelect.value;
        sessionStorage.setItem(`dossiers_${PM}`, "");
        currentStartDate = adjustToStartOfWeek(new Date(this.value));
        await updateCalendar(currentStartDate, mySelect.value);
    });
});
async function updateCalendar(startDate, PM, WL) {
    const stopDate = new Date(startDate);
    stopDate.setDate(startDate.getDate() + 34);
    console.log(startDate, stopDate, PM, WL);
    const apiDossiers = await getDossiers(PM, startDate, stopDate, WL);
    console.log(apiDossiers);
    if (apiDossiers) {
        generateCalendarWithProjects(startDate, apiDossiers);
    }
}
async function populatePMsDropdown(selectElement) {
    const data = await getPMs();
    if (data) {
        const selectedFullName = localStorage.getItem("fullName");
        const option = document.createElement('option');
        option.value = "*";
        option.text = "----------------";
        option.selected=true;
        selectElement.appendChild(option);
        data.response.data.forEach(dossier => {
            const option = document.createElement('option');
            option.value = option.text = dossier.fieldData.voornaam_naam_c;
            
            if (option.value === selectedFullName) {
                option.selected = true;
            }
            selectElement.appendChild(option);
        });
    }
}
async function populateWLsDropdown(selectElement) {
    const data = await getWLs();
    if (data) {
        const selectedFullName = localStorage.getItem("fullName");
        const option = document.createElement('option');
        option.value = "*";
        option.text = "----------------";
        option.selected=true;
        selectElement.appendChild(option);
        data.response.data.forEach(dossier => {
            const option = document.createElement('option');
            option.value = dossier.fieldData._k1_contactPersoon_ID;
            option.text = dossier.fieldData.voornaam_naam_c;
            
            if (option.text === selectedFullName) {
                option.selected = true;
            }
            selectElement.appendChild(option);
        });
    }
}
function openPage() {
    if (localStorage.getItem('userName') && localStorage.getItem('passWord')) {
        //loadDossiers();

    } else {
        document.location.href = 'login-page.html';
    }
}


// Utility Functions
function adjustToStartOfWeek(date) {
    const adjustedDate = new Date(date);
    const dayOfWeek = adjustedDate.getDay();
    const difference = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust for Sunday as 0
    adjustedDate.setDate(adjustedDate.getDate() + difference);
    adjustedDate.setHours(0, 0, 0, 0); // Set time to the start of the day
    return adjustedDate;
}
function setToStartOfDay(date) {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
}
function setToEndOfDay(date) {
    const newDate = new Date(date);
    newDate.setHours(23, 59, 59, 999);
    return newDate;
}


// API Calls and Data Fetching
async function getPMs() {

    const storedPMs = sessionStorage.getItem("PMs");
    if (storedPMs) {
        return JSON.parse(storedPMs);
    }

    var bearerToken = await getBearerToken();
    var myHeaders = new Headers();


    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", "Bearer " + bearerToken);



    var raw = JSON.stringify({
        "query": [
            {
                "contactPersonen::functie": "Project Manager",
                "contactPersonen::flag_personeel": 1
            }
        ]
    });
    //console.log (raw);

    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    try {
        const response = await fetch("https://fms.alterexpo.be/fmi/data/vLatest/databases/Arnout/layouts/Personen_form_details/_find", requestOptions);
        if (!response.ok) {
            throw new Error('Network response was not ok' & response);
        }
        const data = await response.json();
        if (data && data.response && data.response.data && data.response.data.length > 0) {
            sessionStorage.setItem("PMs", JSON.stringify(data));
            return data
        } else {
            //("No data found or error fetching data");
        }

    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
    }


}
async function getWLs(){

    const storedWLs = sessionStorage.getItem("WLs");
    if (storedWLs) {
        return JSON.parse(storedWLs);
    }

    var bearerToken = await getBearerToken();
    var myHeaders = new Headers();


    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", "Bearer " + bearerToken);



    var raw = JSON.stringify({
        "query": [
            {
                "flag_web_werfleider": 1,
                "contactPersonen::flag_personeel": 1
            }
        ]
    });
    //console.log (raw);

    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    try {
        const response = await fetch("https://fms.alterexpo.be/fmi/data/vLatest/databases/Arnout/layouts/Personen_form_details/_find", requestOptions);
        if (!response.ok) {
            throw new Error('Network response was not ok' & response);
        }
        const data = await response.json();
        if (data && data.response && data.response.data && data.response.data.length > 0) {
            sessionStorage.setItem("WLs", JSON.stringify(data));
            return data
        } else {
            //("No data found or error fetching data");
        }

    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
    }



}
async function getDossiers(PM, currentStartDate, stopDate, WL) {
    
        const bearerToken = await getBearerToken();
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Authorization", "Bearer " + bearerToken);
        const fullName = PM;
        var body = await constructRAW(PM, currentStartDate, stopDate, WL);
        console.log("dit is de body die gezonden wordt: " +body)
        
        // Ensure correct format for your API's expectations
        const raw = body;

        const requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: raw,
            redirect: 'follow'
        };

        try {
            const response = await fetch("https://fms.alterexpo.be/fmi/data/vLatest/databases/Arnout/layouts/Dossiers_form_detail/_find", requestOptions);
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            const data = await response.json();
            if (data && data.response && data.response.data && data.response.data.length > 0) {
                sessionStorage.setItem(`dossiers_${PM}`, JSON.stringify(data)); // Corrected dynamic key
                hideErrorMessage();
                return data;
            } else {
                console.log("No data found or error fetching data");
            }
        } catch (error) {
            console.error('There has been a problem with your fetch operation:', error);
            displayErrorMessage('Failed to load project data. Please try again later.');
            clearCalendar(); // Clear the calendar or indicate an error state
        }
        
    }

async function getBearerToken() {

    const username = localStorage.getItem('userName');
    const password = localStorage.getItem('passWord');
    const auth = username + ':' + password;
    const encodedAuth = btoa(auth);

    const url = 'https://fms.alterexpo.be/fmi/data/vLatest/databases/Arnout/sessions';

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + encodedAuth
        }
    };

    const response = await fetch(url, options);

    const data = await response.json();
    const token = data.response.token;

    return token;
}

async function constructRAW(PM,currentStartDate,stopDate,WL){
    if (WL === "*") {
        var body = JSON.stringify({
            "query": [
                {
                    "projectleider1_ae": PM,
                    "dossiers_dossiersdataCreate::datum_van": currentStartDate.toLocaleDateString('en-US') + ".." + stopDate.toLocaleDateString('en-US'),
                    "_k2_dossierStatus_ID": 1
                
                },
                {
                    "projectleider2_ae": PM,
                    "dossiers_dossiersdataCreate::datum_van": currentStartDate.toLocaleDateString('en-US') + ".." + stopDate.toLocaleDateString('en-US'),
                    "_k2_dossierStatus_ID": 1
                },
                {
                    "projectleider1_ae": PM,
                    "dossiers_dossiersdataCreate::datum_van": currentStartDate.toLocaleDateString('en-US') + ".." + stopDate.toLocaleDateString('en-US'),
                    "_k2_dossierStatus_ID": 2
                
                },
                {
                    "projectleider2_ae": PM,
                    "dossiers_dossiersdataCreate::datum_van": currentStartDate.toLocaleDateString('en-US') + ".." + stopDate.toLocaleDateString('en-US'),
                    "_k2_dossierStatus_ID": 2
                },
                {
                    "projectleider1_ae": PM,
                    "dossiers_dossiersdataCreate::datum_van": currentStartDate.toLocaleDateString('en-US') + ".." + stopDate.toLocaleDateString('en-US'),
                    "_k2_dossierStatus_ID": 3
                
                },
                {
                    "projectleider2_ae": PM,
                    "dossiers_dossiersdataCreate::datum_van": currentStartDate.toLocaleDateString('en-US') + ".." + stopDate.toLocaleDateString('en-US'),
                    "_k2_dossierStatus_ID": 3
                },
                {
                    "projectleider1_ae": PM,
                    "dossiers_dossiersdataCreate::datum_van": currentStartDate.toLocaleDateString('en-US') + ".." + stopDate.toLocaleDateString('en-US'),
                    "_k2_dossierStatus_ID": 4
                
                },
                {
                    "projectleider2_ae": PM,
                    "dossiers_dossiersdataCreate::datum_van": currentStartDate.toLocaleDateString('en-US') + ".." + stopDate.toLocaleDateString('en-US'),
                    "_k2_dossierStatus_ID": 4
                },
                {
                    "projectleider1_ae": PM,
                    "dossiers_dossiersdataCreate::datum_van": currentStartDate.toLocaleDateString('en-US') + ".." + stopDate.toLocaleDateString('en-US'),
                    "_k2_dossierStatus_ID": 5
                
                },
                {
                    "projectleider2_ae": PM,
                    "dossiers_dossiersdataCreate::datum_van": currentStartDate.toLocaleDateString('en-US') + ".." + stopDate.toLocaleDateString('en-US'),
                    "_k2_dossierStatus_ID": 5
                },
                {
                    "projectleider1_ae": PM,
                    "dossiers_dossiersdataCreate::datum_van": currentStartDate.toLocaleDateString('en-US') + ".." + stopDate.toLocaleDateString('en-US'),
                    "_k2_dossierStatus_ID": 9
                
                },
                {
                    "projectleider2_ae": PM,
                    "dossiers_dossiersdataCreate::datum_van": currentStartDate.toLocaleDateString('en-US') + ".." + stopDate.toLocaleDateString('en-US'),
                    "_k2_dossierStatus_ID": 9
                },
                {
                    "projectleider1_ae": PM,
                    "dossiers_dossiersdataCreate::datum_van": currentStartDate.toLocaleDateString('en-US') + ".." + stopDate.toLocaleDateString('en-US'),
                    "_k2_dossierStatus_ID": 10
                
                },
                {
                    "projectleider2_ae": PM,
                    "dossiers_dossiersdataCreate::datum_van": currentStartDate.toLocaleDateString('en-US') + ".." + stopDate.toLocaleDateString('en-US'),
                    "_k2_dossierStatus_ID": 10
                }
            ],
            "sort": [
                {
                    "fieldName": "dossiers_dossiersdataCreate::datum_van",
                    "sortOrder": "ascend"
                }
            ],
            "limit": "5000"
        });
        return body;
        } else{
            const bearerToken = await getBearerToken();
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Authorization", "Bearer " + bearerToken);
            const raw2 = JSON.stringify({
                "query": [
                    {"_k2_werfleider_ID":WL,
                    "datum":currentStartDate.toLocaleDateString('en-US') + ".." + stopDate.toLocaleDateString('en-US')}
                ],
                "sort": [
                    {
                        "fieldName": "datum",
                        "sortOrder": "ascend"
                    }
                ],
                "limit": "5000"
            });
           
            const requestOptions = {
                method: 'POST',
                headers: myHeaders,
                body: raw2,
                redirect: 'follow'
            };
    
            try {
                const response = await fetch("https://fms.alterexpo.be/fmi/data/vLatest/databases/Arnout/layouts/_postitdetails/_find", requestOptions);
                if (!response.ok) {
                    throw new Error(`Network response was not ok: ${response.statusText}`);
                }
                const data = await response.json();
                if (data && data.response && data.response.data && data.response.data.length > 0) {
                    sessionStorage.setItem(`dossiers_${WL}`, JSON.stringify(data)); // Corrected dynamic key
                    hideErrorMessage();
                    console.log("jazee");
                    const queries = {
                        "query": data.response.data.map(item => {
                            return { "_k1_dossier_ID": item.fieldData._k2_dossier_ID };
                        })
                    };
                    const queriesString = JSON.stringify(queries);
                    console.log(queriesString);
                    return queriesString;
                } else {
                    console.log("No data found or error fetching data");
                }
            } catch (error) {
                console.error('There has been a problem with your fetch operation:', error);
                displayErrorMessage('Failed to load project data. Please try again later.');
                clearCalendar(); // Clear the calendar or indicate an error state
            }

        }

        };
    


// Event Listeners and Handlers
document.getElementById('logoutButton').addEventListener('click', function() {
    // Implement your log out logic here
    // For example, clear localStorage or session storage
    localStorage.clear(); // Or sessionStorage.clear();

    // Redirect to the login page or show a log out confirmation
    window.location.href = 'login-page.html'; // Assuming 'login.html' is your login page
});
document.getElementById('prevWeek').addEventListener('click', () => navigateWeeks(-1));
document.getElementById('nextWeek').addEventListener('click', () => navigateWeeks(1));


// UI Manipulation
function generateCalendarWithProjects(start, dossiers) {
    console.log(dossiers);
    const viewStartDate = new Date(start);
    viewStartDate.setHours(0, 0, 0, 0); // Reset the time part to the start of the day
    const viewEndDate = new Date(start);
    viewEndDate.setHours(0, 0, 0, 0);
    viewEndDate.setDate(viewStartDate.getDate() + 27); // Set the end date of the view to 4 weeks after the start
    //console.log(dossiers);
    const projects = dossiers.response.data.map(dossier => ({
        name: dossier.fieldData.dossiernaam,
        id: dossier.fieldData._k1_dossier_ID,
        PM1: dossier.fieldData.projectleider1_ae,
        PM2: dossier.fieldData.projectleider2_ae,
        dates: dossier.portalData.dossiers_dossiersdataCreate.map(subDossier => ({
            type: subDossier["dossiers_dossiersdataCreate::type"],
            start: subDossier["dossiers_dossiersdataCreate::datum_van"],
            end: subDossier["dossiers_dossiersdataCreate::datum_tot"]
        }))
    })).filter(project =>
        project.dates.some(date => {
            const projectStartDate = new Date(date.start);
            projectStartDate.setHours(0, 0, 0, 0);
            const projectEndDate = new Date(date.end);
            projectEndDate.setHours(23, 59, 59, 999); // Set to the end of the day to include projects ending on this day
            return (projectStartDate <= viewEndDate && projectEndDate >= viewStartDate);
        })
    );

    //console.log("projectsobject = " + projects);

    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set the hours, minutes, seconds, and milliseconds to 0

    // Generate header row for the 4-week span
    let headerRow = calendar.insertRow();
    let nameHeader = headerRow.insertCell();
    nameHeader.textContent = 'Project Name';
    for (let i = 0; i < 28; i++) {
        let th = document.createElement('th');
        let currentDay = new Date(viewStartDate); // Clone the date to avoid modifying the original date
        currentDay.setDate(currentDay.getDate() + i);
        th.textContent = `${currentDay.getDate()}/${currentDay.getMonth() + 1}/${currentDay.getFullYear()}`;
        th.classList.add('vertical-text'); // Apply the vertical text class
        // The textContent now manually constructs a locale-agnostic date string.
        if (currentDay.setHours(0, 0, 0, 0) === today.getTime()) {
            th.classList.add('today'); // Apply today's styling
        }
        if (currentDay.getDay() === 0 || currentDay.getDay() === 6) { // Check for Sunday (0) or Saturday (6)
            th.classList.add('weekend');
        }
        headerRow.appendChild(th);
    }

    // Iterate over each project
    projects.forEach(project => {
        let row = calendar.insertRow();
        let nameCell = row.insertCell();
        nameCell.textContent = project.name;
        nameCell.addEventListener('click',function(){
            window.location.href = "fmp://fms.alterexpo.be/Arnout.fmp12?script=Web.001_Open_dossier&$dossierID=" + project.id;
        });
        nameCell.title = "PM1: " + project.PM1 + "\nPM2: " + project.PM2 ;


        // Iterate through each day in the 4-week span for this project
        for (let i = 0; i < 28; i++) {
            let dayCell = row.insertCell();
            let currentDay = new Date(start);
            currentDay.setDate(currentDay.getDate() + i);
            currentDay.setHours(0, 0, 0, 0);
            // Flag to check if the day is covered by any project dates
            let isDayCovered = false;

            // Check each date range within the current project
            project.dates.forEach(date => {
                const projectStartDate = new Date(date.start);
                const projectEndDate = new Date(date.end);
                projectEndDate.setHours(23, 59, 59, 999); // Include the end date in the range

                if (currentDay >= projectStartDate && currentDay <= projectEndDate) {
                    // Apply color coding based on the date's type
                    dayCell.className = date.type.toLowerCase().replace(/\s+/g, '-'); // Normalize class name
                    dayCell.title = date.type; // Add title for hover-over text
                    isDayCovered = true;
                }
            });

            // Mark the cell if not covered by any project dates
            if (!isDayCovered) {
                dayCell.textContent = '';
            }
            // Check and style for today, if no other coloring is active
            if (currentDay.getTime() === today.getTime() && !dayCell.className) {
                dayCell.classList.add('today'); // Apply today's styling
            }

            if (currentDay.getDay() === 0 || currentDay.getDay() === 6) { // Check for Sunday (0) or Saturday (6)
                dayCell.classList.add('weekend');
            }
        

        }
    });
}
function clearCalendar() {
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = ''; // This clears the calendar
    displayErrorMessage('Failed to load project data. Please try again later.');
    // Optionally, add a message within the calendar element indicating no data is available
    calendar.textContent = 'No data available';
}
function displayErrorMessage(message) {
    const errorContainer = document.getElementById('error-message'); // Assuming you have an element with this id in your HTML
    errorContainer.textContent = message;
    errorContainer.style.display = 'block'; // Make sure the element is visible
}
function hideErrorMessage() {
    const errorContainer = document.getElementById('error-message'); // Assuming you have an element with this id in your HTML
    errorContainer.style.display = 'none'; // Make sure the element is visible
}


//User Session Management
function logOut() {
    localStorage.clear(); // Or any other logout procedures
    window.location.href = 'login-page.html'; // Redirect to login page
}
let inactivityTimeout;
function resetInactivityTimeout() {
    clearTimeout(inactivityTimeout); // Clear the existing timeout
    // Set a new timeout
    inactivityTimeout = setTimeout(logOut, 600000); // 600000 ms = 10 minutes
}
const events = ['mousemove', 'keydown', 'scroll', 'click'];
events.forEach(function(event) {
    window.addEventListener(event, resetInactivityTimeout);
});


// Navigation and Week Adjustment
async function navigateWeeks(direction) {
    const mySelect = document.getElementById('PM');
    let currentStartDate = adjustToStartOfWeek(new Date());
    // Ensure the startDatePicker has a value before attempting to create a Date object
    if (!startDatePicker.value) {
        console.error('Date picker value is empty.');
        return;
    }

    let selectedDate = new Date(startDatePicker.value);
    // Check if selectedDate is valid
    if (isNaN(selectedDate.getTime())) {
        console.error('Invalid date from date picker.');
        return;
    }
    var PM = mySelect.value;
    sessionStorage.setItem(`dossiers_${PM}`, "");

    selectedDate.setHours(0, 0, 0, 0);
    const currentStartDateObj = new Date(currentStartDate);
    currentStartDateObj.setHours(0, 0, 0, 0);

    if (currentStartDateObj.getTime() === selectedDate.getTime()) {
        currentStartDate = changeWeek(currentStartDate, direction * 7);
    } else {
        currentStartDate = changeWeek(selectedDate, direction * 7);
        // Only update the date picker if the resulting date is valid
        if (!isNaN(currentStartDate.getTime())) {
            startDatePicker.value = currentStartDate.toISOString().split('T')[0];
        } else {
            console.error('Resulting date from changeWeek is invalid.');
        }
    }

    await updateCalendar(currentStartDate, mySelect.value);
}
function changeWeek(date, days) {
    let newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return newDate;
}


