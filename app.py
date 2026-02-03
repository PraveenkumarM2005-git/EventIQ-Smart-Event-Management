"""
EventIQ - Smart College Event Registration Management System
Backend: Python Flask with SQLite Database
"""

from flask import Flask, render_template, request, jsonify, redirect, url_for, session
import sqlite3
from datetime import datetime
import os

app = Flask(__name__)
app.secret_key = 'event_iq_smart_management_secret_key_2026'

DATABASE = 'college_events.db'

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize the database with required tables"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('student', 'admin')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create events table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            location TEXT,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            capacity TEXT NOT NULL DEFAULT '50',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create registrations table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS registrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            event_id INTEGER NOT NULL,
            registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (event_id) REFERENCES events (id),
            UNIQUE(user_id, event_id)
        )
    ''')
    
    conn.commit()
    
    # Add some demo data if tables are empty
    cursor.execute('SELECT COUNT(*) FROM events')
    if cursor.fetchone()[0] == 0:
        # Sample Events
        sample_events = [
            ('Annual Tech Symposium 2026', 'Main Auditorium', '2026-03-15', '10:00', '200'),
            ('Workshop on GenAI & LLMs', 'Tech Lab 1', '2026-02-20', '14:00', '50'),
            ('Inter-College Sports Meet', 'Sports Complex', '2026-04-10', '09:00', '500'),
            ('Cultural Night 2026', 'Open Air Theater', '2026-03-25', '18:30', 'Unlimited')
        ]
        cursor.executemany('''
            INSERT INTO events (name, location, date, time, capacity)
            VALUES (?, ?, ?, ?, ?)
        ''', sample_events)
        
        # Default Admin User
        cursor.execute('''
            INSERT OR IGNORE INTO users (name, email, role)
            VALUES (?, ?, ?)
        ''', ('Admin User', 'admin@college.edu', 'admin'))
        
        conn.commit()
    
    conn.close()

# Initialize the database on startup
init_db()

@app.route('/')
def index():
    """Render the login page"""
    return render_template('login.html')

@app.route('/login', methods=['POST'])
def login():
    """Handle user login - creates user if doesn't exist"""
    data = request.get_json()
    email = data.get('email', '').strip()
    role = data.get('role', 'student')
    
    if not email:
        return jsonify({'success': False, 'message': 'Please enter your ID or Email'})
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Check if user exists
    cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
    user = cursor.fetchone()
    
    if user:
        # User exists - check role matches
        if user['role'] != role:
            conn.close()
            return jsonify({'success': False, 'message': f'This account is registered as {user["role"]}'})
        
        session['user_id'] = user['id']
        session['user_name'] = user['name']
        session['user_email'] = user['email']
        session['user_role'] = user['role']
    else:
        # Create new user with email as name initially
        name = email.split('@')[0].title() if '@' in email else email.title()
        cursor.execute('INSERT INTO users (name, email, role) VALUES (?, ?, ?)', 
                      (name, email, role))
        conn.commit()
        
        user_id = cursor.lastrowid
        session['user_id'] = user_id
        session['user_name'] = name
        session['user_email'] = email
        session['user_role'] = role
    
    conn.close()
    
    redirect_url = '/admin' if role == 'admin' else '/student'
    return jsonify({'success': True, 'redirect': redirect_url})

@app.route('/logout')
def logout():
    """Handle user logout"""
    session.clear()
    return redirect('/')

@app.route('/student')
def student_dashboard():
    """Render student dashboard"""
    if 'user_id' not in session or session.get('user_role') != 'student':
        return redirect('/')
    return render_template('student.html')

@app.route('/admin')
def admin_dashboard():
    """Render admin dashboard"""
    if 'user_id' not in session or session.get('user_role') != 'admin':
        return redirect('/')
    return render_template('admin.html')

@app.route('/api/user')
def get_user():
    """Get current logged in user info"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not logged in'})
    
    return jsonify({
        'success': True,
        'user': {
            'id': session['user_id'],
            'name': session['user_name'],
            'email': session['user_email'],
            'role': session['user_role']
        }
    })

@app.route('/api/events')
def get_events():
    """Get all events with registration counts"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT e.*, 
               (SELECT COUNT(*) FROM registrations WHERE event_id = e.id) as registered_count
        FROM events e
        ORDER BY e.date ASC, e.time ASC
    ''')
    
    events = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify({'success': True, 'events': events})

