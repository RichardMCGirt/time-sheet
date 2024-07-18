// timesheetLogic.js

// Utility function to debounce other functions
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Function to parse time strings to objects
function parseTime(timeString) {
    if (!timeString || timeString === "--:--") {
        return null;
    }
    const [hours, minutes] = timeString.split(':').map(num => parseInt(num, 10));
    return { hours, minutes };
}

// Function to calculate hours worked based on input times
function calculateHoursWorked(startDate, startTime, lunchStart, lunchEnd, endTime, additionalTimeIn, additionalTimeOut) {
    if (!startTime || !endTime) {
        return NaN; // Return NaN if start time or end time is missing
    }

    const startDateTime = new Date(startDate);
    startDateTime.setHours(startTime.hours, startTime.minutes);

    const endDateTime = new Date(startDate);
    endDateTime.setHours(endTime.hours, endTime.minutes);

    let totalHoursWorked = (endDateTime - startDateTime) / (1000 * 60 * 60);

    if (lunchStart && lunchEnd) {
        const lunchStartDateTime = new Date(startDate);
        lunchStartDateTime.setHours(lunchStart.hours, lunchStart.minutes);

        const lunchEndDateTime = new Date(startDate);
        lunchEndDateTime.setHours(lunchEnd.hours, lunchEnd.minutes);

        const lunchBreakHours = (lunchEndDateTime - lunchStartDateTime) / (1000 * 60 * 60);
        totalHoursWorked -= lunchBreakHours;
    }

    if (additionalTimeIn && additionalTimeOut) {
        const additionalTimeInDateTime = new Date(startDate);
        additionalTimeInDateTime.setHours(additionalTimeIn.hours, additionalTimeIn.minutes);

        const additionalTimeOutDateTime = new Date(startDate);
        additionalTimeOutDateTime.setHours(additionalTimeOut.hours, additionalTimeOut.minutes);

        const additionalTimeWorked = (additionalTimeOutDateTime - additionalTimeInDateTime) / (1000 * 60 * 60);
        totalHoursWorked += additionalTimeWorked;
    }

    return Math.max(0, totalHoursWorked); // Ensure hours worked is not negative
}

// Function to round hours to the closest quarter hour
function roundToClosestQuarterHour(hours) {
    const quarterHours = Math.round(hours * 4) / 4;
    return quarterHours;
}

// Function to handle PTO hours validation
function validatePtoHours(totalHoursWithPto, availablePTOHours, ptoTimeSpan, totalTimeWorkedSpan, ptoValidationMessage) {
    const remainingPTO = Math.max(0, availablePTOHours - parseFloat(ptoTimeSpan.textContent || 0));
    const ptoUsed = totalHoursWithPto - parseFloat(totalTimeWorkedSpan.textContent);
    console.log('PTO used:', ptoUsed);

    if (ptoUsed > availablePTOHours) {
        ptoValidationMessage.textContent = 'PTO time used cannot exceed available PTO hours';
        ptoValidationMessage.style.color = 'red';
    } else if (totalHoursWithPto > 40 && parseFloat(ptoTimeSpan.textContent) > 0) {
        ptoValidationMessage.textContent = 'Total hours including PTO cannot exceed 40 hours';
        ptoValidationMessage.style.color = 'red';
    } else {
        ptoValidationMessage.textContent = '';
    }
}

