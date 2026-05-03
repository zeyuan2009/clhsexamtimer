const data = await import('./config.json', { with: { type: 'json' } });
const sel = document.getElementById("sel-form")
const cfm = document.getElementById("cfm")

function getFormattedDateTime() {
    const now = new Date();
    
    // Extract Date components
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(now.getDate()).padStart(2, '0');

    // Extract Time components
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    // Combine into required formats
    var date = `${year}${month}${day}`;
    var time = `${hours}${minutes}`;

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

    // Apply the buffers
    const bufferStart = startTotal - 60; // 30 mins before
    const bufferEnd = endTotal + 5;     // 5 mins after

    // Final logical check
    return checkTotal >= bufferStart && checkTotal <= bufferEnd;
}

function doWeHaveExamsNow() {
    var datetime = getFormattedDateTime()
    var date = datetime['date']
    var time = datetime['time']
    var val = sel.value
    var dataOfTheDay = data['default'][val][date]

    if (dataOfTheDay == undefined) {
        return false
    } else {
        var keys = Object.keys(dataOfTheDay)
        var result;
    
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            console.log(date, time);
            
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

cfm.addEventListener("click", () => {

    console.log(doWeHaveExamsNow());
    if (doWeHaveExamsNow()[0]) {
        if (isTimeInExamWindow(doWeHaveExamsNow()[0], getFormattedDateTime()['time']) == true) {
            window.location.replace(`/display.html?form=${sel.value}`)
        }
    } else {
        console.warn("No exams are scheduled for now.")
        alert("No exams are scheduled for now.")
    }

})
