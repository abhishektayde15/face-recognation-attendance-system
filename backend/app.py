# app.py
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import sys
import traceback
from werkzeug.utils import secure_filename
from datetime import date, datetime
import mysql.connector
from mysql.connector import Error
import face_recognition
import cv2
import numpy as np
import time
from datetime import datetime
from flask import send_from_directory
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

UPLOAD_FOLDER = 'uploads/'
KNOWN_FOLDER = 'known_images/'
DEBUG_FOLDER = 'static/debug_images'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(KNOWN_FOLDER, exist_ok=True)
os.makedirs(DEBUG_FOLDER, exist_ok=True)

# MySQL Configuration
DB_CONFIG = {
    'host': 'localhost',     # Change as needed
    'user': 'root',          # Change to your MySQL username
    'password': 'Abhishek@1512',  # Change to your MySQL password
    'database': 'attendance' # This is the database name
}

# Dummy database to keep attendance (for backward compatibility)
attendance_db = {}

# Set up MySQL database connection
def create_connection():
    conn = None
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except Error as e:
        print(f"Error connecting to MySQL database: {e}")
    return conn

# Helper function to get table name for a course
def get_table_name_for_course(course):
    return f"students_{course.replace('.', '').replace(' ', '_').replace('(', '').replace(')', '')}"

# def create_tables():
#     conn = create_connection()
#     if conn is not None:
#         try:
#             cursor = conn.cursor()
            
#             # Create course list table
#             cursor.execute('''
#                 CREATE TABLE IF NOT EXISTS courses (
#                     id INT AUTO_INCREMENT PRIMARY KEY,
#                     name VARCHAR(100) NOT NULL UNIQUE,
#                     description VARCHAR(255)
#                 )
#             ''')
            
#             # Insert default courses if they don't exist
#             courses = ['MCA', 'M.Tech', 'MBA (MS)', 'MBA(TOURISM)', 'B PHARAMA', 'BBA']
#             for course in courses:
#                 try:
#                     cursor.execute(
#                         "INSERT INTO courses (name) VALUES (%s)",
#                         (course,)
#                     )
#                     conn.commit()
#                 except:
#                     # Ignore duplicate key errors
#                     conn.rollback()
            
#             # Get all courses and create a table for each
#             cursor.execute("SELECT name FROM courses")
#             course_names = cursor.fetchall()
            
#             for course_tuple in course_names:
#                 course_name = course_tuple[0]
#                 table_name = get_table_name_for_course(course_name)
                
#                 # Create course-specific students table
#                 cursor.execute(f'''
#                     CREATE TABLE IF NOT EXISTS {table_name} (
#                         id INT AUTO_INCREMENT PRIMARY KEY,
#                         name VARCHAR(255) NOT NULL,
#                         roll_number VARCHAR(50) NOT NULL,
#                         semester VARCHAR(20) NOT NULL,
#                         section VARCHAR(20) NOT NULL,
#                         image_path VARCHAR(255)
#                     )
#                 ''')
                
#                 # Create course-specific attendance table
#                 cursor.execute(f'''
#                     CREATE TABLE IF NOT EXISTS attendance_{table_name} (
#                         id INT AUTO_INCREMENT PRIMARY KEY,
#                         student_id INT,
#                         date DATE NOT NULL,
#                         present BOOLEAN DEFAULT TRUE,
#                         FOREIGN KEY (student_id) REFERENCES {table_name}(id)
#                     )
#                 ''')
            
#             # Keep the original students table for backward compatibility
#             cursor.execute('''
#                 CREATE TABLE IF NOT EXISTS students (
#                     id INT AUTO_INCREMENT PRIMARY KEY,
#                     name VARCHAR(255) NOT NULL,
#                     roll_number VARCHAR(50) NOT NULL,
#                     course VARCHAR(100) NOT NULL,
#                     semester VARCHAR(20) NOT NULL,
#                     section VARCHAR(20) NOT NULL,
#                     image_path VARCHAR(255)
#                 )
#             ''')
            