// Function to calculate total hours worked
function calculateTotalTimeWorked(timeEntryForm, totalTimeWorkedSpan, totalTimeWithPtoSpan, ptoTimeSpan, personalTimeSpan, holidayTimeSpan) {
    console.log('Calculating total time worked...');

    let totalHoursWorked = 0;
    let totalHoursWithPto = 0;

    const daysOfWeek = ['date1', 'date2', 'date3', 'date4', 'date5', 'date6', 'date7'];

    daysOfWeek.forEach((day, index) => {
        const dateInput = timeEntryForm.elements[day];
        const startTimeInput = timeEntryForm.elements[`start_time${index + 1}`];
        const lunchStartInput = timeEntryForm.elements[`lunch_start${index + 1}`];
        const lunchEndInput = timeEntryForm.elements[`lunch_end${index + 1}`];
        const endTimeInput = timeEntryForm.elements[`end_time${index + 1}`];
        const additionalTimeInInput = timeEntryForm.elements[`Additional_Time_In${index + 1}`];
        const additionalTimeOutInput = timeEntryForm.elements[`Additional_Time_Out${index + 1}`];
        const hoursWorkedSpan = document.getElementById(`hours-worked-today${index + 1}`);

        const startDate = new Date(dateInput.value);
        const startTime = parseTime(startTimeInput.value);
        const lunchStart = parseTime(lunchStartInput.value);
        const lunchEnd = parseTime(lunchEndInput.value);
        const endTime = parseTime(endTimeInput.value);
        const additionalTimeIn = parseTime(additionalTimeInInput.value);
        const additionalTimeOut = parseTime(additionalTimeOutInput.value);

        let hoursWorked = calculateHoursWorked(startDate, startTime, lunchStart, lunchEnd, endTime, additionalTimeIn, additionalTimeOut);
        hoursWorked = roundToClosestQuarterHour(hoursWorked);

        if (!isNaN(hoursWorked)) {
            totalHoursWorked += hoursWorked;
            hoursWorkedSpan.textContent = hoursWorked.toFixed(2);
        } else {
            hoursWorkedSpan.textContent = '0.00';
        }
    });

    const ptoTime = parseFloat(ptoTimeSpan.textContent) || 0;
    const personalTime = parseFloat(personalTimeSpan.textContent) || 0;
    const holidayHours = parseFloat(holidayTimeSpan.textContent) || 0;

    totalHoursWithPto = totalHoursWorked + ptoTime + personalTime + holidayHours;

    totalTimeWorkedSpan.textContent = totalHoursWorked.toFixed(2);
    totalTimeWithPtoSpan.textContent = totalHoursWithPto.toFixed(2);
    console.log('Total hours worked:', totalHoursWorked);
    console.log('Total hours with PTO:', totalHoursWithPto);

    validatePtoHours(totalHoursWithPto, availablePTOHours, ptoTimeSpan, totalTimeWorkedSpan, ptoValidationMessage);
    validatePersonalHours(totalHoursWithPto);

    // Calculate and update total PTO and Holiday hours used
    updateTotalPtoAndHolidayHours();
}

// Function to scroll to an element smoothly
function scrollToElement(element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Attach event listeners and enhance UI experience
document.addEventListener("DOMContentLoaded", () => {
    const timeEntryForm = document.getElementById('time-entry-form');
    const holidayHoursInput = document.getElementById('Holiday-hours');
    const weekEndingInput = document.getElementById('week-ending');
    const totalTimeWorkedSpan = document.getElementById('total-time-worked');
    const totalTimeWithPtoSpan = document.getElementById('total-time-with-pto-value');
    const ptoTimeSpan = document.getElementById('pto-time');
    const personalTimeSpan = document.getElementById('personal-time');
    const holidayTimeSpan = document.getElementById('Holiday-hours');
    const ptoValidationMessage = document.getElementById('pto-validation-message');

    timeEntryForm.addEventListener('input', debounce(() => calculateTotalTimeWorked(timeEntryForm, totalTimeWorkedSpan, totalTimeWithPtoSpan, ptoTimeSpan, personalTimeSpan, holidayTimeSpan), 300));
    holidayHoursInput.addEventListener('input', debounce(() => calculateTotalTimeWorked(timeEntryForm, totalTimeWorkedSpan, totalTimeWithPtoSpan, ptoTimeSpan, personalTimeSpan, holidayTimeSpan), 300));

    const timeInputs = document.querySelectorAll('input[type="time"]');
    timeInputs.forEach(input => {
        input.addEventListener('focus', () => scrollToElement(input));
        input.addEventListener('keydown', handleArrowKeys);
    });
});
