# Face Recognition Attendance System

This project implements a smart attendance system using face recognition technology. It provides a web-based interface for managing students, marking attendance, and viewing attendance records. The system leverages Flask for the backend API, MySQL for database management, and `face_recognition` library for facial recognition capabilities.

## Features

*   **Student Management:** Add, view, and delete student records, including their facial images.
*   **Course and Section Management:** Organize students by courses, semesters, and sections.
*   **Face Recognition Attendance Marking:** Mark attendance by uploading classroom images, with automatic face detection and recognition against known student faces.
*   **Attendance Records:** View and filter attendance records by course, semester, section, subject, and date range.
*   **Debug Image Viewer:** A web interface to view debug images generated during face recognition, aiding in troubleshooting and monitoring.

## Technologies Used

**Backend:**
*   **Python 3.x**
*   **Flask:** Web framework for building the API.
*   **face_recognition:** Library for face detection and recognition.
*   **OpenCV (cv2):** Used by `face_recognition` for image processing.
*   **NumPy:** Numerical computing library, used by `face_recognition`.
*   **mysql-connector-python:** MySQL database connector for Python.
*   **Flask-CORS:** For handling Cross-Origin Resource Sharing.
*   **Werkzeug:** WSGI utility library.

**Frontend:**
*   **HTML5**
*   **CSS3**
*   **JavaScript**

**Database:**
*   **MySQL**

## Setup Instructions

Follow these steps to set up and run the project locally.

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/face-recognition-attendance-system.git
cd face-recognition-attendance-system
```

### 2. Backend Setup

Navigate to the `backend` directory and set up the Python environment.

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
pip install -r requirements.txt
```

### 3. MySQL Database Setup

1.  **Install MySQL:** If you don't have MySQL installed, download and install it from the official MySQL website or use your system's package manager.
2.  **Create Database and Tables:**
    *   Log in to your MySQL server (e.g., `mysql -u root -p`).
    *   Execute the SQL commands from `backend/database.sql` to create the `attendance_db` database and necessary tables.

    ```sql
    -- In your MySQL client:
    CREATE DATABASE attendance; -- Note: The app uses 'attendance' as the database name, not 'attendance_db' as in database.sql
    USE attendance;

    -- Create a table for storing student information
    CREATE TABLE students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        roll_number VARCHAR(50) NOT NULL UNIQUE,
        course VARCHAR(100) NOT NULL,
        semester VARCHAR(20) NOT NULL,
        section VARCHAR(20) NOT NULL,
        image_path VARCHAR(255)
    );

    -- Create a table for storing attendance records
    CREATE TABLE attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        roll_no VARCHAR(50) NOT NULL, -- Added roll_no for easier querying
        date DATE NOT NULL,
        present BOOLEAN DEFAULT TRUE,
        subject VARCHAR(100),
        course VARCHAR(100),
        semester VARCHAR(20),
        section VARCHAR(20),
        FOREIGN KEY (student_id) REFERENCES students(id)
    );

    -- Create a table for courses (if not already present from previous runs)
    CREATE TABLE IF NOT EXISTS courses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description VARCHAR(255)
    );

    -- Insert default courses (if needed, or manage via API)
    INSERT IGNORE INTO courses (name) VALUES ('MCA'), ('M.Tech'), ('MBA (MS)'), ('MBA(TOURISM)'), ('B PHARAMA'), ('BBA');
    ```
    **Note:** The `app.py` uses `database: 'attendance'` in `DB_CONFIG`. Ensure your database name matches this. The provided `database.sql` initially creates `attendance_db`, but the application expects `attendance`. I've updated the SQL snippet above to reflect the correct database name.

4.  **Update Database Configuration:**
    Open `backend/app.py` and update the `DB_CONFIG` dictionary with your MySQL credentials:

    ```python
    DB_CONFIG = {
        'host': 'localhost',
        'user': 'root',          # Your MySQL username
        'password': 'Abhishek@1512',  # Your MySQL password
        'database': 'attendance'
    }
    ```

### 4. Run the Backend Server

From the `backend` directory, run the Flask application:

```bash
python app.py
```
The server will typically run on `http://0.0.0.0:5500`.

### 5. Frontend Usage

The frontend is a collection of HTML, CSS, and JavaScript files. You can access them directly in your web browser.

*   Open `frontend/index.html` in your web browser to access the main application.
*   The application will communicate with the backend running on `http://localhost:5500`.

## Usage

1.  **Add Students:** Navigate to the "Manage Students" section to add new students. You will need to provide their details and upload a clear photo of their face. The system will store these images in `backend/known_images/` organized by course, semester, and section.
2.  **Mark Attendance:** Go to the "Mark Attendance" section. Select the course, semester, section, and subject. Upload an image containing faces of students. The system will process the image, recognize known students, and mark their attendance.
3.  **View Attendance:** In the "View Attendance" section, you can filter and view attendance records based on various criteria.

## Project Structure

```
face-recognition-attendance-system/
├── backend/
│   ├── app.py                      # Flask application main file
│   ├── attendance_db.json          # (Legacy/Dummy)
│   ├── attendance.db               # (Legacy/Dummy)
│   ├── database.sql                # MySQL database schema
│   ├── face_recognition_utils.py   # Face recognition helper functions
│   ├── models.py                   # (Currently unused, likely for ORM)
│   ├── requirements.txt            # Python dependencies
│   ├── __pycache__/                # Python cache files
│   ├── known_images/               # Stores student reference images (organized by course/semester/section)
│   │   └── ...
│   └── static/
│       ├── debug_images/           # Stores debug images from face recognition
│       └── uploads/                # Temporary storage for uploaded images
├── frontend/
│   ├── index.html                  # Main application page
│   ├── login.html                  # Login page
│   ├── manage-students.html        # Page for managing student records
│   ├── mark-attendance.html        # Page for marking attendance
│   ├── view-attendance.html        # Page for viewing attendance records
│   ├── img/                        # Image assets for frontend
│   └── js/                         # JavaScript files for frontend logic
│       ├── index.js
│       ├── manage-students.js
│       ├── mark-attendance.js
│       └── view-attendance.js
└── README.md                       # Project README file
```

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. (Note: A `LICENSE` file is not currently present in the repository. Consider adding one.)