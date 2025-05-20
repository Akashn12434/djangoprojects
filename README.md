Setup and Installation
Step 1: Clone the Repository

git clone https://github.com/Akan12434/djangoprojects.git
cd djangoprojects
Step 2: Activate Virtual Environment

cd C:\Users\user
internip\Scripts\activate
Step 3: Install Dependencies

pip install -r requirements.txt
Step 4: Apply Database Migrations

python manage.py makemigrations
python manage.py migrate
Step 5: Run Django Server

python manage.py runserver
Access the application at http://127.0.0.1:8000/

Stop the server using CTRL + BREAK

Running the Application
Step 6: Start RabbitMQ

rabbitmq-service start
The RabbitMQ service will start successfully.

Ensure RabbitMQ is running properly before proceeding.

Step 7: Start Celery Worker

celery -A djangoprojects worker --loglevel=info --pool=solo

---

This project demonstrates web scraping, data storage, and sentiment analysis, all tied together through a user-friendly API. Let us know if you encounter issues, or feel free to contribute with improvements!


