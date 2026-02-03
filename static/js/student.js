// Student Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function () {
    // Load user info
    loadUserInfo();
    // Load events
    loadEvents();
    // Load registrations
    loadMyRegistrations();

    // Tab Navigation
    const navLinks = document.querySelectorAll('.nav-link[data-tab]');
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            switchTab(this.dataset.tab);
        });
    });
});

// Switch Tab
function switchTab(tabName) {
    // Update nav links
    document.querySelectorAll('.nav-link[data-tab]').forEach(link => {
        link.classList.toggle('active', link.dataset.tab === tabName);
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(tabName + '-tab').classList.add('active');

    // Refresh data
    if (tabName === 'events') {
        loadEvents();
    } else if (tabName === 'registrations') {
        loadMyRegistrations();
    }
}

// Load User Info
async function loadUserInfo() {
    try {
        const response = await fetch('/api/user');
        const data = await response.json();

        if (data.success) {
            document.getElementById('userName').textContent = data.user.name;
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

// Store user's registrations
let userRegistrations = [];

// Load Events
async function loadEvents() {
    const tableBody = document.getElementById('eventsTableBody');
    const emptyState = document.getElementById('eventsEmptyState');
    const pagination = document.getElementById('eventsPagination');

    try {
        // First load user's registrations
        const regResponse = await fetch('/api/my-registrations');
        const regData = await regResponse.json();
        if (regData.success) {
            userRegistrations = regData.registrations.map(r => r.id);
        }

        // Then load all events
        const response = await fetch('/api/events');
        const data = await response.json();

        if (data.success && data.events.length > 0) {
            tableBody.innerHTML = '';
            emptyState.style.display = 'none';

            data.events.forEach(event => {
                const isRegistered = userRegistrations.includes(event.id);
                const capNum = parseInt(event.capacity);
                const hasLimit = !isNaN(capNum);
                const capacityPercent = hasLimit ? (event.registered_count / capNum) * 100 : 0;
                const isFull = hasLimit && event.registered_count >= capNum;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <div class="event-name-cell">
                            <span class="event-name">${escapeHtml(event.name)}</span>
                            <span class="event-location">${escapeHtml(event.location || '')}</span>
                        </div>
                    </td>
                    <td><span class="event-date">${formatDate(event.date)}</span></td>
                    <td><span class="event-time">${formatTime(event.time)}</span></td>
                    <td>
                        <div class="capacity-cell">
                            <span class="capacity-text">${event.registered_count}/${event.capacity}</span>
                            <div class="capacity-bar">
                                <div class="capacity-fill" style="width: ${Math.min(capacityPercent, 100)}%"></div>
                            </div>
                        </div>
                    </td>
                    <td>
                        ${isRegistered ?
                        `<button class="action-btn btn-joined" disabled>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                Joined
                            </button>` :
                        `<button class="action-btn btn-register" onclick="registerForEvent(${event.id})" ${isFull ? 'disabled' : ''}>
                                ${isFull ? 'Full' : 'Register'}
                            </button>`
                    }
                    </td>
                `;
                tableBody.appendChild(row);
            });

            document.getElementById('paginationInfo').textContent = `Showing ${data.events.length} available events`;
        } else {
            tableBody.innerHTML = '';
            emptyState.style.display = 'block';
            document.getElementById('paginationInfo').textContent = 'Showing 0 events';
        }
    } catch (error) {
        console.error('Error loading events:', error);
        showToast('Failed to load events', 'error');
    }
}

// Load My Registrations
async function loadMyRegistrations() {
    const tableBody = document.getElementById('registrationsTableBody');
    const emptyState = document.getElementById('registrationsEmptyState');

    try {
        const response = await fetch('/api/my-registrations');
        const data = await response.json();

        if (data.success && data.registrations.length > 0) {
            tableBody.innerHTML = '';
            emptyState.style.display = 'none';

            data.registrations.forEach(reg => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <div class="event-name-cell">
                            <span class="event-name">${escapeHtml(reg.name)}</span>
                            <span class="event-location">${escapeHtml(reg.location || '')}</span>
                        </div>
                    </td>
                    <td><span class="event-date">${formatDate(reg.date)}</span></td>
                    <td><span class="event-time">${formatTime(reg.time)}</span></td>
                    <td><span class="event-date">${formatDateTime(reg.registered_at)}</span></td>
                    <td>
                        <button class="action-btn btn-outline btn-sm" onclick="unregisterFromEvent(${reg.id})">
                            Cancel
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            tableBody.innerHTML = '';
            emptyState.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading registrations:', error);
        showToast('Failed to load registrations', 'error');
    }
}

// Register for Event
async function registerForEvent(eventId) {
    try {
        const response = await fetch(`/api/register/${eventId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();

        if (data.success) {
            showToast('Successfully registered for the event!', 'success');
            loadEvents();
        } else {
            showToast(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Error registering:', error);
        showToast('Failed to register', 'error');
    }
}

// Unregister from Event
async function unregisterFromEvent(eventId) {
    try {
        const response = await fetch(`/api/unregister/${eventId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();

        if (data.success) {
            showToast('Successfully unregistered from the event', 'success');
            loadMyRegistrations();
            loadEvents();
        } else {
            showToast(data.message || 'Failed to unregister', 'error');
        }
    } catch (error) {
        console.error('Error unregistering:', error);
        showToast('Failed to unregister', 'error');
    }
}

// Utility Functions
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function formatTime(timeStr) {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}

function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return '';
    const date = new Date(dateTimeStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

// Toast Notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast ' + type + ' show';

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
