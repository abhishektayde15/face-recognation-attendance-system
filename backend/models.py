from app import db
from datetime import datetime

class Course(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    students = db.relationship('Student', backref='course', lazy=True)
    subjects = db.relationship('Subject', backref='course', lazy=True)

class Subject(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    semester = db.Column(db.Integer, nullable=False)
    students = db.relationship('Student', secondary='student_subjects', backref='subjects', lazy=True)
    
    __table_args__ = (
        db.UniqueConstraint('name', 'course_id', 'semester', name='unique_subject_per_course_semester'),
    )

# Association table for student-subject many-to-many relationship
student_subjects = db.Table('student_subjects',
    db.Column('student_id', db.Integer, db.ForeignKey('student.id'), primary_key=True),
    db.Column('subject_id', db.Integer, db.ForeignKey('subject.id'), primary_key=True)
)

class Student(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    roll_number = db.Column(db.String(20), nullable=False)
    enrollment_number = db.Column(db.String(20), nullable=False, unique=True)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    semester = db.Column(db.Integer, nullable=False)
    section = db.Column(db.String(10), nullable=False)
    photo_path = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Combination of roll number and course should be unique
    __table_args__ = (
        db.UniqueConstraint('roll_number', 'course_id', name='unique_roll_per_course'),
    )

class Attendance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id'), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subject.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    is_present = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    subject = db.relationship('Subject')
    
    # A student can have only one attendance record per subject per day
    __table_args__ = (
        db.UniqueConstraint('student_id', 'subject_id', 'date', name='unique_student_attendance_per_day'),
    )