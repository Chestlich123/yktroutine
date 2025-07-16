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

// Weekday and month names
const weekdays = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
const monthNames = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

// Initialize charts
let weightChart = new Chart(weightCtx, {
    type: 'pie',
    data: {
        labels: ['Yaptı','Yapmadı'],
        datasets: [{ data: [0,0], backgroundColor: ['#4CAF50','#F44336'] }]
    },
    options: {
        plugins: {
            legend: { labels: { font: { size: 16 } } },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const data = context.dataset.data;
                        const sum = data.reduce((a, b) => a + b, 0);
                        const value = context.parsed;
                        const percentage = sum ? (value*100/sum).toFixed(1) : 0;
                        return context.label + ': ' + percentage + '%';
                    }
                }
            }
        }
    }
});
let cardioChart = new Chart(cardioCtx, {
    type: 'pie',
    data: {
        labels: ['Yaptı','Yapmadı'],
        datasets: [{ data: [0,0], backgroundColor: ['#4CAF50','#F44336'] }]
    },
    options: {
        plugins: {
            legend: { labels: { font: { size: 16 } } },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const data = context.dataset.data;
                        const sum = data.reduce((a, b) => a + b, 0);
                        const value = context.parsed;
                        const percentage = sum ? (value*100/sum).toFixed(1) : 0;
                        return context.label + ': ' + percentage + '%';
                    }
                }
            }
        }
    }
});

function renderCalendar() {
    calendarEl.innerHTML = '';
    selectionPanel.innerHTML = '';
    const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    monthYearEl.textContent = monthNames[selectedMonth] + ' ' + selectedYear;
    // blank cells
    for (let i = 0; i < firstDay; i++) calendarEl.appendChild(document.createElement('div'));
    // day cells
    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement('div');
        cell.classList.add('day-cell');
        const dateKey = `${selectedYear}-${selectedMonth+1}-${day}`;
        let status = localStorage.getItem(dateKey);
        if (status === 'yapti') cell.classList.add('mark-yapti');
        else if (status === 'yapmadi') cell.classList.add('mark-yapmadi');
        else if (status === 'offday') cell.classList.add('mark-offday');
        const dateObj = new Date(selectedYear, selectedMonth, day);
        cell.innerHTML = `<div>${day}</div><div style="font-size:0.6em;">${weekdays[dateObj.getDay()]}</div>`;
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
    // Status buttons with toggle
    const statuses = [
        {label:'Yaptı', value:'yapti'},
        {label:'Yapmadı', value:'yapmadi'},
        {label:'Off day', value:'offday'}
    ];
    statuses.forEach(s => {
        const btn = document.createElement('button');
        btn.textContent = s.label;
        btn.addEventListener('click', () => {
            const current = localStorage.getItem(selectedDateKey);
            if (current === s.value) {
                localStorage.removeItem(selectedDateKey);
            } else {
                localStorage.setItem(selectedDateKey, s.value);
            }
            renderCalendar();
            updateSelectionPanel();
            updateCharts();
        });
        selectionPanel.append(btn);
    });
    // Workout and cardio if 'yapti'
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
        selectionPanel.append(wLabel, wSelect, cLabel, cSelect);
    }
    // Food entry - append items
    const foodKey = selectedDateKey+'-food';
    const fLabel = document.createElement('label'); fLabel.textContent='Bugün ne yedim?';
    const fInput = document.createElement('input'); fInput.type='text'; fInput.placeholder='Bir yiyecek girin';
    const addBtn = document.createElement('button'); addBtn.textContent='Ekle';
    const foodList = document.createElement('ul'); foodList.id='foodList';
    addBtn.addEventListener('click', () => {
        const val = fInput.value.trim();
        if (!val) return;
        const items = JSON.parse(localStorage.getItem(foodKey) || '[]');
        items.push(val);
        localStorage.setItem(foodKey, JSON.stringify(items));
        fInput.value = '';
        renderFoodList();
    });
    function renderFoodList() {
        foodList.innerHTML = '';
        const items = JSON.parse(localStorage.getItem(foodKey) || '[]');
        items.forEach(item => {
            const li = document.createElement('li'); li.textContent = item;
            foodList.append(li);
        });
    }
    selectionPanel.append(fLabel, fInput, addBtn, foodList);
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
    weightChart.data.datasets[0].data=[wDone, wNot];
    cardioChart.data.datasets[0].data=[cDone, cNot];
    weightChart.update();
    cardioChart.update();
}

prevBtn.addEventListener('click', ()=>{ selectedMonth--; if(selectedMonth<0){selectedMonth=11;selectedYear--;} selectedDateKey=null; renderCalendar(); updateCharts(); });
nextBtn.addEventListener('click', ()=>{ selectedMonth++; if(selectedMonth>11){selectedMonth=0;selectedYear++;} selectedDateKey=null; renderCalendar(); updateCharts(); });

// Initial load
renderCalendar(); updateCharts();