@app.route('/api/events', methods=['POST'])
def create_event():
    """Create a new event (admin only)"""
    if session.get('user_role') != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'})
    
    data = request.get_json()
    name = data.get('name', '').strip()
    location = data.get('location', '').strip()
    date = data.get('date', '').strip()
    time = data.get('time', '').strip()
    capacity = data.get('capacity', 50)
    
    if not all([name, date, time]):
        return jsonify({'success': False, 'message': 'Please fill all required fields'})
    
    # Keep capacity as string to support "Unlimited" or other text
    if not capacity:
        capacity = '50'
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO events (name, location, date, time, capacity)
        VALUES (?, ?, ?, ?, ?)
    ''', (name, location, date, time, capacity))
    
    conn.commit()
    event_id = cursor.lastrowid
    conn.close()
    
    return jsonify({'success': True, 'event_id': event_id, 'message': 'Event created successfully'})

@app.route('/api/events/<int:event_id>', methods=['PUT'])
def update_event(event_id):
    """Update an event (admin only)"""
    if session.get('user_role') != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'})
    
    data = request.get_json()
    name = data.get('name', '').strip()
    location = data.get('location', '').strip()
    date = data.get('date', '').strip()
    time = data.get('time', '').strip()
    capacity = data.get('capacity', 50)
    
    if not all([name, date, time]):
        return jsonify({'success': False, 'message': 'Please fill all required fields'})
    
    # Keep capacity as string to support text
    if not capacity:
        capacity = '50'
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        UPDATE events SET name=?, location=?, date=?, time=?, capacity=?
        WHERE id=?
    ''', (name, location, date, time, capacity, event_id))
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Event updated successfully'})

@app.route('/api/events/<int:event_id>', methods=['DELETE'])
def delete_event(event_id):
    """Delete an event (admin only)"""
    if session.get('user_role') != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'})
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Delete registrations first
    cursor.execute('DELETE FROM registrations WHERE event_id = ?', (event_id,))
    # Delete event
    cursor.execute('DELETE FROM events WHERE id = ?', (event_id,))
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Event deleted successfully'})

@app.route('/api/register/<int:event_id>', methods=['POST'])
def register_for_event(event_id):
    """Register current user for an event"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Please login first'})
    
    user_id = session['user_id']
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Check if already registered
    cursor.execute('''
        SELECT * FROM registrations WHERE user_id = ? AND event_id = ?
    ''', (user_id, event_id))
    
    if cursor.fetchone():
        conn.close()
        return jsonify({'success': False, 'message': 'Already registered for this event'})
    
    # Check capacity
    cursor.execute('''
        SELECT e.capacity, 
               (SELECT COUNT(*) FROM registrations WHERE event_id = e.id) as registered_count
        FROM events e WHERE e.id = ?
    ''', (event_id,))
    
    event = cursor.fetchone()
    if not event:
        conn.close()
        return jsonify({'success': False, 'message': 'Event not found'})
    
    # Check capacity - only enforce if it's a number
    try:
        capacity_int = int(event['capacity'])
        if event['registered_count'] >= capacity_int:
            conn.close()
            return jsonify({'success': False, 'message': 'Event is full'})
    except (ValueError, TypeError):
        # If capacity is not a number (e.g. "Unlimited"), don't enforce limit
        pass
    
    # Register user
    cursor.execute('''
        INSERT INTO registrations (user_id, event_id) VALUES (?, ?)
    ''', (user_id, event_id))
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Successfully registered!'})

@app.route('/api/unregister/<int:event_id>', methods=['POST'])
def unregister_from_event(event_id):
    """Unregister current user from an event"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Please login first'})
    
    user_id = session['user_id']
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        DELETE FROM registrations WHERE user_id = ? AND event_id = ?
    ''', (user_id, event_id))
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Successfully unregistered'})

@app.route('/api/my-registrations')
def get_my_registrations():
    """Get current user's registrations"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Please login first'})
    
    user_id = session['user_id']
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT e.*, r.registered_at
        FROM events e
        JOIN registrations r ON e.id = r.event_id
        WHERE r.user_id = ?
        ORDER BY e.date ASC, e.time ASC
    ''', (user_id,))
    
    registrations = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify({'success': True, 'registrations': registrations})

@app.route('/api/stats')
def get_stats():
    """Get dashboard statistics (admin only)"""
    if session.get('user_role') != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'})
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Total registrations
    cursor.execute('SELECT COUNT(*) as count FROM registrations')
    total_registrations = cursor.fetchone()['count']
    
    # Total events
    cursor.execute('SELECT COUNT(*) as count FROM events')
    total_events = cursor.fetchone()['count']
    
    # Calculate average attendance - safely handle non-numeric capacity
    cursor.execute('SELECT capacity, (SELECT COUNT(*) FROM registrations WHERE event_id = e.id) as reg_count FROM events e')
    rows = cursor.fetchall()
    total_cap = 0
    total_reg = 0
    for row in rows:
        try:
            total_cap += int(row['capacity'])
            total_reg += row['reg_count']
        except (ValueError, TypeError):
            pass
    
    avg_attendance = int((total_reg * 100.0) / total_cap) if total_cap > 0 else 0
    
    conn.close()
    
    return jsonify({
        'success': True,
        'stats': {
            'total_registrations': total_registrations,
            'total_events': total_events,
            'avg_attendance': int(avg_attendance)
        }
    })

@app.route('/api/all-users')
def get_all_users():
    """Get all users (admin only)"""
    if session.get('user_role') != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'})
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT u.*, 
               (SELECT COUNT(*) FROM registrations WHERE user_id = u.id) as registration_count
        FROM users u
        WHERE u.role = 'student'
        ORDER BY u.created_at DESC
    ''')
    
    users = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify({'success': True, 'users': users})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
