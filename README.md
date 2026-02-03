# EventIQ - Smart College Event Registration Management System

EventIQ is a modern, responsive, and feature-rich web application designed to streamline the process of college event registration and management. It provides separate interfaces for students and administrators, allowing for seamless event discovery and organizational control.

## 🚀 Features

### For Students
- **Smart Login**: Easy access using ID or Email.
- **Event Discovery**: View all upcoming college events with real-time capacity tracking.
- **One-Click Registration**: Quick registration for events with instant feedback.
- **My Registrations**: Manage and track all your registered events in a personalized dashboard.
- **Unregister Option**: Flexibility to unregister from events if plans change.

### For Administrators
- **Comprehensive Dashboard**: View key statistics including total registrations and average attendance.
- **Event Management**: Full CRUD (Create, Read, Update, Delete) capabilities for events.
- **Dynamic Capacity**: Set specific event capacities or mark them as "Unlimited".
- **User Management**: Monitor student registrations and user activity.
- **Real-time Stats**: Track event popularity and attendance metrics.

## 🛠️ Tech Stack

- **Backend**: Python 3.x, Flask
- **Database**: SQLite3
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Modern, responsive design with glassmorphism and micro-animations.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Python 3.x
- pip (Python package manager)

## ⚙️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/EventIQ-Smart-Event-Management.git
   cd EventIQ-Smart-Event-Management
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   python app.py
   ```

4. **Access the app**
   Open your browser and navigate to `http://127.0.0.1:5000`

## 📂 Project Structure

```text
├── app.py              # Main Flask application and API routes
├── college_events.db   # SQLite database (auto-generated)
├── requirements.txt    # Project dependencies
├── static/
│   ├── css/            # Specialized stylesheets (login, student, admin)
│   ├── js/             # Frontend logic and API integration
│   └── images/         # Project assets and logos
└── templates/
    ├── login.html      # Landing and authentication page
    ├── student.html    # Student dashboard
    └── admin.html      # Administrator control panel
```

## 🔐 Credentials (Demo)

- **Admin Access**: Login using any email/ID and select the "Admin" role.
- **Student Access**: Login using any email/ID and select the "Student" role.
*(Note: In a production environment, you should implement a secure authentication system.)*

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! If you have suggestions or want to improve the system:
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---
Developed as part of an Internship Project for a Smart College Event Registration Management System.
