-- Fitness Extreme / Lead Management Database Schema
CREATE DATABASE IF NOT EXISTS emirates_first;
USE emirates_first;

CREATE TABLE IF NOT EXISTS leads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS header_code_snippets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  type ENUM('HTML', 'CSS', 'JavaScript') NOT NULL,
  location ENUM('HEAD', 'BODY_START', 'BODY_END') NOT NULL,
  code MEDIUMTEXT NOT NULL,
  description VARCHAR(1000) NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_header_code_active_location (active, location, id),
  INDEX idx_header_code_updated_at (updated_at)
);