#             # Keep the original attendance table for backward compatibility
#             cursor.execute('''
#                 CREATE TABLE IF NOT EXISTS attendance (
#                     id INT AUTO_INCREMENT PRIMARY KEY,
#                     student_id INT,
#                     date DATE NOT NULL,
#                     present BOOLEAN DEFAULT TRUE,
#                     FOREIGN KEY (student_id) REFERENCES students(id)
#                 )
#             ''')
            
#             conn.commit()
#             print("All course tables created successfully")
#         except Error as e:
#             print(f"Error creating tables: {e}")
#             traceback.print_exc()
#         finally:
#             conn.close()

# # Call this function at app startup
# create_tables()

# Face recognition function
def recognize_faces(known_images, classroom_image_path):
    # Use a more lenient tolerance value (higher = more lenient)
    TOLERANCE = 0.5
    
    known_encodings = []
    student_ids = []
    course_names = []
    
    print(f"Processing classroom image: {classroom_image_path}")
    print(f"Using {len(known_images)} reference images")
    
    # First process all known images
    for img in known_images:
        try:
            print(f"Loading reference image: {img}")
            
            # Extract student roll number from filename
            filename = os.path.basename(img)
            roll_number = os.path.splitext(filename)[0]
            print(f"Processing roll number: {roll_number}")
            
            # Normalize path here (convert backslashes to forward slashes)
            normalized_path = img.replace('\\', '/')
            
            known_image = face_recognition.load_image_file(img)
            # Get face locations first
            face_locations = face_recognition.face_locations(known_image)
            
            # Only use the face if we found one
            if face_locations:
                encodings = face_recognition.face_encodings(known_image, [face_locations[0]])
                if encodings:
                    known_encodings.append(encodings[0])
                    
                    # Check if image is from database based on image path
                    try:
                        conn = create_connection()
                        if conn:
                            cursor = conn.cursor()
                            # Try with normalized path directly
                            cursor.execute("SELECT id, course FROM students WHERE image_path = %s", (normalized_path,))
                            result = cursor.fetchone()
                            
                            if result:
                                student_ids.append(result[0])
                                course_names.append(result[1])
                                print(f"Found student in database for image: {normalized_path}")
                            else:
                                # Try matching by roll number (case-insensitive)
                                cursor.execute("SELECT id, course FROM students WHERE UPPER(roll_number) = UPPER(%s)", (roll_number,))
                                result = cursor.fetchone()
                                
                                if result:
                                    student_ids.append(result[0])
                                    course_names.append(result[1])
                                    print(f"Found student by roll number: {roll_number}")
                                else:
                                    print(f"WARNING: No student record found for image: {img}")
                                    student_ids.append(None)
                                    course_names.append(None)
                            cursor.close()
                            conn.close()
                    except Exception as e:
                        print(f"Database error for {img}: {e}")
                        student_ids.append(None)
                        course_names.append(None)
            else:
                print(f"No face found in {img}")
        except Exception as e:
            print(f"Error processing image {img}: {e}")
    
    print(f"Successfully loaded {len(known_encodings)} face encodings")

    classroom_image = face_recognition.load_image_file(classroom_image_path)
    # Get face locations first to avoid detecting non-face areas
    classroom_face_locations = face_recognition.face_locations(classroom_image)
    print(f"Detected {len(classroom_face_locations)} faces in classroom image")
    
    # Disable face filtering completely - use all detected faces
    classroom_face_locations = classroom_face_locations
    print(f"After filtering small faces: {len(classroom_face_locations)} faces remain")
    
    classroom_encodings = face_recognition.face_encodings(classroom_image, classroom_face_locations)

    # UPDATED MATCHING LOGIC - OPTION 3
    import numpy as np
    matches = []
    for encoding in classroom_encodings:
        # Get face distances instead of boolean matches
        face_distances = face_recognition.face_distance(known_encodings, encoding)
        
        # Only consider it a match if the best distance is below our threshold
        best_match_index = np.argmin(face_distances) if len(face_distances) > 0 else -1
        best_match_distance = face_distances[best_match_index] if best_match_index >= 0 else 1.0
        
        # Convert to boolean results but only count as match if good enough
        if best_match_distance <= (1 - TOLERANCE):
            # Create a results array of all False except for the best match
            results = [False] * len(known_encodings)
            results[best_match_index] = True
        else:
            # No good matches
            results = [False] * len(known_encodings)
            
        matches.append(results)
    
    # Count how many matches were found
    match_count = 0
    for match_list in matches:
        if True in match_list:
            match_count += 1
    
    print(f"Found {match_count} potential matches")
    
    # Create a debug visualization
    debug_img = cv2.imread(classroom_image_path)
    
    # Draw boxes around all detected faces
    for i, face_location in enumerate(classroom_face_locations):
        top, right, bottom, left = face_location
        
        # Get match status for this face
        if i < len(matches):
            has_match = any(matches[i])
        else:
            has_match = False
        
        # Draw rectangle with color based on match
        if has_match:
            # Green for match
            color = (0, 255, 0)
        else:
            # Red for no match
            color = (0, 0, 255)
            
        # Draw face rectangle
        cv2.rectangle(debug_img, (left, top), (right, bottom), color, 2)
        
        # Add confidence values if there's a match
        if has_match and i < len(matches):
            match_index = matches[i].index(True) if True in matches[i] else -1
            if match_index >= 0 and match_index < len(known_encodings):
                # Calculate face distance (lower is better)
                face_distance = face_recognition.face_distance([known_encodings[match_index]], 
                                                             classroom_encodings[i])[0]
                confidence = round((1 - face_distance) * 100, 2)
                
                # Draw confidence text
                cv2.putText(debug_img, f"{confidence}%", 
                          (left, top - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                
                # Draw filename
                img_path = known_images[match_index]
                filename = os.path.basename(img_path)
                cv2.putText(debug_img, filename, 
                          (left, bottom + 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
    
    # Save debug image with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    debug_filename = f"{DEBUG_FOLDER}/debug_{timestamp}.jpg"
    cv2.imwrite(debug_filename, debug_img)
    print(f"Debug image saved to {debug_filename}")

    return matches, student_ids, course_names
@app.route("/")
def home():
    return "Flask backend is running!"

# Add these routes to serve HTML files
@app.route('/terminal-results')
def terminal_results():
    return send_from_directory('frontend', 'terminal-results.html')

@app.route('/working')
def working():
    return send_from_directory('frontend', 'working.html')

# Debug endpoint to check paths
@app.route('/debug-paths')
def debug_paths():
    current_dir = os.path.abspath(os.getcwd())
    frontend_dir = os.path.join(current_dir, 'frontend')
    files_in_frontend = os.listdir(frontend_dir) if os.path.exists(frontend_dir) else "Frontend directory not found!"
    
    return jsonify({
        "current_directory": current_dir,
        "frontend_directory": frontend_dir,
        "frontend_exists": os.path.exists(frontend_dir),
        "files_in_frontend": files_in_frontend,
        "python_path": sys.path
    })

# Add debug images viewer
@app.route('/debug-images')
def debug_images():
    image_list = []
    if os.path.exists(DEBUG_FOLDER):
        for filename in sorted(os.listdir(DEBUG_FOLDER), reverse=True):
            if filename.endswith('.jpg'):
                image_list.append(filename)
    
    html = "<h1>Debug Images</h1><p>Click to view full size</p>"
    for img in image_list:
        html += f'<div style="margin-bottom: 20px;"><h3>{img}</h3>'
        html += f'<a href="/static/debug_images/{img}" target="_blank">'
        html += f'<img src="/static/debug_images/{img}" width="600"></a></div>'
    
    return html

# Add this general route to serve any static file
@app.route('/<path:filename>')
def serve_static(filename):
    try:
        # First try to find the file in the frontend directory
        frontend_dir = os.path.join(os.path.abspath(os.getcwd()), 'frontend')
        if os.path.exists(os.path.join(frontend_dir, filename)):
            return send_from_directory(frontend_dir, filename)
        # Then try the current directory (where app.py is)
        elif os.path.exists(os.path.join('.', filename)):
            return send_from_directory('.', filename)
        # Also serve from static directory
        elif filename.startswith('static/') and os.path.exists(filename):
            parts = filename.split('/', 1)
            if len(parts) > 1:
                return send_from_directory('static', parts[1])
        else:
            # If not found, return a helpful error
            return jsonify({
                "error": f"File {filename} not found",
                "frontend_dir": frontend_dir,
                "current_dir": os.path.abspath(os.getcwd()),
                "files_in_frontend": os.listdir(frontend_dir) if os.path.exists(frontend_dir) else "Frontend directory not found!",
                "files_in_current": os.listdir('.')
            }), 404
    except Exception as e:
        return jsonify({
            "error": str(e),
            "traceback": traceback.format_exc()
        }), 500

# Get all available courses
@app.route('/api/courses', methods=['GET'])
def get_courses():
    try:
        conn = create_connection()
        if conn is not None:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT * FROM courses")
            courses = cursor.fetchall()
            conn.close()
            return jsonify({"courses": courses}), 200
        else:
            return jsonify({"error": "Database connection failed"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/attendance', methods=['POST'])
def mark_attendance():
    try:
        # Handle file upload
        if 'photos' not in request.files:
            return jsonify({'error': 'No photo files provided'}), 400
            
        # Get uploaded files
        photo_files = request.files.getlist('photos')
        
        # Get additional parameters
        course = request.form.get('course', '')
        semester = request.form.get('semester', '')
        section = request.form.get('section', '')
        subject = request.form.get('subject', '')
        
        print(f"Processing attendance: Course={course}, Semester={semester}, Section={section}, Subject={subject}")
        
        if not photo_files:
            return jsonify({'error': 'No photos selected'}), 400
            
        # ONLY look in the specific course folder structure
        known_images = []
        
        # IMPORTANT: Look in course-specific folder structure
        if course and semester and section:
            specific_folder = os.path.join(KNOWN_FOLDER, course, f"semester_{semester}", f"section_{section}")
            if os.path.exists(specific_folder):
                print(f"Looking in specific folder: {specific_folder}")
                for filename in os.listdir(specific_folder):
                    if filename.endswith('.jpg') or filename.endswith('.jpeg') or filename.endswith('.png'):
                        file_path = os.path.join(specific_folder, filename)
                        known_images.append(file_path)
                print(f"Found {len(known_images)} reference images in {specific_folder}")
            else:
                print(f"WARNING: The specified folder {specific_folder} doesn't exist!")
        
        if not known_images:
            return jsonify({'error': f'No reference images found for Course: {course}, Semester: {semester}, Section: {section}'}), 400
        
        # Process each uploaded photo
        all_matches = []
        all_student_ids = []
        all_course_names = []
        
        for photo_file in photo_files:
            # Save the uploaded file temporarily
            filename = secure_filename(photo_file.filename)
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            
            os.makedirs(UPLOAD_FOLDER, exist_ok=True)
            photo_file.save(file_path)
            print(f"Saved uploaded photo to {file_path}")
            
            try:
                # Call recognize_faces with the current image
                matches, student_ids, course_names = recognize_faces(known_images, file_path)
                print(f"DEBUG - Matches found: {sum(1 for m in matches if True in m)}")
                
                all_matches.extend(matches)
                all_student_ids.extend(student_ids)
                all_course_names.extend(course_names)
                
            except Exception as e:
                print(f"Error in face recognition: {e}")
                import traceback
                traceback.print_exc()
                return jsonify({'error': f'Face recognition error: {str(e)}'}), 500
                
            # Clean up the uploaded file
            try:
                os.remove(file_path)
            except Exception as e:
                print(f"Could not remove temp file: {e}")
        
        # Find which students are present based on matches
        present_students = []
        
        # FIXED CODE HERE
        for i, match_list in enumerate(all_matches):
            # Check if this match_list contains any True values
            if any(match_list):
                # Find the index of the True value in the match list
                match_index = match_list.index(True)
                
                # Get the corresponding reference image
                if match_index < len(known_images):
                    ref_image = known_images[match_index]
                    
                    # Extract roll number from filename
                    filename = os.path.basename(ref_image)
                    roll_number = os.path.splitext(filename)[0]
                    
                    print(f"Found match with image: {ref_image}")
                    print(f"Extracted roll number: {roll_number}")
                    
                    # Look up student by roll number
                    try:
                        conn = create_connection()
                        if conn:
                            cursor = conn.cursor(dictionary=True)
                            
                            query = "SELECT * FROM students WHERE roll_number = %s"
                            if course:
                                query += " AND course = %s"
                                cursor.execute(query, (roll_number, course))
                            else:
                                cursor.execute(query, (roll_number,))
                            
                            student = cursor.fetchone()
                            
                            if student:
                                if not any(s.get('id') == student['id'] for s in present_students):
                                    present_students.append(student)
                                    print(f"Found student by roll number: {student['name']}")
                            
                            cursor.close()
                            conn.close()
                    except Exception as e:
                        print(f"Error looking up student by roll number: {e}")
        
        # REMOVED automatic saving of attendance here
        
        return jsonify({
            'students': present_students,
            'message': f'Found {len(present_students)} students'
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/store-attendance', methods=['POST'])
def store_attendance():
    try:
        # Get data from request
        data = request.json
        student_ids = data.get('student_ids', [])
        subject = data.get('subject', '')
        course = data.get('course', '')
        semester = data.get('semester', '')
        section = data.get('section', '')
        date = data.get('date', time.strftime('%Y-%m-%d'))

        if not student_ids or not subject:
            return jsonify({'error': 'Missing required parameters'}), 400

        # Store attendance records
        conn = create_connection()
        if conn:
            cursor = conn.cursor()
            
            stored_count = 0
            for student_id in student_ids:
                # First, get the student's roll number from students table
                cursor.execute("SELECT roll_number FROM students WHERE id = %s", (student_id,))
                student_data = cursor.fetchone()
                roll_no = student_data[0] if student_data and len(student_data) > 0 else student_id
                
                # Check if attendance already exists
                cursor.execute("""
                    SELECT * FROM attendance 
                    WHERE student_id = %s AND date = %s AND subject = %s
                """, (student_id, date, subject))
                
                if not cursor.fetchone():
                    # Insert new attendance record with course details and roll_no
                    cursor.execute("""
                        INSERT INTO attendance (student_id, roll_no, date, present, subject, course, semester, section)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """, (student_id, roll_no, date, 'present', subject, course, semester, section))
                    stored_count += 1
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return jsonify({
                'success': True,
                'message': f'Attendance stored for {stored_count} students'
            })
    
    except Exception as e:
        print(f"Error storing attendance: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500        
@app.route('/api/subjects', methods=['GET'])
def get_subjects():
    course = request.args.get('course', '')
    semester = request.args.get('semester', '')
    
    try:
        conn = create_connection()
        if conn is not None:
            cursor = conn.cursor(dictionary=True)
            
            # Query to get sections based on course and semester
            query = "SELECT DISTINCT section FROM students WHERE 1=1"
            params = []
            
            if course:
                query += " AND course = %s"
                params.append(course)
            
            if semester:
                query += " AND semester = %s"
                params.append(semester)
            
            cursor.execute(query, params)
            results = cursor.fetchall()
            
            # Extract unique sections
            sections = [result['section'] for result in results]
            
            # Add fixed list of subjects for dropdown
            subjects = ['Operating Systems', 'Cloud Computing', 'SAD', 'HCI', 'AI', 'Machine Learning']
            
            conn.close()
            return jsonify({"subjects": subjects}), 200
        else:
            return jsonify({"error": "Database connection failed"}), 500
    except Exception as e:
        print(f"Error in get_subjects: {e}")
        # Return fixed subjects as fallback
        subjects = ['Operating Systems', 'Cloud Computing', 'SAD', 'HCI', 'AI', 'Machine Learning']
        return jsonify({"subjects": subjects}), 200
# Add the rest of your API endpoints here...
@app.route('/api/get-attendance', methods=['GET'])
def get_attendance():
    try:
        # Get query parameters
        course = request.args.get('course', '')
        semester = request.args.get('semester', '')
        section = request.args.get('section', '')
        subject = request.args.get('subject', '')
        start_date = request.args.get('start_date', '')
        end_date = request.args.get('end_date', '')
        
        conn = create_connection()
        if conn:
            cursor = conn.cursor()
            
            # Using roll_no from attendance table
            query = """
                SELECT a.id, s.name, a.roll_no, a.date, a.present, 
                       a.subject, a.course, a.semester, a.section
                FROM attendance a
                JOIN students s ON a.student_id = s.id
                WHERE 1=1
            """
            params = []
            
            # Add filters if provided
            if course and course != "All Courses":
                query += " AND a.course = %s"
                params.append(course)
            
            if semester and semester != "All Semesters":
                query += " AND a.semester = %s"
                params.append(semester)
                
            if section and section != "All Sections":
                query += " AND a.section = %s"
                params.append(section)
                
            if subject:
                query += " AND a.subject = %s"
                params.append(subject)
                
            if start_date:
                query += " AND a.date >= %s"
                params.append(start_date)
                
            if end_date:
                query += " AND a.date <= %s"
                params.append(end_date)
                
            # Order by date and name
            query += " ORDER BY a.date DESC, s.name"
            
            cursor.execute(query, params)
            
            # Get column names
            columns = [col[0] for col in cursor.description]
            
            # Fetch results and convert to dictionary
            results = []
            for row in cursor.fetchall():
                result_dict = {}
                for i, column in enumerate(columns):
                    value = row[i]
                    # Convert date to string if it's a date
                    if column == 'date' and value:
                        value = value.strftime('%Y-%m-%d')
                    result_dict[column] = value
                results.append(result_dict)
            
            cursor.close()
            conn.close()
            
            return jsonify({
                'success': True,
                'data': results,
                'count': len(results)
            })
            
    except Exception as e:
        print(f"Error retrieving attendance: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e), 'success': False}), 500
        
    return jsonify({'error': 'Database connection failed', 'success': False}), 500

# API endpoint to add a student via JSON
def ensure_dir(directory):
    if not os.path.exists(directory):
        os.makedirs(directory)
    return directory
@app.route('/api/add-student', methods=['POST'])
def add_student():
    try:
        # Get form data
        name = request.form.get('name')
        roll_number = request.form.get('roll_number')
        course = request.form.get('course')
        semester = request.form.get('semester')
        section = request.form.get('section')
        
        # Validate required fields
        if not all([name, roll_number, course, semester, section]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Check if student with this roll number already exists
        conn = create_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
            
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM students WHERE roll_number = %s", (roll_number,))
        if cursor.fetchone():
            return jsonify({'error': 'A student with this roll number already exists'}), 400
        
        # Process photo file
        if 'photo' not in request.files:
            return jsonify({'error': 'No photo uploaded'}), 400
            
        photo = request.files['photo']
        if photo.filename == '':
            return jsonify({'error': 'No photo selected'}), 400
            
        # Define the directory structure
        upload_dir = os.path.join('known_images', course, f'semester_{semester}', f'section_{section}')
        ensure_dir(upload_dir)
        
        # Save the file with roll number as name
        filename = f"{roll_number}.jpg"
        file_path = os.path.join(upload_dir, filename)
        photo.save(file_path)
        
        # Store student in database
        query = """
            INSERT INTO students (name, roll_number, course, semester, section, image_path)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        values = (name, roll_number, course, semester, section, file_path)
        
        cursor.execute(query, values)
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Student added successfully'
        })
        
    except Exception as e:
        print(f"Error adding student: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
        
@app.route('/api/get-students', methods=['GET'])
def get_students():
    try:
        course = request.args.get('course', '')
        semester = request.args.get('semester', '')
        section = request.args.get('section', '')
        
        conn = create_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
            
        cursor = conn.cursor()
        
        query = "SELECT id, name, roll_number, course, semester, section, image_path FROM students WHERE 1=1"
        params = []
        
        if course:
            query += " AND course = %s"
            params.append(course)
            
        if semester:
            query += " AND semester = %s"
            params.append(semester)
            
        if section:
            query += " AND section = %s"
            params.append(section)
            
        query += " ORDER BY name"
        
        cursor.execute(query, params)
        
        columns = [col[0] for col in cursor.description]
        students = []
        
        for row in cursor.fetchall():
            student = dict(zip(columns, row))
            
            # Add photo URL
            if 'photo_path' in student and student['image_path']:
                # Convert file path to URL
                file_path = student['photo_path']
                # Assuming the file is accessible at /static/known_images/...
                url_path = '/static/' + file_path.replace('\\', '/') 
                student['photo_url'] = url_path
            else:
                student['photo_url'] = '/static/default-avatar.jpg'
                
            students.append(student)
            
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'students': students
        })
        
    except Exception as e:
        print(f"Error getting students: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
@app.route('/api/delete-student/<int:student_id>', methods=['DELETE'])
def delete_student(student_id):
    try:
        conn = create_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
            
        cursor = conn.cursor()
        
        # Get student details to find photo
        cursor.execute("SELECT photo_path FROM students WHERE id = %s", (student_id,))
        student = cursor.fetchone()
        
        if not student:
            return jsonify({'error': 'Student not found'}), 404
            
        photo_path = student[0]
        
        # Delete from database
        cursor.execute("DELETE FROM students WHERE id = %s", (student_id,))
        conn.commit()
        
        # Delete photo file if exists
        if photo_path and os.path.exists(photo_path):
            try:
                os.remove(photo_path)
            except Exception as e:
                print(f"Warning: Could not delete photo file: {e}")
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Student deleted successfully'
        })
        
    except Exception as e:
        print(f"Error deleting student: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# List all students
@app.route('/api/students', methods=['GET'])
def list_students():
    try:
        # Get filter parameters
        course = request.args.get('course')
        semester = request.args.get('semester')
        section = request.args.get('section')
        
        conn = create_connection()
        if conn is not None:
            cursor = conn.cursor(dictionary=True)
            
            if course:
                # Try to use course-specific table
                table_name = get_table_name_for_course(course)
                try:
                    query = f"SELECT * FROM {table_name}"
                    params = []
                    
                    if semester:
                        query += " WHERE semester = %s"
                        params.append(semester)
                        
                        if section:
                            query += " AND section = %s"
                            params.append(section)
                    elif section:
                        query += " WHERE section = %s"
                        params.append(section)
                    
                    cursor.execute(query, params)
                    students = cursor.fetchall()
                    
                    # Add course information (not stored in course-specific tables)
                    for student in students:
                        student['course'] = course
                    
                    conn.close()
                    return jsonify({"students": students}), 200
                except Exception as e:
                    print(f"Error with course-specific table: {e}")
            
            # Fall back to general students table
            query = "SELECT * FROM students"
            params = []
            
            if course or semester or section:
                query += " WHERE"
                
                if course:
                    query += " course = %s"
                    params.append(course)
                    if semester or section:
                        query += " AND"
                
                if semester:
                    query += " semester = %s"
                    params.append(semester)
                    if section:
                        query += " AND"
                
                if section:
                    query += " section = %s"
                    params.append(section)
            
            cursor.execute(query, params)
            students = cursor.fetchall()
            
            conn.close()
            return jsonify({"students": students}), 200
        else:
            return jsonify({"error": "Failed to connect to database"}), 500
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500



if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5500)