-- PostgreSQL Database Setup for Nocodile
-- Run this script as postgres superuser

-- Create user
CREATE USER nocodile_user WITH PASSWORD 'nocodile_pass';

-- Create database
CREATE DATABASE nocodile_db OWNER nocodile_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE nocodile_db TO nocodile_user;

-- Connect to the database and grant schema privileges
\c nocodile_db
GRANT ALL ON SCHEMA public TO nocodile_user;
