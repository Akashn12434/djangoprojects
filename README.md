## Setup and Installation

### Step 1: Clone the Repository
# Download the Django project from GitHub
```bash
git clone https://github.com/Akan12434/djangoprojects.git  
cd djangoprojects
```

### Step 2: Activate Virtual Environment
# Navigate to the user directory and activate the Python virtual environment
cd C:\Users\user  
internship\Scripts\activate  

### Step 3: Install Dependencies
# Install required dependencies from the requirements.txt file
pip install -r requirements.txt  

### Step 4: Apply Database Migrations
# Generate migration files based on model changes
python manage.py makemigrations  

# Apply migrations to the database
python manage.py migrate  

### Step 5: Run Django Server
# Start the local development server
python manage.py runserver  

# Access the application at:
# http://127.0.0.1:8000/

# Stop the server using CTRL + BREAK

### Step 6: Start RabbitMQ
# Start the RabbitMQ service to handle background tasks
rabbitmq-service start  

# Ensure RabbitMQ is running properly before proceeding.

### Step 7: Start Celery Worker
# Start Celery to process background tasks asynchronously
celery -A djangoprojects worker --loglevel=info --pool=solo  
