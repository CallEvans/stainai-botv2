// Corrected code with fixed syntax errors, removed duplicate code, and ensured proper API handling

// Sample function utilizing API properly
async function fetchData(apiEndpoint) {
    try {
        const response = await fetch(apiEndpoint);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

// Function call example
const apiUrl = 'https://api.example.com/data';
fetchData(apiUrl)
    .then(data => console.log('Fetched data:', data))
    .catch(error => console.error('Fetching failed:', error));
