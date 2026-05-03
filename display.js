// ========= VARIABLES ========= //

// DEBUG //

const debug = false
var debugdate = '20260504'
var debugtime = '0900'

// IMPORT EXAM DATA //

const data = await import('./config.json', { with: { type: 'json' } });

// ========= FUNCTIONS ========= //

// CORE FUNCTIONS //

/**
 * Converts "0845-1015" to "8:45 a.m. - 10:15 a.m."
 * @param {string} range - e.g., "0845-1015"
 * @returns {string} - e.g., "8:45 a.m. - 10:15 a.m."
 */
function formatExamTime(range) {
    const [start, end] = range.split('-');

    function convert(timeStr) {
        let hours = parseInt(timeStr.substring(0, 2));
        const minutes = timeStr.substring(2, 4);
        const period = hours >= 12 ? 'p.m.' : 'a.m.';

        // Convert 0 to 12 for midnight, and 13-23 to 1-11 for PM
        hours = hours % 12 || 12;

        return `${hours}:${minutes} ${period}`;
    }

    return `${convert(start)} - ${convert(end)}`;
}

function getFormattedDateTime() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    var date = `${year}${month}${day}`;
    var time = `${hours}${minutes}`;

    if (debug) {
        date = debugdate
        time = debugtime
    }

    return { date, time };
}

function isTimeInExamWindow(rangeStr, checkTimeStr) {
    const toMinutes = (timeStr) => {
        const hours = parseInt(timeStr.substring(0, 2), 10);
        const mins = parseInt(timeStr.substring(2, 4), 10);
        return (hours * 60) + mins;
    };

    const [startStr, endStr] = rangeStr.split('-');
    
    const startTotal = toMinutes(startStr);
    const endTotal = toMinutes(endStr);
    const checkTotal = toMinutes(checkTimeStr);

    const bufferStart = startTotal - 30;
    const bufferEnd = endTotal + 5;

    return checkTotal >= bufferStart && checkTotal <= bufferEnd;
}

// SECONDARY FUNCTIONS //

function getForm() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const formData = urlParams.get('form');
    if (formData) {
        return formData.toUpperCase(); 
    }
    return false;
}

function doWeHaveExamsNow() {
    var datetime = getFormattedDateTime()
    var date = datetime['date']
    if (debug) { date = debugdate }
    var time = datetime['time']
    if (debug) { time = debugtime }
    var val = getForm()
    if (val == false) { return false }

    var dataOfTheDay = data['default'][val][date]

    if (dataOfTheDay == undefined) {
        return false
    } else {
        var keys = Object.keys(dataOfTheDay)
        var result;
    
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            if (isTimeInExamWindow(k,time)) {
                result = [k, dataOfTheDay[k]]
            }
        }
    
        if (result == undefined) {
            return false
        } else {
            return result
        }
    }
}

// ========= CLOCK LOGIC ========= //

/**
 * @param {string} examRange
 * @param {Date} now
 */

export function updateCountdown(examRange, now) {
    const countdownElement = document.getElementById('countdown');
    const titleElement = document.getElementById('countdowntitle');
    if (!countdownElement || !titleElement || !examRange) return;

    const [startStr, endStr] = examRange.split('-');
    const examStart = new Date(now);
    examStart.setHours(parseInt(startStr.substring(0, 2)), parseInt(startStr.substring(2, 4)), 0, 0);

    const examEnd = new Date(now);
    examEnd.setHours(parseInt(endStr.substring(0, 2)), parseInt(endStr.substring(2, 4)), 0, 0);

    let diffInSeconds = 0;
    let isExamRunning = false;

    if (now < examStart) {

        titleElement.textContent = "Time Until Next Paper";
        diffInSeconds = Math.max(0, Math.ceil((examStart - now) / 1000));
        if (diffInSeconds > 1800) diffInSeconds = 1800;

    } else if (now >= examStart && now < examEnd) {

        titleElement.textContent = "Time Remaining";
        diffInSeconds = Math.max(0, Math.ceil((examEnd - now) / 1000));
        isExamRunning = true;

    } else {

        titleElement.textContent = "Time Remaining";
        diffInSeconds = 0;

    }

    countdownElement.style.color = "var(--primary-color)";
    
    if (isExamRunning) {
        if (diffInSeconds <= 60) {
            countdownElement.style = "color: #ff6b6b; border-color: #ff6b6b; box-shadow: 0 10px 40px #ff6b6b22;"
        }
        else if (diffInSeconds <= 300 && diffInSeconds > 0) {
            countdownElement.style = "color: var(--accent-color); border-color: var(--accent-color); box-shadow: 0 10px 40px #F5CB5C22;"
        }
        else {
            countdownElement.style = "color: var(--primary-color); border-color: var(--primary-color); box-shadow: 0 10px 40px #ffffff22;"
        }
    } else {
        if (diffInSeconds <= 60) {
            countdownElement.style = "color: #ff6b6b; border-color: #ff6b6b; box-shadow: 0 10px 40px #ff6b6b22;"
        } else if (diffInSeconds <= 300 && diffInSeconds > 0) {
            countdownElement.style = "color: var(--accent-color); border-color: var(--accent-color); box-shadow: 0 10px 40px #F5CB5C22;"
        }
    }

    const h = Math.floor(diffInSeconds / 3600);
    const m = Math.floor((diffInSeconds % 3600) / 60);
    const s = diffInSeconds % 60;

    countdownElement.textContent = [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

/**
 * @param {Date} now
 */
export function updateMainClock(now) {
    const clockElement = document.getElementById('clock');
    if (!clockElement) return;

    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    
    clockElement.textContent = `${h}:${m}:${s}`;
}

var activeExamRange = doWeHaveExamsNow()[0]

function tick() {
    const masterTime = new Date();
    updateMainClock(masterTime);
    updateCountdown(activeExamRange, masterTime);
    if (doWeHaveExamsNow() == false) {
        if (debug == false) {window.location.replace("/")}
    }
}

let serverTimeOffset = 0; // Difference in milliseconds

async function syncWithServer() {
    const targetUrl = 'https://exam.clhs.edu.my/time.php';
    const proxyUrl = 'https://corsproxy.io/?url=';

    try {
        const response = await fetch(proxyUrl + encodeURIComponent(targetUrl));
        const data = await response.json();
        
        const serverTime = new Date(data.serverTime);
        const localTime = new Date();
        
        // Calculate how far off the local clock is
        serverTimeOffset = serverTime.getTime() - localTime.getTime();
        
        console.log(`Clock synced. Server offset: ${serverTimeOffset}ms`);
    } catch (error) {
        console.error('Sync failed, using local time:', error);
        serverTimeOffset = 0; 
    }
}

// ========= INITIALIZATION ========= //

setInterval(tick, 500);
tick();

syncWithServer();

if (doWeHaveExamsNow() == false) {
    if (debug == false) {window.location.replace("/")}
} else {
    var examinfo = doWeHaveExamsNow()[1]
    document.getElementById('subjectName').innerHTML = examinfo['subjectName']
    document.getElementById('duration').innerHTML = `Duration: ${examinfo['subjectDuration']}`
    document.getElementById('subjectTime').innerHTML = formatExamTime(doWeHaveExamsNow()[0])
}