document.addEventListener('DOMContentLoaded', async function () {
    const mySelect = document.getElementById('PM');
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
    await updateCalendar(currentStartDate, mySelect.value);

    // Navigates weeks forward or backward and updates calendar
    async function navigateWeeks(direction) {
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
        sessionStorage.setItem(`dossiers_${PM}`,"");
    
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
    

    document.getElementById('prevWeek').addEventListener('click', () => navigateWeeks(-1));
    document.getElementById('nextWeek').addEventListener('click', () => navigateWeeks(1));

    // Update calendar based on PM selection
    mySelect.addEventListener('change', async () => {
        var PM = mySelect.value;
        sessionStorage.setItem(`dossiers_${PM}`,"");
        await updateCalendar(currentStartDate, mySelect.value);
    });

    // Update calendar when a new start date is picked
    startDatePicker.addEventListener('change', async function () {
        var PM = mySelect.value;
        sessionStorage.setItem(`dossiers_${PM}`,"");
        currentStartDate = adjustToStartOfWeek(new Date(this.value));
        await updateCalendar(currentStartDate, mySelect.value);
    });
});


function changeWeek(date, days) {
    let newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return newDate;
}

async function updateCalendar(startDate, PM) {
    const stopDate = new Date(startDate);
    stopDate.setDate(startDate.getDate() + 34);
    console.log(startDate, stopDate,PM);
    const apiDossiers = await getDossiers(PM, startDate, stopDate);
    //console.log(apiDossiers);
    if (apiDossiers) {
        generateCalendarWithProjects(startDate, apiDossiers);
    }
}

async function populatePMsDropdown(selectElement) {
    const data = await getPMs();
    if (data) {
        const option = document.createElement('option');
        option.value = "*";
        option.text = "----------------";
        selectElement.appendChild(option);
        data.response.data.forEach(dossier => {
            const option = document.createElement('option');
            option.value = option.text = dossier.fieldData.voornaam_naam_c;
            selectElement.appendChild(option);
        });
    }
}

function adjustToStartOfWeek(date) {
    const adjustedDate = new Date(date);
    const dayOfWeek = adjustedDate.getDay();
    const difference = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust for Sunday as 0
    adjustedDate.setDate(adjustedDate.getDate() + difference);
    adjustedDate.setHours(0, 0, 0, 0); // Set time to the start of the day
    return adjustedDate;
}

async function getDossiers(PM, currentStartDate, stopDate) {
    // Use template literals to embed PM variable dynamically
    const storedDossiers = sessionStorage.getItem(`dossiers_${PM}`);
    if (storedDossiers) {
        return JSON.parse(storedDossiers);
    } else {
        const bearerToken = await getBearerToken();
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Authorization", "Bearer " + bearerToken);
        const fullName = PM;
        

        // Ensure correct format for your API's expectations
        const raw = JSON.stringify({
            "query": [
                {
                    "projectleider1_ae": fullName,
                    "dossiers_dossiersdataCreate::datum_van": currentStartDate.toLocaleDateString('en-US') + ".." + stopDate.toLocaleDateString('en-US')
                }, 
                {
                    "projectleider2_ae": fullName,
                    "dossiers_dossiersdataCreate::datum_van": currentStartDate.toLocaleDateString('en-US') + ".." + stopDate.toLocaleDateString('en-US')
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
                return data;
            } else {
                console.log("No data found or error fetching data");
            }
        } catch (error) {
            console.error('There has been a problem with your fetch operation:', error);
        }
    }
}


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


function generateCalendarWithProjects(start, dossiers) {
    const viewStartDate = new Date(start);
    const viewEndDate = new Date(start);
    viewEndDate.setDate(viewStartDate.getDate() + 27); // Set the end date of the view to 4 weeks after the start

    const projects = dossiers.response.data.map(dossier => ({
        name: dossier.fieldData.dossiernaam,
        dates: dossier.portalData.dossiers_dossiersdataCreate.map(subDossier => ({
            type: subDossier["dossiers_dossiersdataCreate::type"],
            start: subDossier["dossiers_dossiersdataCreate::datum_van"],
            end: subDossier["dossiers_dossiersdataCreate::datum_tot"]
        }))
    })).filter(project =>
        project.dates.some(date => {
            const projectStartDate = new Date(date.start);
            const projectEndDate = new Date(date.end);
            return (projectStartDate <= viewEndDate && projectEndDate >= viewStartDate);
        })
    );

    //console.log(projects);

    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set the hours, minutes, seconds and milliseconds to 0

    // Generate header row for the 4-week span
    let headerRow = calendar.insertRow();
    let nameHeader = headerRow.insertCell();
    nameHeader.textContent = 'Project Name';
    for (let i = 0; i < 28; i++) {
        let th = document.createElement('th');
        let currentDay = new Date(start);
        currentDay.setDate(currentDay.getDate() + i);
        th.textContent = currentDay.toISOString().split('T')[0];
        currentDay.setHours(0, 0, 0, 0);
        if (currentDay.getTime() === today.getTime()) {
            th.classList.add('today'); // Apply today's styling
        }
        headerRow.appendChild(th);
    }

    // Iterate over each project
    projects.forEach(project => {
        let row = calendar.insertRow();
        let nameCell = row.insertCell();
        nameCell.textContent = project.name;

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
        }
    });
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

function openPage() {
    if (localStorage.getItem('userName') && localStorage.getItem('passWord')) {
        loadDossiers();

    } else {
        document.location.href = 'login-page.html';
    }
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
