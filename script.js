document.addEventListener('DOMContentLoaded', async function () {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (startDate.getDay() || 7) + 1); // Adjust to the start of this week

    let currentStartDate = new Date(startDate);
    const mySelect = document.getElementById('PM');
    await getPMs(mySelect); // Assume this populates the PM select dropdown

    // Function to update the calendar based on the selected PM and currentStartDate
    async function updateCalendarForPMAndDate() {
        const PM = mySelect.value; // Fetch the currently selected PM
        const apiDossiers = await getDossiers(PM, currentStartDate); // Fetch dossiers for the PM and date
        generateCalendarWithProjects(currentStartDate, apiDossiers); // Update the calendar
    }

    // Initial update for the calendar
    await updateCalendarForPMAndDate();

    // Add change event listener to the PM select dropdown to update calendar on PM change
    mySelect.addEventListener('change', updateCalendarForPMAndDate);

    document.getElementById('prevWeek').addEventListener('click', async () => {
        currentStartDate.setDate(currentStartDate.getDate() - 7);
        await updateCalendarForPMAndDate(); // Use the current PM selection
    });
    
    document.getElementById('nextWeek').addEventListener('click', async () => {
        currentStartDate.setDate(currentStartDate.getDate() + 7);
        await updateCalendarForPMAndDate(); // Use the current PM selection
    });
});


// Navigation event listeners


async function getDossiers(PM,currentStartDate) {
    var bearerToken = await getBearerToken();
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", "Bearer " + bearerToken);
    var fullName = PM;

    

    var raw = JSON.stringify({
        "query": [
            {
                "projectleider1_ae": fullName,"dossiers_dossiersdataCreate::datum_van":currentStartDate.toLocaleDateString('en-US')+".."},{
                "projectleider2_ae": fullName,"dossiers_dossiersdataCreate::datum_van":currentStartDate.toLocaleDateString('en-US')+".."
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
    //console.log (raw);

    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    try {
        const response = await fetch("https://fms.alterexpo.be/fmi/data/vLatest/databases/Arnout/layouts/Dossiers_form_detail/_find", requestOptions);
        if (!response.ok) {
            throw new Error('Network response was not ok'& response);
        }
        const data = await response.json();
        if (data && data.response && data.response.data && data.response.data.length > 0) {
            return data;
        } else {
            //("No data found or error fetching data");
        }

    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
    }

    
}

async function getPMs(mySelect) {
    
    var bearerToken = await getBearerToken();
    var myHeaders = new Headers();
    var select = mySelect;
    const option = document.createElement('option');
    option.value = "*";
    option.text = "----------------";
    select.appendChild(option);

    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", "Bearer " + bearerToken);

    

    var raw = JSON.stringify({
        "query": [
            {
                "contactPersonen::functie": "Project Manager",
                "contactPersonen::flag_personeel": 1
            }
        ]    });
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
            throw new Error('Network response was not ok'& response);
        }
        const data = await response.json();
        if (data && data.response && data.response.data && data.response.data.length > 0) {
            data.response.data.forEach(dossier => {
                const option = document.createElement('option');
                option.value = dossier.fieldData.voornaam_naam_c;
                option.text = dossier.fieldData.voornaam_naam_c;
                select.appendChild(option);})
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

    console.log(projects);

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
        currentDay.setHours(0,0,0,0);
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
            currentDay.setHours(0,0,0,0);
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