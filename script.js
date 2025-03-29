// script.js

const popup = document.querySelector(".popup");
const popupContent = document.querySelector(".popup-content");
const popupCloseButton = document.querySelector(".popup button.close");
const popupCountryNameH2 = document.getElementById("popupCountryName");
const popupCapitalSpan = document.getElementById("popupCapital");
const popupRegionSpan = document.getElementById("popupRegion");
const popupPopulationSpan = document.getElementById("popupPopulation");
const popupFlagImg = document.getElementById("popupFlag");
const popupSpinnerContainer = document.getElementById("popupSpinnerContainer"); // ADD THIS LINE
const popupErrorDiv = document.getElementById("popupError");
const topInfoNameP = document.getElementById("namep");

// --- Helper Functions ---



function showPopup() {
    if (popup) {
        // 1. Make the popup element block-level so it can be seen
        popup.style.display = 'flex'; 
        
        // 2. Use requestAnimationFrame to ensure the 'display: flex' 
        //    is rendered before adding the class that triggers the transition.
        //    Alternatively, a setTimeout(0) can sometimes work, but rAF is cleaner.
        requestAnimationFrame(() => {
            popup.classList.add('visible');
        });
    }
}
function hidePopup() {
    if (popup) {
        // 1. Remove the 'visible' class to trigger the fade-out transition
        popup.classList.remove('visible');

        // 2. Define a function to handle actions *after* the transition ends
        const afterTransition = (event) => { // Optional: check event.target === popup
            // Make sure the transition that ended was on the popup itself, not a child
             if (event.target === popup) { 
                // 3. Hide the element completely
                popup.style.display = 'none'; 
                // 4. IMPORTANT: Remove the event listener to avoid it firing multiple times
                popup.removeEventListener('transitionend', afterTransition); 
             }
        };

        // 5. Listen for the 'transitionend' event ON THE POPUP ELEMENT ITSELF
        popup.addEventListener('transitionend', afterTransition);
    }
}

function showLoading() {
    popupErrorDiv.style.display = 'none'; // Hide error
    popupSpinnerContainer.style.display = 'flex'; // Show spinner container (use flex as defined in CSS)
    // Clear previous data
    popupCountryNameH2.textContent = 'Loading...'; // Keep loading text in heading for clarity
    popupCapitalSpan.textContent = '';
    popupRegionSpan.textContent = '';
    popupPopulationSpan.textContent = '';
    popupFlagImg.style.display = 'none';
    popupFlagImg.src = '';
    popupFlagImg.alt = '';
    // Hide the main details grid while loading
    document.querySelector('.detail-grid').style.display = 'none'; 
}

function showError(message) {
    popupSpinnerContainer.style.display = 'none'; // Hide spinner
    popupErrorDiv.textContent = message;
    popupErrorDiv.style.display = 'block'; // Show error
    // Clear data fields, keep heading indicating the problematic country
    popupCapitalSpan.textContent = '-';
    popupRegionSpan.textContent = '-';
    popupPopulationSpan.textContent = '-';
    popupFlagImg.style.display = 'none';
    // Ensure details grid is hidden on error too
    document.querySelector('.detail-grid').style.display = 'none'; 
}

function updatePopupContent(countryData) {
    popupSpinnerContainer.style.display = 'none'; // Hide spinner
    popupErrorDiv.style.display = 'none'; // Hide error
    // Make sure the details grid is visible again
    document.querySelector('.detail-grid').style.display = 'grid'; // Use 'grid' as defined in CSS

    // Safely access data using optional chaining (?.) and provide fallbacks ('N/A')
    popupCountryNameH2.textContent = countryData?.name?.common || 'N/A';
    // ... (rest of the data population remains the same) ...
    popupCapitalSpan.textContent = countryData?.capital?.[0] || 'N/A'; 
    popupRegionSpan.textContent = countryData?.region || 'N/A';
    popupPopulationSpan.textContent = countryData?.population?.toLocaleString() || 'N/A'; 

    const flagUrl = countryData?.flags?.svg || countryData?.flags?.png; 
    if (flagUrl) {
        popupFlagImg.src = flagUrl;
        popupFlagImg.alt = `Flag of ${countryData?.name?.common || 'the country'}`;
        popupFlagImg.style.display = 'block'; 
    } else {
        popupFlagImg.style.display = 'none'; 
    }
}


// --- Main API Function ---

async function fetchCountryData(countryName) {
    // Use the country ID directly if it matches API expectations, 
    // otherwise, you might need a mapping if IDs differ from common names.
    // For REST Countries, the name endpoint usually works well with common English names.
    
    const apiUrl = `https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fullText=true`;
    // Using fullText=true helps match precisely

    try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
            // Handle HTTP errors (like 404 Not Found)
            if (response.status === 404) {
                throw new Error(`Country data not found for "${countryName}".`);
            } else {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }
        }

        const data = await response.json();

        // API returns an array, even for fullText=true, take the first element
        if (data && data.length > 0) {
            updatePopupContent(data[0]);
        } else {
            // Should be caught by 404, but as a safeguard
            throw new Error(`No data returned for "${countryName}".`); 
        }

    } catch (error) {
        console.error("Error fetching country data:", error);
        // Display the error message in the popup
        popupCountryNameH2.textContent = countryName; // Keep the name user clicked
        showError(error.message);
    }
}


// --- Event Listeners ---

// Add click event listener to each country path
document.querySelectorAll('path.allPaths').forEach(countryPath => {
    countryPath.addEventListener('click', function() {
        const countryName = this.id; // Get country name from the path ID

        if (topInfoNameP) {
            topInfoNameP.textContent = `Clicked: ${countryName}`; // Update top info
        }

        showPopup();      // Show popup immediately
        showLoading();    // Show loading state
        fetchCountryData(countryName); // Start fetching data
    });
});

// Add click event listener to close button
if (popupCloseButton) {
    popupCloseButton.addEventListener("click", hidePopup);
}

// Optional: Close popup if clicking on the background overlay
if (popup) {
    popup.addEventListener('click', function(event) {
        // If the click target is the popup overlay itself (not the content inside)
        if (event.target === popup) {
            hidePopup();
        }
    });
}