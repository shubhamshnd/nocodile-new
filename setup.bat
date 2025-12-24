@echo off
echo ========================================
echo Nocodile Platform Setup
echo ========================================

echo.
echo Step 1: Setting up PostgreSQL database...
echo Please ensure PostgreSQL is running and run the following SQL:
echo.
echo   CREATE USER nocodile_user WITH PASSWORD 'nocodile_pass';
echo   CREATE DATABASE nocodile_db OWNER nocodile_user;
echo   GRANT ALL PRIVILEGES ON DATABASE nocodile_db TO nocodile_user;
echo.
pause

echo.
echo Step 2: Installing Python dependencies...
cd /d "%~dp0Nocodile"
pip install -r requirements.txt

echo.
echo Step 3: Running Django migrations...
python manage.py makemigrations
python manage.py migrate

echo.
echo Step 4: Creating admin user...
python manage.py setup_admin

echo.
echo Step 5: Installing frontend dependencies...
cd /d "%~dp0nocodile-frontend"
call npm install

echo.
echo ========================================
echo Setup complete!
echo.
echo To start the backend:
echo   cd Nocodile
echo   python manage.py runserver
echo.
echo To start the frontend:
echo   cd nocodile-frontend
echo   npm run dev
echo.
echo Login credentials: admin / admin123
echo ========================================
pause
