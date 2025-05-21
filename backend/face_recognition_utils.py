import face_recognition
import mysql.connector
from mysql.connector import Error
import os
import cv2
import numpy as np
import base64
import time
from datetime import datetime

# MySQL Configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'Abhishek@1512',
    'database': 'attendance'
}

def create_mysql_connection():
    conn = None
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except Error as e:
        print(f"Error connecting to MySQL database: {e}")
    return conn

def recognize_faces(known_images, image_path, debug=True):
    print(f"Processing {image_path} with {len(known_images)} reference images")
    
    # Output folder for debug images
    output_folder = "static/debug_images"
    os.makedirs(output_folder, exist_ok=True)
    
    try:
        # Load the input image
        input_image = face_recognition.load_image_file(image_path)
        
        # Get face locations first
        face_locations = face_recognition.face_locations(input_image)
        
        if not face_locations:
            print(f"No faces found in {image_path}")
            return [], [], []
        
        # Get encodings for detected faces
        input_encodings = face_recognition.face_encodings(input_image, face_locations)
        
        if not input_encodings:
            print(f"No encodings could be generated for faces in {image_path}")
            return [], [], []
            
        # Process known images
        matches = []
        student_ids = []
        course_names = []
        
        # Create a copy of the image for debug visualization
        if debug:
            debug_image = input_image.copy()
            debug_image = cv2.cvtColor(debug_image, cv2.COLOR_RGB2BGR)
        
        # First, collect all known encodings
        known_encodings = []
        known_paths = []
        known_students = []  # Store student information for matched faces
        
        for known_img_path in known_images:
            try:
                # Extract student roll number from filename
                filename = os.path.basename(known_img_path)
                roll_number = os.path.splitext(filename)[0]
                print(f"Loading reference image: {roll_number}")
                
                # Add the path normalization here
                normalized_path = known_img_path.replace('\\', '/')
                
                # Try to find student in database
                student_info = None
                try:
                    conn = create_connection()
                    if conn:
                        cursor = conn.cursor(dictionary=True)
                        
                        # First try by normalized path
                        cursor.execute("SELECT id, course FROM students WHERE image_path = %s", (normalized_path,))
                        result = cursor.fetchone()
                        
                        if result:
                            student_info = result
                            print(f"Found student by path: {normalized_path}")
                        else:
                            # Try by roll number (case insensitive)
                            cursor.execute("SELECT id, course FROM students WHERE UPPER(roll_number) = UPPER(%s)", (roll_number,))
                            result = cursor.fetchone()
                            
                            if result:
                                student_info = result
                                print(f"Found student by roll number: {roll_number}")
                            else:
                                print(f"WARNING: No student found for {roll_number}")
                        
                        cursor.close()
                        conn.close()
                except Exception as e:
                    print(f"Database error for {known_img_path}: {e}")
                
                # Load known image
                known_image = face_recognition.load_image_file(known_img_path)
                known_face_encodings = face_recognition.face_encodings(known_image)
                
                if known_face_encodings:
                    known_encodings.append(known_face_encodings[0])
                    known_paths.append(known_img_path)
                    known_students.append(student_info)
                else:
                    print(f"No face found in reference image {known_img_path}")
            except Exception as e:
                print(f"Error loading reference image {known_img_path}: {e}")
        
        if not known_encodings:
            print("No valid reference images found!")
            return [], [], []
            
        print(f"Loaded {len(known_encodings)} valid reference images")
        
        # Process each detected face in the input image
        for i, input_encoding in enumerate(input_encodings):
            face_matches = []
            face_ids = []
            face_courses = []
            
            # Compare current face with all known faces
            face_matches_list = face_recognition.compare_faces(known_encodings, input_encoding, tolerance=0.6)
            face_distances = face_recognition.face_distance(known_encodings, input_encoding)
            
            print(f"Face #{i+1} match results: {face_matches_list}")
            
            # Add results for this face
            for j, match in enumerate(face_matches_list):
                if match:
                    confidence = 1 - face_distances[j]
                    confidence_percent = round(confidence * 100, 2)
                    ref_path = known_paths[j]
                    filename = os.path.basename(ref_path)
                    roll_number = os.path.splitext(filename)[0]
                    print(f"Face #{i+1} matched with {roll_number}: {confidence_percent}%")
                    
                    # Use student info if available
                    student_info = known_students[j]
                    student_id = student_info['id'] if student_info else None
                    course = student_info['course'] if student_info else None
                    
                    # Draw on debug image
                    if debug:
                        top, right, bottom, left = face_locations[i]
                        cv2.rectangle(debug_image, (left, top), (right, bottom), (0, 255, 0), 2)
                        label = f"{roll_number}: {confidence_percent}%"
                        cv2.putText(debug_image, label, (left, top - 10), 
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
                
                face_matches.append(match)
                face_ids.append(student_id if match else None)
                face_courses.append(course if match else None)
            
            # Only add this face's matches if there were any positive matches
            if any(face_matches_list):
                matches.extend(face_matches)
                student_ids.extend(face_ids)
                course_names.extend(face_courses)
        
        # Save debug image
        if debug and len(face_locations) > 0:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            debug_filename = os.path.join(output_folder, f"debug_{timestamp}_{os.path.basename(image_path)}")
            cv2.imwrite(debug_filename, debug_image)
            print(f"Debug image saved to: {debug_filename}")
        
        print(f"Final results - Matches: {matches}")
        return matches, student_ids, course_names
        
    except Exception as e:
        print(f"Error in recognize_faces: {e}")
        import traceback
        traceback.print_exc()
        return [], [], []