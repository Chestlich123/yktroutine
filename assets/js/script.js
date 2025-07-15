const calendarEl = document.getElementById('calendar');
const monthYearEl = document.getElementById('monthYear');
const prevBtn = document.getElementById('prevMonth');
const nextBtn = document.getElementById('nextMonth');
const selectionPanel = document.getElementById('selectionPanel');

// Chart contexts
const weightCtx = document.getElementById('weightChart').getContext('2d');
const cardioCtx = document.getElementById('cardioChart').getContext('2d');

let now = new Date();
let selectedMonth = now.getMonth();
let selectedYear = now.getFullYear();
let selectedDateKey = null;

// Weekday names
const weekdays = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];

// Initialize charts
let weightChart = new Chart(weightCtx, {
    type: 'pie',
    data: {
        labels: ['Yaptı','Yapmadı'],
        datasets: [{ data: [0,0], backgroundColor: ['#4CAF50','#F44336'] }]
    },
    options: { plugins: { legend: { labels: { font: { size: 16 } } } } }
});
let cardioChart = new Chart(cardioCtx, {
    type: 'pie',
    data: {
        labels: ['Yaptı','Yapmadı'],
        datasets: [{ data: [0,0], backgroundColor: ['#4CAF50','#F44336'] }]
    },
    options: { plugins: { legend: { labels: { font: { size: 16 } } } } }
});

function renderCalendar() {
    calendarEl.innerHTML = '';
    selectionPanel.innerHTML = '';
    const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    monthYearEl.textContent = `${selectedYear} ${selectedMonth+1}`;
    // blank cells
    for (let i = 0; i < firstDay; i++) calendarEl.appendChild(document.createElement('div'));
    // day cells
    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement('div');
        cell.classList.add('day-cell');
        const dateKey = `${selectedYear}-${selectedMonth+1}-${day}`;
        let status = localStorage.getItem(dateKey);
        // Add status class
        if (status === 'yapti') cell.classList.add('mark-yapti');
        else if (status === 'yapmadi') cell.classList.add('mark-yapmadi');
        else if (status === 'offday') cell.classList.add('mark-offday');
        // Add day number and weekday
        const dateObj = new Date(selectedYear, selectedMonth, day);
        cell.innerHTML = `<div>${day}</div><div style="font-size:0.6em;">${weekdays[dateObj.getDay()]}</div>`;
        // Click to select day
        cell.addEventListener('click', () => {
            selectedDateKey = dateKey;
            renderCalendar();
            updateSelectionPanel();
        });
        if (selectedDateKey === dateKey) cell.classList.add('selected');
        calendarEl.appendChild(cell);
    }
}

function updateSelectionPanel() {
    selectionPanel.innerHTML = '';
    if (!selectedDateKey) return;
    // Status buttons
    const btnYapti = document.createElement('button'); btnYapti.textContent='Yaptı';
    btnYapti.addEventListener('click', () => { localStorage.setItem(selectedDateKey,'yapti'); renderCalendar(); updateSelectionPanel(); updateCharts(); });
    const btnYapmadi = document.createElement('button'); btnYapmadi.textContent='Yapmadı';
    btnYapmadi.addEventListener('click', () => { localStorage.setItem(selectedDateKey,'yapmadi'); renderCalendar(); updateSelectionPanel(); updateCharts(); });
    const btnOff = document.createElement('button'); btnOff.textContent='Off day';
    btnOff.addEventListener('click', () => { localStorage.setItem(selectedDateKey,'offday'); renderCalendar(); updateSelectionPanel(); updateCharts(); });
    selectionPanel.append(btnYapti, btnYapmadi, btnOff);
    // If yapti, show workout and cardio
    if (localStorage.getItem(selectedDateKey) === 'yapti') {
        const wLabel = document.createElement('label'); wLabel.textContent='Hangi Antrenman? ';
        const wSelect = document.createElement('select');
        ['itiş','çekiş','bacak'].forEach(opt => wSelect.add(new Option(opt.charAt(0).toUpperCase()+opt.slice(1),opt)));
        wSelect.value = localStorage.getItem(selectedDateKey+'-workout')||'itiş';
        wSelect.addEventListener('change', ()=>{ localStorage.setItem(selectedDateKey+'-workout',wSelect.value); updateCharts(); });
        const cLabel = document.createElement('label'); cLabel.textContent=' Kardiyo? ';
        const cSelect = document.createElement('select');
        ['evet','hayır'].forEach(opt => cSelect.add(new Option(opt.charAt(0).toUpperCase()+opt.slice(1),opt)));
        cSelect.value = localStorage.getItem(selectedDateKey+'-cardio')||'hayır';
        cSelect.addEventListener('change', ()=>{ localStorage.setItem(selectedDateKey+'-cardio',cSelect.value); updateCharts(); });
        selectionPanel.append(wLabel,wSelect,cLabel,cSelect);
    }
    // Food entry
    const fLabel = document.createElement('label'); fLabel.textContent='Bugün ne yedim?';
    const fTextarea = document.createElement('textarea'); 
    fTextarea.value = localStorage.getItem(selectedDateKey+'-food')||'';
    const saveBtn = document.createElement('button'); saveBtn.textContent='Kaydet';
    saveBtn.addEventListener('click', ()=>{ localStorage.setItem(selectedDateKey+'-food',fTextarea.value); renderFoodList(); });
    const foodList = document.createElement('ul'); foodList.id='foodList';
    selectionPanel.append(fLabel, fTextarea, saveBtn, foodList);
    function renderFoodList() {
        foodList.innerHTML='';
        const items = (localStorage.getItem(selectedDateKey+'-food')||'').split('\n');
        items.forEach(item => { if(item.trim()) { const li = document.createElement('li'); li.textContent = item; foodList.append(li); } });
    }
    renderFoodList();
}

function updateCharts() {
    let wDone=0, wNot=0, cDone=0, cNot=0;
    const daysInMonth = new Date(selectedYear, selectedMonth+1, 0).getDate();
    for (let d=1; d<=daysInMonth; d++) {
        const key = `${selectedYear}-${selectedMonth+1}-${d}`;
        const status = localStorage.getItem(key);
        if (status==='yapti') wDone++;
        else if (status==='yapmadi') wNot++;
        const cardio = localStorage.getItem(key+'-cardio');
        if (status==='yapti' && cardio==='evet') cDone++;
        else if (status==='yapti' && cardio==='hayır') cNot++;
    }
    weightChart.data.datasets[0].data=[wDone,wNot]; weightChart.update();
    cardioChart.data.datasets[0].data=[cDone,cNot]; cardioChart.update();
}

prevBtn.addEventListener('click', ()=>{ selectedMonth--; if(selectedMonth<0){selectedMonth=11;selectedYear--;} selectedDateKey=null; renderCalendar(); updateCharts(); });
nextBtn.addEventListener('click', ()=>{ selectedMonth++; if(selectedMonth>11){selectedMonth=0;selectedYear++;} selectedDateKey=null; renderCalendar(); updateCharts(); });

// Initial load
renderCalendar(); updateCharts();
