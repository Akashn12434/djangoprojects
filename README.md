## Setup and Installation

### Step 1: Clone the Repository
### Download the Django project from GitHub
```bash
git clone https://github.com/Akan12434/djangoprojects.git  
cd djangoprojects
```

### Step 2: Activate Virtual Environment
### Navigate to the user directory and activate the Python virtual environment
```bash
cd C:\Users\user  
internship\Scripts\activate
``` 

### Step 3: Install Dependencies
### Install required dependencies from the requirements.txt file
```bash
pip install -r requirements.txt
```

### Step 4: Apply Database Migrations
### Generate migration files based on model changes
```bash
python manage.py makemigrations
```

### Apply migrations to the database
```bash
python manage.py migrate
```

### Step 5: Run Django Server
### Start the local development server
```bash
python manage.py runserver
```

### Access the application at:
```bash
### http://127.0.0.1:8000/
```

### Stop the server using CTRL + BREAK

### Step 6: Start RabbitMQ
### Start the RabbitMQ service to handle background tasks
```bash
rabbitmq-service start
```

# Ensure RabbitMQ is running properly before proceeding.

### Step 7: Start Celery Worker
# Start Celery to process background tasks asynchronously
```bash
celery -A djangoprojects worker --loglevel=info --pool=solo
```
### Run the server 
```bash
### http://127.0.0.1:8000/
```

