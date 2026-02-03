// Admin Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function () {
    loadUserInfo();
    loadEvents();
    loadStats();
    setupEventForm();
    setupModals();
});

// Load User Info
async function loadUserInfo() {
    try {
        const response = await fetch('/api/user');
        const data = await response.json();
        if (data.success) {
            document.getElementById('adminName').textContent = data.user.name;
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

// Setup Create Event Form
function setupEventForm() {
    const form = document.getElementById('createEventForm');
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const eventData = {
            name: document.getElementById('eventName').value.trim(),
            location: document.getElementById('eventLocation').value.trim(),
            date: document.getElementById('eventDate').value,
            time: document.getElementById('eventTime').value,
            capacity: document.getElementById('eventCapacity').value.trim() || '50'
        };

        if (!eventData.name || !eventData.date || !eventData.time) {
            showToast('Please fill all required fields', 'error');
            return;
        }

        try {
            const response = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventData)
            });

            const data = await response.json();

            if (data.success) {
                showToast('Event created successfully!', 'success');
                form.reset();
                document.getElementById('eventCapacity').value = '50';
                loadEvents();
                loadStats();
            } else {
                showToast(data.message || 'Failed to create event', 'error');
            }
        } catch (error) {
            console.error('Error creating event:', error);
            showToast('Failed to create event', 'error');
        }
    });
}

// Load Events
async function loadEvents() {
    const tableBody = document.getElementById('adminEventsTableBody');
    const emptyState = document.getElementById('adminEventsEmptyState');

    try {
        const response = await fetch('/api/events');
        const data = await response.json();

        if (data.success && data.events.length > 0) {
            tableBody.innerHTML = '';
            emptyState.style.display = 'none';

            data.events.forEach(event => {
                const badgeClass = event.registered_count > 100 ? 'high' :
                    event.registered_count > 30 ? 'medium' : 'low';

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <div class="event-name-cell">
                            <span class="event-name">${escapeHtml(event.name)}</span>
                            <span class="event-location">${escapeHtml(event.location || '')}</span>
                        </div>
                    </td>
                    <td>
                        <div class="event-datetime">
                            <div class="event-date-row">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/><path d="M16 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M8 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M3 10H21" stroke="currentColor" stroke-width="2"/></svg>
                                <span>${formatDate(event.date)}</span>
                            </div>
                            <div class="event-time-row">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                                <span>${formatTime(event.time)}</span>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="registration-badge ${badgeClass}">
                            ${event.registered_count} Students Registered
                        </span>
                    </td>
                    <td>
                        <div class="table-actions">
                            <button class="action-icon-btn" onclick="openEditModal(${event.id}, '${escapeHtml(event.name)}', '${escapeHtml(event.location || '')}', '${event.date}', '${event.time}', '${event.capacity}')" title="Edit">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            </button>
                            <button class="action-icon-btn delete" onclick="openDeleteModal(${event.id})" title="Delete">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            </button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(row);
            });

            document.getElementById('adminPaginationInfo').textContent =
                `Showing 1 to ${data.events.length} of ${data.events.length} active events`;
        } else {
            tableBody.innerHTML = '';
            emptyState.style.display = 'block';
            document.getElementById('adminPaginationInfo').textContent = 'Showing 0 events';
        }
    } catch (error) {
        console.error('Error loading events:', error);
        showToast('Failed to load events', 'error');
    }
}

// Load Stats
async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        const data = await response.json();

        if (data.success) {
            document.getElementById('totalRegistrations').textContent = data.stats.total_registrations;
            document.getElementById('totalEvents').textContent = data.stats.total_events;
            document.getElementById('avgAttendance').textContent = data.stats.avg_attendance;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Modal Management
let currentEditId = null;
let currentDeleteId = null;

function setupModals() {
    // Edit Modal
    document.getElementById('closeModal').addEventListener('click', closeEditModal);
    document.getElementById('cancelEdit').addEventListener('click', closeEditModal);
    document.getElementById('editEventForm').addEventListener('submit', handleEditSubmit);

    // Delete Modal
    document.getElementById('closeDeleteModal').addEventListener('click', closeDeleteModal);
    document.getElementById('cancelDelete').addEventListener('click', closeDeleteModal);
    document.getElementById('confirmDelete').addEventListener('click', handleDelete);

    // Close modals on background click
    document.getElementById('editModal').addEventListener('click', function (e) {
        if (e.target === this) closeEditModal();
    });
    document.getElementById('deleteModal').addEventListener('click', function (e) {
        if (e.target === this) closeDeleteModal();
    });
}

function openEditModal(id, name, location, date, time, capacity) {
    currentEditId = id;
    document.getElementById('editEventId').value = id;
    document.getElementById('editEventName').value = name;
    document.getElementById('editEventLocation').value = location;
    document.getElementById('editEventDate').value = date;
    document.getElementById('editEventTime').value = time;
    document.getElementById('editEventCapacity').value = capacity;
    document.getElementById('editModal').classList.add('active');
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    currentEditId = null;
}

async function handleEditSubmit(e) {
    e.preventDefault();

    const eventData = {
        name: document.getElementById('editEventName').value.trim(),
        location: document.getElementById('editEventLocation').value.trim(),
        date: document.getElementById('editEventDate').value,
        time: document.getElementById('editEventTime').value,
        capacity: document.getElementById('editEventCapacity').value.trim() || '50'
    };

    try {
        const response = await fetch(`/api/events/${currentEditId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
        });

        const data = await response.json();

        if (data.success) {
            showToast('Event updated successfully!', 'success');
            closeEditModal();
            loadEvents();
        } else {
            showToast(data.message || 'Failed to update event', 'error');
        }
    } catch (error) {
        console.error('Error updating event:', error);
        showToast('Failed to update event', 'error');
    }
}

function openDeleteModal(id) {
    currentDeleteId = id;
    document.getElementById('deleteModal').classList.add('active');
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
    currentDeleteId = null;
}

async function handleDelete() {
    try {
        const response = await fetch(`/api/events/${currentDeleteId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showToast('Event deleted successfully!', 'success');
            closeDeleteModal();
            loadEvents();
            loadStats();
        } else {
            showToast(data.message || 'Failed to delete event', 'error');
        }
    } catch (error) {
        console.error('Error deleting event:', error);
        showToast('Failed to delete event', 'error');
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

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast ' + type + ' show';
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
}
