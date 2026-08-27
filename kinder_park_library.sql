-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 27, 2026 at 02:59 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `kinder_park_library`
--

-- --------------------------------------------------------

--
-- Table structure for table `academic_years`
--

CREATE TABLE `academic_years` (
  `academic_year_id` int(11) NOT NULL,
  `year_code` varchar(20) NOT NULL COMMENT '2026-27',
  `year_name` varchar(50) DEFAULT NULL COMMENT 'Academic Year 2026-27',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_current` tinyint(1) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `academic_years`
--

INSERT INTO `academic_years` (`academic_year_id`, `year_code`, `year_name`, `start_date`, `end_date`, `is_current`, `is_active`, `created_at`, `updated_at`) VALUES
(1, '2024-25', 'Academic Year 2024-25', '2024-06-01', '2025-04-30', 0, 1, '2026-08-17 07:03:56', '2026-08-17 07:03:56'),
(2, '2025-26', 'Academic Year 2025-26', '2025-06-01', '2026-04-30', 1, 1, '2026-08-17 07:03:56', '2026-08-17 07:03:56'),
(3, '2026-27', 'Academic Year 2026-27', '2026-06-01', '2027-04-30', 0, 1, '2026-08-17 07:03:56', '2026-08-17 07:03:56');

-- --------------------------------------------------------

--
-- Table structure for table `alembic_version`
--

CREATE TABLE `alembic_version` (
  `version_num` varchar(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `alembic_version`
--

INSERT INTO `alembic_version` (`version_num`) VALUES
('20260827_student_uid_to_jk');

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `audit_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `username` varchar(50) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `module` varchar(50) DEFAULT NULL,
  `record_id` varchar(50) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`audit_id`, `user_id`, `username`, `action`, `module`, `record_id`, `details`, `ip_address`, `user_agent`, `created_at`) VALUES
(1, 1, 'admin', 'IMPORT_STUDENT_SPREADSHEET', 'Student', NULL, 'Imported 98 enrollment(s) from FLY _ Read To Rock! _ Lit Readers Membership Form 2026-27 (Responses).xlsx', NULL, NULL, '2026-08-18 15:17:18'),
(2, 1, 'admin', 'RESET_ALL_STUDENTS', 'Student', 'ALL', 'Cleared all student records, enrollments, and reset sequence counters.', NULL, NULL, '2026-08-18 16:53:12'),
(3, 1, 'admin', 'CREATE_PROGRAMME', 'Programme', 'LRL3', 'Created programme: LIT READERS LEVEL - III(8-10)', NULL, NULL, '2026-08-18 17:31:15'),
(4, 1, 'admin', 'CREATE_PROGRAMME', 'Programme', 'LRL4', 'Created programme: LIT READERS LEVEL - III(11-12)', NULL, NULL, '2026-08-18 17:31:49'),
(5, 1, 'admin', 'CREATE_PROGRAMME', 'Programme', 'LRL5', 'Created programme: LIT READERS LEVEL - V(13-14)', NULL, NULL, '2026-08-18 17:32:24'),
(6, 1, 'admin', 'CREATE_STUDENT', 'Student', 'STU0001', 'Created student: C. Iniya', NULL, NULL, '2026-08-18 17:36:03'),
(7, 1, 'admin', 'CREATE_STUDENT', 'Student', 'STU0002', 'Created student: A.V.Gowshith', NULL, NULL, '2026-08-18 17:38:41'),
(8, 1, 'admin', 'UPDATE_STUDENT', 'Student', 'STU0002', 'Updated student: A.V.Gowshith', NULL, NULL, '2026-08-18 18:56:28'),
(9, 1, 'admin', 'CREATE_SUBSCRIPTION_PLAN', 'Subscription', 'CAT', 'Created plan: Caterpillar', NULL, NULL, '2026-08-18 19:15:22'),
(10, 1, 'admin', 'CREATE_SUBSCRIPTION_PLAN', 'Subscription', 'BUT', 'Created plan: Butterfly', NULL, NULL, '2026-08-18 19:15:51'),
(11, 1, 'admin', 'CREATE_SUBSCRIPTION_PLAN', 'Subscription', 'ANU', 'Created plan: Annual', NULL, NULL, '2026-08-18 19:16:49'),
(12, 1, 'admin', 'ASSIGN_SUBSCRIPTION', 'Subscription', '2', 'Assigned plan Caterpillar to student 2', NULL, NULL, '2026-08-18 19:16:58'),
(13, 1, 'admin', 'DEPOSIT_TOPUP', 'Deposit', '2', 'Topped up 500 for student 2', NULL, NULL, '2026-08-18 19:17:26'),
(14, 1, 'admin', 'UPDATE_STUDENT', 'Student', 'STU0001', 'Updated student: C. Iniya', NULL, NULL, '2026-08-18 19:24:09'),
(15, 1, 'admin', 'LOGIN', 'Auth', NULL, 'User logged in successfully', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:04:12'),
(16, 1, 'admin', 'CREATE_STUDENT', 'Student', 'STU0003', 'Created student: Subitha K', NULL, NULL, '2026-08-19 07:10:42'),
(17, 1, 'admin', 'ASSIGN_SUBSCRIPTION', 'Subscription', '3', 'Assigned plan Butterfly to student 3', NULL, NULL, '2026-08-19 07:10:59'),
(18, 1, 'admin', 'CREATE_HOLIDAY', 'Settings', '1', 'Created 1 holiday date(s): Diwali', NULL, NULL, '2026-08-19 07:17:28'),
(19, 1, 'admin', 'CREATE_HOLIDAY', 'Settings', '2', 'Created 1 holiday date(s): Annual Leave', NULL, NULL, '2026-08-19 07:18:04'),
(20, 1, 'admin', 'CREATE_HOLIDAY', 'Settings', '3', 'Created 1 holiday date(s): Annual Leave', NULL, NULL, '2026-08-19 07:18:04'),
(21, 1, 'admin', 'CREATE_HOLIDAY', 'Settings', '4', 'Created 1 holiday date(s): Annual Leave', NULL, NULL, '2026-08-19 07:18:04'),
(22, 1, 'admin', 'CREATE_HOLIDAY', 'Settings', '5', 'Created 1 holiday date(s): Annual Leave', NULL, NULL, '2026-08-19 07:18:04'),
(23, 1, 'admin', 'CREATE_HOLIDAY', 'Settings', '6', 'Created 1 holiday date(s): Annual Leave', NULL, NULL, '2026-08-19 07:18:04'),
(24, 1, 'admin', 'CREATE_HOLIDAY', 'Settings', '7', 'Created 1 holiday date(s): Annual Leave', NULL, NULL, '2026-08-19 07:18:04'),
(25, 1, 'admin', 'CREATE_USER', 'User', '4', 'Created user: staff with role STAFF', NULL, NULL, '2026-08-19 07:24:10'),
(26, 4, 'staff', 'LOGIN', 'Auth', NULL, 'User logged in successfully', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:30'),
(27, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.stock without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:30'),
(28, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.financial without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:30'),
(29, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.member without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:30'),
(30, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.issue_return without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:30'),
(31, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.issue_return without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:30'),
(32, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.stock without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:30'),
(33, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.financial without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:30'),
(34, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.member without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:30'),
(35, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.issue_return without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:30'),
(36, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.issue_return without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:30'),
(37, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.stock without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:33'),
(38, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.member without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:33'),
(39, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.issue_return without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:33'),
(40, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.issue_return without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:33'),
(41, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.financial without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:33'),
(42, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.issue_return without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:34'),
(43, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.financial without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:34'),
(44, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.stock without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:34'),
(45, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.issue_return without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:34'),
(46, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.member without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:34'),
(47, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.stock without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:35'),
(48, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.financial without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:35'),
(49, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.member without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:35'),
(50, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.issue_return without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:35'),
(51, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.issue_return without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:35'),
(52, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.stock without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:35'),
(53, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.financial without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:35'),
(54, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.issue_return without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:35'),
(55, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.member without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:35'),
(56, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.issue_return without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:35'),
(57, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.issue_return without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:36'),
(58, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.financial without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:36'),
(59, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.stock without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:36'),
(60, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.issue_return without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:36'),
(61, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.member without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:36'),
(62, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.stock without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:43'),
(63, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.member without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:43'),
(64, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.financial without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:43'),
(65, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.issue_return without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:43'),
(66, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.issue_return without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:43'),
(67, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.member without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:43'),
(68, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.issue_return without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:43'),
(69, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.issue_return without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:43'),
(70, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.financial without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:43'),
(71, 4, 'staff', 'UNAUTHORIZED_ACCESS', 'Security', NULL, 'Attempted to access report.stock without permission', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 07:24:43'),
(72, 1, 'admin', 'CREATE_HOLIDAY', 'Settings', '8', 'Created 1 holiday date(s): Independence Day', NULL, NULL, '2026-08-19 08:40:24'),
(73, 1, 'admin', 'CREATE_HOLIDAY', 'Settings', '9', 'Created 1 holiday date(s): Independence Day', NULL, NULL, '2026-08-19 08:40:24'),
(74, 1, 'admin', 'CREATE_HOLIDAY', 'Settings', '10', 'Created 1 holiday date(s): Independence Day', NULL, NULL, '2026-08-19 08:40:24'),
(75, 1, 'admin', 'CREATE_HOLIDAY', 'Settings', '11', 'Created 1 holiday date(s): Independence Day', NULL, NULL, '2026-08-19 08:40:24'),
(76, 1, 'admin', 'CREATE_BOOK', 'Book', '1', 'Created book: Harry Potter and the Philosopher\'s Stone by J. K. Rowling', NULL, NULL, '2026-08-19 08:44:16'),
(77, 1, 'admin', 'CREATE_BOOK', 'Book', '2', 'Created book: The Alchemist by Paulo Coelho', NULL, NULL, '2026-08-19 08:44:46'),
(78, 1, 'admin', 'CREATE_BOOK', 'Book', '3', 'Created book: Atomic Habits by James Clear', NULL, NULL, '2026-08-19 08:45:31'),
(79, 1, 'admin', 'CREATE_BOOK', 'Book', '4', 'Created book: The Psychology of Money by Morgan Housel', NULL, NULL, '2026-08-19 08:46:11'),
(80, 1, 'admin', 'CREATE_BOOK', 'Book', '5', 'Created book: Rich Dad Poor Dad by Robert Kiyosaki', NULL, NULL, '2026-08-19 08:47:02'),
(81, 1, 'admin', 'DEPOSIT_TOPUP', 'Deposit', '3', 'Topped up ₹5000.0 for student 3. Cleared outstanding: ₹0.0, Net balance addition: ₹5000.0', NULL, NULL, '2026-08-19 08:49:52'),
(82, 1, 'admin', 'LOGIN', 'Auth', NULL, 'User logged in successfully', '127.0.0.1', 'curl/7.81.0', '2026-08-19 09:00:39'),
(83, 1, 'admin', 'LOGIN', 'Auth', NULL, 'User logged in successfully', '127.0.0.1', 'curl/7.81.0', '2026-08-19 09:00:59'),
(84, 1, 'admin', 'LOGIN', 'Auth', NULL, 'User logged in successfully', '127.0.0.1', 'curl/7.81.0', '2026-08-19 09:04:11'),
(85, 1, 'admin', 'LOGIN', 'Auth', NULL, 'User logged in successfully', '127.0.0.1', 'curl/7.81.0', '2026-08-19 09:26:15'),
(86, 1, 'admin', 'LOGIN', 'Auth', NULL, 'User logged in successfully', '127.0.0.1', 'curl/7.81.0', '2026-08-19 09:26:46'),
(87, 1, 'admin', 'LOGIN', 'Auth', NULL, 'User logged in successfully', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 09:30:58'),
(88, 1, 'admin', 'DEPOSIT_TOPUP', 'Deposit', '2', 'Topped up ₹500.0 for student 2. Cleared outstanding: ₹0.0, Net balance addition: ₹500.0', NULL, NULL, '2026-08-19 09:40:06'),
(89, 1, 'admin', 'LOGIN', 'Auth', NULL, 'User logged in successfully', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 09:41:57'),
(90, 1, 'admin', 'ISSUE_BOOK', 'Library', '1', 'Issued book copy 1 to student 2', NULL, NULL, '2026-08-19 09:50:07'),
(91, 1, 'admin', 'RETURN_BOOK', 'Library', '1', 'Returned book, fine: 0.0, damage: 300, deducted: 300.0, outstanding: 0.0', NULL, NULL, '2026-08-19 09:51:41'),
(92, 1, 'admin', 'UPDATE_SETTING', 'Settings', 'school_name', 'Updated setting school_name to Kinder Park Preschool', NULL, NULL, '2026-08-19 09:57:53'),
(93, 1, 'admin', 'ISSUE_BOOK', 'Library', '2', 'Issued book copy 3 to student 3', NULL, NULL, '2026-08-19 10:08:10'),
(94, 1, 'admin', 'ISSUE_BOOK', 'Library', '3', 'Issued book copy 5 to student 3', NULL, NULL, '2026-08-19 10:08:27'),
(95, 4, 'staff', 'LOGIN', 'Auth', NULL, 'User logged in successfully', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 10:21:59'),
(96, 1, 'admin', 'UPDATE_USER', 'User', '4', 'Updated user: staff', NULL, NULL, '2026-08-19 10:24:06'),
(97, 1, 'admin', 'CREATE_PROGRAMME', 'Programme', 'SAMPLE', 'Created programme: SAMPLE', NULL, NULL, '2026-08-19 11:49:46'),
(98, 1, 'admin', 'CREATE_BOOK', 'Book', '6', 'Created book: The Rhyming Rabbit by Julia Donaldson', NULL, NULL, '2026-08-19 11:57:58'),
(99, 1, 'admin', 'LOGOUT', 'Auth', NULL, 'User logged out', NULL, NULL, '2026-08-19 12:05:36'),
(100, 1, 'admin', 'LOGIN', 'Auth', NULL, 'User logged in successfully', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-19 12:05:53'),
(101, 1, 'admin', 'ISSUE_BOOK', 'Library', '4', 'Issued book copy 7 to student 2', NULL, NULL, '2026-08-19 12:17:11'),
(102, 1, 'admin', 'RETURN_BOOK', 'Library', '2', 'Returned book, fine: 0.0, damage: 0.0, deducted: 0.0, outstanding: 0.0', NULL, NULL, '2026-08-19 12:23:57'),
(103, 1, 'admin', 'LOGIN', 'Auth', NULL, 'User logged in successfully', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-25 13:20:09'),
(104, 1, 'admin', 'UPDATE_STUDENT', 'Student', 'STU0001', 'Updated student: C. Iniya', NULL, NULL, '2026-08-25 13:52:34'),
(105, 1, 'admin', 'ASSIGN_SUBSCRIPTION', 'Subscription', '1', 'Assigned plan Caterpillar to student C. Iniya (STU0001)', NULL, NULL, '2026-08-25 13:53:04'),
(106, 1, 'admin', 'DEPOSIT_TOPUP', 'Deposit', '1', 'Topped up ₹300.0 for student 1. Cleared outstanding: ₹0.0, Net balance addition: ₹300.0', NULL, NULL, '2026-08-25 13:53:57'),
(107, 1, 'admin', 'UPDATE_USER', 'User', '4', 'Updated user: staff', NULL, NULL, '2026-08-25 14:15:33'),
(108, 4, 'staff', 'LOGIN', 'Auth', NULL, 'User logged in successfully', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-25 14:15:46'),
(109, 1, 'admin', 'UPDATE_USER', 'User', '4', 'Updated user: staff', NULL, NULL, '2026-08-25 14:18:32'),
(110, 4, 'staff', 'LOGOUT', 'Auth', NULL, 'User logged out', NULL, NULL, '2026-08-25 14:18:55'),
(111, 4, 'staff', 'LOGIN', 'Auth', NULL, 'User logged in successfully', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-08-25 14:19:04'),
(112, 1, 'admin', 'UPDATE_USER', 'User', '4', 'Updated user: staff', NULL, NULL, '2026-08-25 14:19:30'),
(113, 1, 'admin', 'UPDATE_USER', 'User', '4', 'Updated user: staff', NULL, NULL, '2026-08-25 14:19:42'),
(114, 1, 'admin', 'UPDATE_USER', 'User', '4', 'Updated user: staff', NULL, NULL, '2026-08-25 14:22:19'),
(115, 1, 'admin', 'UPDATE_SETTING', 'Settings', 'school_name', 'Updated setting school_name to Just Kidding Co', NULL, NULL, '2026-08-25 14:23:48'),
(116, 1, 'admin', 'LOGIN', 'Auth', NULL, 'User logged in successfully', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-25 16:30:42'),
(117, 1, 'admin', 'CREATE_BOOK', 'Book', '7', 'Created book: 25PCS106 by 25PCS106', NULL, NULL, '2026-08-25 16:37:04'),
(118, 1, 'admin', 'DELETE_BOOK', 'Book', '7', 'Deleted book: 25PCS106', NULL, NULL, '2026-08-25 16:38:51'),
(119, 1, 'admin', 'IMPORT_STUDENT_SPREADSHEET', 'Student', NULL, 'Imported 96 enrollment(s) from FLY _ Read To Rock! _ Lit Readers Membership Form 2026-27 (Responses).xlsx', NULL, NULL, '2026-08-25 18:40:27'),
(120, 1, 'admin', 'UPDATE_USER', 'User', '4', 'Updated user: staff', NULL, NULL, '2026-08-26 05:01:13'),
(121, 1, 'admin', 'UPDATE_USER', 'User', '4', 'Updated user: staff', NULL, NULL, '2026-08-26 05:01:45'),
(122, 1, 'admin', 'UPDATE_USER', 'User', '4', 'Updated user: staff', NULL, NULL, '2026-08-26 05:02:03'),
(123, 1, 'admin', 'UPDATE_USER', 'User', '4', 'Updated user: staff', NULL, NULL, '2026-08-26 05:03:51'),
(124, 1, 'admin', 'UPDATE_USER', 'User', '4', 'Updated user: staff', NULL, NULL, '2026-08-26 05:10:38'),
(125, 1, 'admin', 'UPDATE_USER', 'User', '4', 'Updated user: staff', NULL, NULL, '2026-08-26 05:11:20'),
(126, 1, 'admin', 'UPDATE_USER', 'User', '4', 'Updated user: staff', NULL, NULL, '2026-08-26 05:27:49'),
(127, 1, 'admin', 'UPDATE_USER', 'User', '4', 'Updated user: staff', NULL, NULL, '2026-08-26 05:39:34'),
(128, 1, 'admin', 'UPDATE_USER', 'User', '4', 'Updated user: staff', NULL, NULL, '2026-08-26 05:40:14'),
(129, 1, 'admin', 'UPDATE_USER', 'User', '4', 'Updated user: staff', NULL, NULL, '2026-08-26 05:41:52'),
(130, 1, 'admin', 'UPDATE_USER', 'User', '4', 'Updated user: staff', NULL, NULL, '2026-08-26 05:45:32'),
(131, 1, 'admin', 'UPDATE_USER', 'User', '4', 'Updated user: staff', NULL, NULL, '2026-08-26 05:49:36'),
(132, 1, 'admin', 'UPDATE_USER', 'User', '4', 'Updated user: staff', NULL, NULL, '2026-08-26 05:49:57'),
(133, 1, 'admin', 'UPDATE_USER', 'User', '4', 'Updated user: staff', NULL, NULL, '2026-08-26 05:55:25'),
(134, 1, 'admin', 'UPDATE_USER', 'User', '4', 'Updated user: staff', NULL, NULL, '2026-08-26 06:05:34'),
(135, 1, 'admin', 'REMOVE_ROLE_PERMISSION', 'User', NULL, 'Removed book.create from STAFF', NULL, NULL, '2026-08-26 06:08:07'),
(136, 1, 'admin', 'UPDATE_USER', 'User', '4', 'Updated user: staff', NULL, NULL, '2026-08-26 06:08:17'),
(137, 1, 'admin', 'DEPOSIT_TOPUP', 'Deposit', '11', 'Topped up ₹70000.0 for student 11. Cleared outstanding: ₹0.0, Net balance addition: ₹70000.0', NULL, NULL, '2026-08-26 10:37:38'),
(138, 1, 'admin', 'REMOVE_ROLE_PERMISSION', 'User', NULL, 'Removed book.edit from STAFF', NULL, NULL, '2026-08-26 10:43:35'),
(139, 1, 'admin', 'UPDATE_USER', 'User', '4', 'Updated user: staff', NULL, NULL, '2026-08-26 10:44:05'),
(140, 1, 'admin', 'LOGIN', 'Auth', NULL, 'User logged in successfully', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-27 10:30:41'),
(141, 1, 'admin', 'TODAY_NOT_HOLIDAY', 'Holiday', '2026-08-27', '2026-08-27 confirmed as a working day', NULL, NULL, '2026-08-27 10:59:44'),
(142, 1, 'admin', 'UPDATE_SETTING', 'Settings', 'low_deposit_threshold', 'Updated setting low_deposit_threshold to 3000', NULL, NULL, '2026-08-27 11:07:47'),
(143, 1, 'admin', 'UPDATE_USER', 'User', '5', 'Updated user: sarah', NULL, NULL, '2026-08-27 12:31:41'),
(144, 1, 'admin', 'LOGOUT', 'Auth', NULL, 'User logged out', NULL, NULL, '2026-08-27 12:34:09'),
(145, 1, 'admin', 'LOGIN', 'Auth', NULL, 'User logged in successfully', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-27 12:34:17');

-- --------------------------------------------------------

--
-- Table structure for table `book_categories`
--

CREATE TABLE `book_categories` (
  `category_id` int(11) NOT NULL,
  `category_code` varchar(20) NOT NULL,
  `category_name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `book_categories`
--

INSERT INTO `book_categories` (`category_id`, `category_code`, `category_name`, `description`, `is_active`, `created_at`) VALUES
(7, 'F-P', 'Fiction - Picture Book', '', 1, '2026-08-19 07:15:18'),
(8, 'F-CH', 'Fiction - Chapter Book', '', 1, '2026-08-19 07:15:51'),
(9, 'NF-P ', 'Non Fiction - Picture Book', '', 1, '2026-08-19 07:16:09'),
(10, 'NF-CH', 'Non Fiction - Chapter Book', '', 1, '2026-08-19 07:16:31');

-- --------------------------------------------------------

--
-- Table structure for table `book_copies`
--

CREATE TABLE `book_copies` (
  `book_copy_id` int(11) NOT NULL,
  `book_title_id` int(11) NOT NULL,
  `copy_number` int(11) DEFAULT NULL,
  `barcode` varchar(50) DEFAULT NULL,
  `accession_number` varchar(50) DEFAULT NULL,
  `purchase_year` int(11) DEFAULT NULL,
  `purchase_price` decimal(10,2) DEFAULT NULL,
  `condition` enum('NEW','GOOD','FAIR','POOR','DAMAGED') DEFAULT NULL,
  `status` enum('AVAILABLE','ISSUED','DAMAGED','LOST','RESERVED') DEFAULT NULL,
  `location` varchar(50) DEFAULT NULL COMMENT 'Shelf location',
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `book_copies`
--

INSERT INTO `book_copies` (`book_copy_id`, `book_title_id`, `copy_number`, `barcode`, `accession_number`, `purchase_year`, `purchase_price`, `condition`, `status`, `location`, `notes`, `created_at`, `updated_at`) VALUES
(1, 1, 1, '100001', NULL, 2012, NULL, 'NEW', 'LOST', 'Main Shelf', NULL, '2026-08-19 08:44:16', '2026-08-19 09:51:41'),
(2, 2, 1, '200001', NULL, 2020, NULL, 'NEW', 'AVAILABLE', 'Main Shelf', NULL, '2026-08-19 08:44:46', '2026-08-19 08:44:46'),
(3, 3, 1, '300001', NULL, 2024, NULL, 'GOOD', 'AVAILABLE', 'Main Shelf', NULL, '2026-08-19 08:45:31', '2026-08-19 12:23:57'),
(4, 4, 1, '400001', NULL, 2026, NULL, 'NEW', 'AVAILABLE', 'Main Shelf', NULL, '2026-08-19 08:46:11', '2026-08-19 08:46:11'),
(5, 5, 1, '500001', NULL, 2012, NULL, 'NEW', 'ISSUED', 'Main Shelf', NULL, '2026-08-19 08:47:02', '2026-08-19 10:08:27'),
(6, 3, 2, '300002', NULL, 2026, NULL, 'NEW', 'AVAILABLE', 'Main Shelf', NULL, '2026-08-19 08:47:31', '2026-08-19 08:47:31'),
(7, 6, 1, '100002', NULL, NULL, NULL, 'NEW', 'ISSUED', 'Main Shelf', NULL, '2026-08-19 11:57:58', '2026-08-19 12:17:11');

-- --------------------------------------------------------

--
-- Table structure for table `book_issues`
--

CREATE TABLE `book_issues` (
  `issue_id` int(11) NOT NULL,
  `book_copy_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `enrollment_id` int(11) DEFAULT NULL,
  `issue_date` date NOT NULL,
  `issue_time` time NOT NULL,
  `due_date` date NOT NULL,
  `expected_return_date` date DEFAULT NULL,
  `issued_by` int(11) NOT NULL,
  `status` enum('ACTIVE','RETURNED','OVERDUE','LOST') DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `book_issues`
--

INSERT INTO `book_issues` (`issue_id`, `book_copy_id`, `student_id`, `enrollment_id`, `issue_date`, `issue_time`, `due_date`, `expected_return_date`, `issued_by`, `status`, `notes`, `created_at`, `updated_at`) VALUES
(1, 1, 2, NULL, '2026-08-19', '15:20:07', '2026-09-02', NULL, 1, 'LOST', NULL, '2026-08-19 09:50:07', '2026-08-19 09:51:41'),
(2, 3, 3, NULL, '2026-08-19', '15:38:10', '2026-09-02', NULL, 1, 'RETURNED', NULL, '2026-08-19 10:08:10', '2026-08-19 12:23:57'),
(3, 5, 3, NULL, '2026-08-19', '15:38:27', '2026-09-02', NULL, 1, 'ACTIVE', NULL, '2026-08-19 10:08:27', '2026-08-19 10:08:27'),
(4, 7, 2, NULL, '2026-08-19', '17:47:11', '2026-09-02', NULL, 1, 'ACTIVE', NULL, '2026-08-19 12:17:11', '2026-08-19 12:17:11');

-- --------------------------------------------------------

--
-- Table structure for table `book_levels`
--

CREATE TABLE `book_levels` (
  `level_id` int(11) NOT NULL,
  `level_code` varchar(20) NOT NULL,
  `level_name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `sort_order` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `book_levels`
--

INSERT INTO `book_levels` (`level_id`, `level_code`, `level_name`, `description`, `sort_order`, `is_active`, `created_at`) VALUES
(6, 'L1', 'Level 1 ', '', 1, 1, '2026-08-19 07:12:01'),
(7, 'L2', 'Level 2', '', 2, 1, '2026-08-19 07:12:19'),
(8, 'L3', 'Level 3 ', '', 3, 1, '2026-08-19 07:12:31'),
(9, 'L4', 'Level 4', '', 4, 1, '2026-08-19 07:12:42'),
(10, 'L5 ', 'Level 5', '', 5, 1, '2026-08-19 07:12:51');

-- --------------------------------------------------------

--
-- Table structure for table `book_level_sequences`
--

CREATE TABLE `book_level_sequences` (
  `level_id` int(11) NOT NULL,
  `last_sequence` int(11) NOT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `book_level_sequences`
--

INSERT INTO `book_level_sequences` (`level_id`, `last_sequence`, `updated_at`) VALUES
(1, 3, '2026-08-25 16:37:03'),
(6, 2, '2026-08-19 11:57:58'),
(7, 1, '2026-08-19 08:44:46'),
(8, 2, '2026-08-19 08:47:31'),
(9, 1, '2026-08-19 08:46:11'),
(10, 1, '2026-08-19 08:47:02');

-- --------------------------------------------------------

--
-- Table structure for table `book_returns`
--

CREATE TABLE `book_returns` (
  `return_id` int(11) NOT NULL,
  `issue_id` int(11) NOT NULL,
  `return_date` date NOT NULL,
  `return_time` time NOT NULL,
  `received_by` int(11) NOT NULL,
  `condition_returned` enum('NEW','GOOD','FAIR','POOR','DAMAGED') DEFAULT NULL,
  `is_damaged` tinyint(1) DEFAULT NULL,
  `is_lost` tinyint(1) DEFAULT NULL,
  `fine_amount` decimal(10,2) DEFAULT NULL,
  `damage_charge` decimal(10,2) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `book_returns`
--

INSERT INTO `book_returns` (`return_id`, `issue_id`, `return_date`, `return_time`, `received_by`, `condition_returned`, `is_damaged`, `is_lost`, `fine_amount`, `damage_charge`, `notes`, `created_at`) VALUES
(1, 1, '2026-08-19', '15:21:41', 1, 'GOOD', 0, 1, 0.00, 300.00, '', '2026-08-19 09:51:41'),
(2, 2, '2026-08-19', '17:53:57', 1, 'GOOD', 0, 0, 0.00, 0.00, '', '2026-08-19 12:23:57');

-- --------------------------------------------------------

--
-- Table structure for table `book_titles`
--

CREATE TABLE `book_titles` (
  `book_title_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `author` varchar(100) NOT NULL,
  `isbn` varchar(20) DEFAULT NULL,
  `mrp` decimal(10,2) DEFAULT NULL,
  `level_id` int(11) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `publication_year` int(11) DEFAULT NULL,
  `publisher` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `cover_image` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `ebook_count` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `book_titles`
--

INSERT INTO `book_titles` (`book_title_id`, `title`, `author`, `isbn`, `mrp`, `level_id`, `category_id`, `publication_year`, `publisher`, `description`, `cover_image`, `created_at`, `updated_at`, `ebook_count`) VALUES
(1, 'Harry Potter and the Philosopher\'s Stone', 'J. K. Rowling', '9780747532699', NULL, 6, 8, 1997, 'Bloomsbury Publishing', NULL, NULL, '2026-08-19 08:44:16', '2026-08-19 08:44:16', 0),
(2, 'The Alchemist', 'Paulo Coelho', '9780062315007', NULL, 7, 7, 2014, 'HarperCollins Publishers', NULL, NULL, '2026-08-19 08:44:45', '2026-08-19 08:44:45', 0),
(3, 'Atomic Habits', 'James Clear', '9780735211292', NULL, 8, 9, 2017, 'Avery publishing', NULL, NULL, '2026-08-19 08:45:30', '2026-08-19 08:45:30', 0),
(4, 'The Psychology of Money', 'Morgan Housel', '9780857197689', NULL, 9, 8, 2020, 'Harriman House', NULL, NULL, '2026-08-19 08:46:10', '2026-08-19 08:46:10', 0),
(5, 'Rich Dad Poor Dad', 'Robert Kiyosaki', '9781612680194', NULL, 10, 10, 1997, 'Plata Publishing', NULL, NULL, '2026-08-19 08:47:02', '2026-08-19 08:47:02', 0),
(6, 'The Rhyming Rabbit', 'Julia Donaldson', '9781447294238', NULL, 6, 7, 2001, 'Macmillan Children', NULL, NULL, '2026-08-19 11:57:57', '2026-08-19 11:57:57', 0);

-- --------------------------------------------------------

--
-- Table structure for table `damage_loss_records`
--

CREATE TABLE `damage_loss_records` (
  `record_id` int(11) NOT NULL,
  `book_copy_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `issue_id` int(11) DEFAULT NULL,
  `record_type` enum('DAMAGE','LOSS') NOT NULL,
  `severity` enum('SMALL','LARGE','DEFAULT') DEFAULT NULL,
  `charge_amount` decimal(10,2) NOT NULL,
  `description` text DEFAULT NULL,
  `recorded_by` int(11) NOT NULL,
  `deposit_transaction_id` int(11) DEFAULT NULL,
  `status` enum('PENDING','CHARGED','WAIVED') DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `deposit_accounts`
--

CREATE TABLE `deposit_accounts` (
  `deposit_account_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `current_balance` decimal(10,2) DEFAULT NULL,
  `minimum_balance` decimal(10,2) DEFAULT NULL,
  `warning_threshold` decimal(10,2) DEFAULT NULL,
  `last_transaction_date` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `outstanding_balance` decimal(10,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `deposit_accounts`
--

INSERT INTO `deposit_accounts` (`deposit_account_id`, `student_id`, `current_balance`, `minimum_balance`, `warning_threshold`, `last_transaction_date`, `created_at`, `updated_at`, `outstanding_balance`) VALUES
(1, 1, 300.00, 0.00, 300.00, '2026-08-25 19:23:57', '2026-08-18 17:36:03', '2026-08-25 13:53:57', 0.00),
(2, 2, 700.00, 0.00, 300.00, '2026-08-19 15:10:05', '2026-08-18 17:38:40', '2026-08-19 09:57:26', 0.00),
(3, 3, 5000.00, 0.00, 300.00, '2026-08-19 14:19:51', '2026-08-19 07:10:42', '2026-08-19 09:57:26', 0.00),
(4, 4, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:21', '2026-08-25 18:40:21', 0.00),
(5, 5, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:21', '2026-08-25 18:40:21', 0.00),
(6, 6, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:22', '2026-08-25 18:40:22', 0.00),
(7, 7, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:22', '2026-08-25 18:40:22', 0.00),
(8, 8, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:22', '2026-08-25 18:40:22', 0.00),
(9, 9, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:22', '2026-08-25 18:40:22', 0.00),
(10, 10, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:22', '2026-08-25 18:40:22', 0.00),
(11, 11, 70000.00, 0.00, 300.00, '2026-08-26 16:07:38', '2026-08-25 18:40:22', '2026-08-26 10:37:38', 0.00),
(12, 12, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:22', '2026-08-25 18:40:22', 0.00),
(13, 13, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:22', '2026-08-25 18:40:22', 0.00),
(14, 14, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:22', '2026-08-25 18:40:22', 0.00),
(15, 15, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:22', '2026-08-25 18:40:22', 0.00),
(16, 16, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:22', '2026-08-25 18:40:22', 0.00),
(17, 17, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:22', '2026-08-25 18:40:22', 0.00),
(18, 18, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:22', '2026-08-25 18:40:22', 0.00),
(19, 19, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:22', '2026-08-25 18:40:22', 0.00),
(20, 20, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:22', '2026-08-25 18:40:22', 0.00),
(21, 21, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:23', '2026-08-25 18:40:23', 0.00),
(22, 22, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:23', '2026-08-25 18:40:23', 0.00),
(23, 23, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:23', '2026-08-25 18:40:23', 0.00),
(24, 24, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:23', '2026-08-25 18:40:23', 0.00),
(25, 25, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:23', '2026-08-25 18:40:23', 0.00),
(26, 26, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:23', '2026-08-25 18:40:23', 0.00),
(27, 27, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:23', '2026-08-25 18:40:23', 0.00),
(28, 28, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:23', '2026-08-25 18:40:23', 0.00),
(29, 29, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:23', '2026-08-25 18:40:23', 0.00),
(30, 30, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:23', '2026-08-25 18:40:23', 0.00),
(31, 31, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:23', '2026-08-25 18:40:23', 0.00),
(32, 32, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:23', '2026-08-25 18:40:23', 0.00),
(33, 33, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:23', '2026-08-25 18:40:23', 0.00),
(34, 34, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:23', '2026-08-25 18:40:23', 0.00),
(35, 35, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:23', '2026-08-25 18:40:23', 0.00),
(36, 36, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:23', '2026-08-25 18:40:23', 0.00),
(37, 37, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:23', '2026-08-25 18:40:23', 0.00),
(38, 38, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:24', '2026-08-25 18:40:24', 0.00),
(39, 39, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:24', '2026-08-25 18:40:24', 0.00),
(40, 40, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:24', '2026-08-25 18:40:24', 0.00),
(41, 41, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:24', '2026-08-25 18:40:24', 0.00),
(42, 42, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:24', '2026-08-25 18:40:24', 0.00),
(43, 43, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:24', '2026-08-25 18:40:24', 0.00),
(44, 44, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:24', '2026-08-25 18:40:24', 0.00),
(45, 45, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:24', '2026-08-25 18:40:24', 0.00),
(46, 46, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:24', '2026-08-25 18:40:24', 0.00),
(47, 47, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:24', '2026-08-25 18:40:24', 0.00),
(48, 48, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:24', '2026-08-25 18:40:24', 0.00),
(49, 49, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:24', '2026-08-25 18:40:24', 0.00),
(50, 50, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:24', '2026-08-25 18:40:24', 0.00),
(51, 51, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:24', '2026-08-25 18:40:24', 0.00),
(52, 52, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:24', '2026-08-25 18:40:24', 0.00),
(53, 53, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:25', '2026-08-25 18:40:25', 0.00),
(54, 54, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:25', '2026-08-25 18:40:25', 0.00),
(55, 55, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:25', '2026-08-25 18:40:25', 0.00),
(56, 56, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:25', '2026-08-25 18:40:25', 0.00),
(57, 57, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:25', '2026-08-25 18:40:25', 0.00),
(58, 58, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:26', '2026-08-25 18:40:26', 0.00),
(59, 59, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:26', '2026-08-25 18:40:26', 0.00),
(60, 60, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:26', '2026-08-25 18:40:26', 0.00),
(61, 61, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:26', '2026-08-25 18:40:26', 0.00),
(62, 62, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:26', '2026-08-25 18:40:26', 0.00),
(63, 63, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:26', '2026-08-25 18:40:26', 0.00),
(64, 64, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:26', '2026-08-25 18:40:26', 0.00),
(65, 65, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:26', '2026-08-25 18:40:26', 0.00),
(66, 66, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:26', '2026-08-25 18:40:26', 0.00),
(67, 67, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:26', '2026-08-25 18:40:26', 0.00),
(68, 68, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:26', '2026-08-25 18:40:26', 0.00),
(69, 69, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:26', '2026-08-25 18:40:26', 0.00),
(70, 70, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:26', '2026-08-25 18:40:26', 0.00),
(71, 71, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:27', '2026-08-25 18:40:27', 0.00),
(72, 72, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:27', '2026-08-25 18:40:27', 0.00),
(73, 73, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:27', '2026-08-25 18:40:27', 0.00),
(74, 74, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:27', '2026-08-25 18:40:27', 0.00),
(75, 75, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:27', '2026-08-25 18:40:27', 0.00),
(76, 76, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:27', '2026-08-25 18:40:27', 0.00),
(77, 77, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:27', '2026-08-25 18:40:27', 0.00),
(78, 78, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:27', '2026-08-25 18:40:27', 0.00),
(79, 79, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:27', '2026-08-25 18:40:27', 0.00),
(80, 80, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:27', '2026-08-25 18:40:27', 0.00),
(81, 81, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:27', '2026-08-25 18:40:27', 0.00),
(82, 82, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:27', '2026-08-25 18:40:27', 0.00),
(83, 83, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:27', '2026-08-25 18:40:27', 0.00),
(84, 84, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:27', '2026-08-25 18:40:27', 0.00),
(85, 85, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:27', '2026-08-25 18:40:27', 0.00),
(86, 86, 0.00, 0.00, 300.00, NULL, '2026-08-25 18:40:27', '2026-08-25 18:40:27', 0.00);

-- --------------------------------------------------------

--
-- Table structure for table `deposit_transactions`
--

CREATE TABLE `deposit_transactions` (
  `transaction_id` int(11) NOT NULL,
  `deposit_account_id` int(11) NOT NULL,
  `transaction_type` enum('INITIAL_DEPOSIT','TOP_UP','FINE','DAMAGE_CHARGE','LOST_BOOK','ADJUSTMENT','REFUND') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `balance_after` decimal(10,2) NOT NULL,
  `reference_id` varchar(50) DEFAULT NULL COMMENT 'Reference to issue_id, damage_id, etc.',
  `description` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `deposit_transactions`
--

INSERT INTO `deposit_transactions` (`transaction_id`, `deposit_account_id`, `transaction_type`, `amount`, `balance_after`, `reference_id`, `description`, `created_by`, `created_at`) VALUES
(1, 2, 'TOP_UP', 500.00, 500.00, NULL, 'Top-up deposit', 1, '2026-08-18 19:17:25'),
(2, 3, 'TOP_UP', 5000.00, 5000.00, NULL, 'Top-up deposit', 1, '2026-08-19 08:49:51'),
(3, 2, 'TOP_UP', 500.00, 1000.00, NULL, 'Deposit payment', 1, '2026-08-19 09:40:05'),
(4, 2, 'LOST_BOOK', -300.00, 700.00, '1', 'Return #1: Fine ₹0.00, Damage ₹300.00. Deducted ₹300.00', 1, '2026-08-19 09:51:41'),
(5, 1, 'TOP_UP', 300.00, 300.00, NULL, 'Deposit payment', 1, '2026-08-25 13:53:57'),
(6, 11, 'TOP_UP', 70000.00, 70000.00, NULL, 'Deposit payment', 1, '2026-08-26 10:37:38');

-- --------------------------------------------------------

--
-- Table structure for table `grade_levels`
--

CREATE TABLE `grade_levels` (
  `grade_id` int(11) NOT NULL,
  `grade_code` varchar(10) NOT NULL COMMENT 'KG, 1, 2, etc.',
  `grade_name` varchar(50) NOT NULL COMMENT 'Kindergarten, Grade 1, etc.',
  `description` text DEFAULT NULL,
  `sort_order` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `grade_levels`
--

INSERT INTO `grade_levels` (`grade_id`, `grade_code`, `grade_name`, `description`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'PG', 'Playgroup', 'Playgroup for ages 2-3', 1, 1, '2026-08-17 07:03:56', '2026-08-17 07:03:56'),
(2, 'NUR', 'Nursery', 'Nursery for ages 3-4', 2, 1, '2026-08-17 07:03:56', '2026-08-17 07:03:56'),
(3, 'JKG', 'Junior KG', 'Junior Kindergarten for ages 4-5', 3, 1, '2026-08-17 07:03:56', '2026-08-17 07:03:56'),
(4, 'SKG', 'Senior KG', 'Senior Kindergarten for ages 5-6', 4, 1, '2026-08-17 07:03:56', '2026-08-17 07:03:56'),
(5, '1', 'Grade 1', 'Primary Grade 1', 5, 1, '2026-08-17 07:03:56', '2026-08-17 07:03:56'),
(6, '2', 'Grade 2', 'Primary Grade 2', 6, 1, '2026-08-17 07:03:56', '2026-08-17 07:03:56');

-- --------------------------------------------------------

--
-- Table structure for table `holidays`
--

CREATE TABLE `holidays` (
  `holiday_id` int(11) NOT NULL,
  `holiday_name` varchar(100) NOT NULL,
  `holiday_date` date NOT NULL,
  `is_recurring` tinyint(1) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `holidays`
--

INSERT INTO `holidays` (`holiday_id`, `holiday_name`, `holiday_date`, `is_recurring`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Diwali', '2026-08-19', 0, '', '2026-08-19 07:17:28', '2026-08-19 07:17:28'),
(2, 'Annual Leave', '2026-08-20', 0, '', '2026-08-19 07:18:04', '2026-08-19 07:18:04'),
(3, 'Annual Leave', '2026-08-21', 0, '', '2026-08-19 07:18:04', '2026-08-19 07:18:04'),
(4, 'Annual Leave', '2026-08-22', 0, '', '2026-08-19 07:18:04', '2026-08-19 07:18:04'),
(5, 'Annual Leave', '2026-08-23', 0, '', '2026-08-19 07:18:04', '2026-08-19 07:18:04'),
(6, 'Annual Leave', '2026-08-24', 0, '', '2026-08-19 07:18:04', '2026-08-19 07:18:04'),
(7, 'Annual Leave', '2026-08-25', 0, '', '2026-08-19 07:18:04', '2026-08-19 07:18:04'),
(8, 'Independence Day', '2026-08-04', 0, '', '2026-08-19 08:40:24', '2026-08-19 08:40:24'),
(9, 'Independence Day', '2026-08-05', 0, '', '2026-08-19 08:40:24', '2026-08-19 08:40:24'),
(10, 'Independence Day', '2026-08-06', 0, '', '2026-08-19 08:40:24', '2026-08-19 08:40:24'),
(11, 'Independence Day', '2026-08-07', 0, '', '2026-08-19 08:40:24', '2026-08-19 08:40:24');

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `permission_id` int(11) NOT NULL,
  `permission_code` varchar(50) NOT NULL,
  `permission_name` varchar(100) NOT NULL,
  `module` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `permissions`
--

INSERT INTO `permissions` (`permission_id`, `permission_code`, `permission_name`, `module`, `description`, `created_at`) VALUES
(13, 'user.view', 'View Users', 'user', 'Can view system user list', '2026-08-19 07:28:35'),
(14, 'user.manage', 'Manage Users', 'user', 'Can create, edit, disable system users', '2026-08-19 07:28:35'),
(15, 'student.view', 'View Students', 'student', 'Can view student profiles and roster', '2026-08-19 07:28:35'),
(16, 'student.create', 'Create Students', 'student', 'Can create new student records', '2026-08-19 07:28:35'),
(17, 'student.edit', 'Edit Students', 'student', 'Can edit student details', '2026-08-19 07:28:35'),
(18, 'student.delete', 'Delete Students', 'student', 'Can delete student records', '2026-08-19 07:28:35'),
(19, 'programme.view', 'View Programmes', 'programme', 'Can view academic programmes', '2026-08-19 07:28:35'),
(20, 'programme.create', 'Create Programmes', 'programme', 'Can create academic programmes', '2026-08-19 07:28:35'),
(21, 'programme.edit', 'Edit Programmes', 'programme', 'Can edit academic programmes', '2026-08-19 07:28:35'),
(22, 'programme.delete', 'Delete Programmes', 'programme', 'Can delete academic programmes', '2026-08-19 07:28:35'),
(23, 'subscription.view', 'View Subscriptions', 'subscription', 'Can view subscription plans', '2026-08-19 07:28:35'),
(24, 'subscription.create', 'Create Subscriptions', 'subscription', 'Can assign or create subscriptions', '2026-08-19 07:28:35'),
(25, 'subscription.edit', 'Edit Subscriptions', 'subscription', 'Can edit subscription details', '2026-08-19 07:28:35'),
(26, 'subscription.delete', 'Delete Subscriptions', 'subscription', 'Can cancel or delete subscriptions', '2026-08-19 07:28:35'),
(27, 'book.view', 'View Books', 'book', 'Can search and view catalog', '2026-08-19 07:28:35'),
(28, 'book.create', 'Create Books', 'book', 'Can add new book titles and copies', '2026-08-19 07:28:35'),
(29, 'book.edit', 'Edit Books', 'book', 'Can edit book catalog', '2026-08-19 07:28:35'),
(30, 'book.delete', 'Delete Books', 'book', 'Can delete books', '2026-08-19 07:28:35'),
(31, 'book.issue', 'Issue Books', 'library', 'Can issue books to students', '2026-08-19 07:28:35'),
(32, 'book.return', 'Return Books', 'library', 'Can process book returns', '2026-08-19 07:28:35'),
(33, 'damage.create', 'Record Damage', 'damage', 'Can record book damage or loss', '2026-08-19 07:28:35'),
(34, 'deposit.view', 'View Deposits', 'deposit', 'Can view deposit accounts', '2026-08-19 07:28:35'),
(35, 'deposit.topup', 'Top-up Deposit', 'deposit', 'Can process deposit top-ups', '2026-08-19 07:28:35'),
(36, 'deposit.adjust', 'Adjust Deposit', 'deposit', 'Can adjust deposit balances', '2026-08-19 07:28:35'),
(37, 'report.stock', 'Stock Report', 'report', 'Can view stock report', '2026-08-19 07:28:35'),
(38, 'report.member', 'Member Report', 'report', 'Can view member report', '2026-08-19 07:28:35'),
(39, 'report.fine', 'Fine Report', 'report', 'Can view fine report', '2026-08-19 07:28:35'),
(40, 'report.financial', 'Financial Report', 'report', 'Can view financial report', '2026-08-19 07:28:35'),
(41, 'report.issue_return', 'Issue/Return Report', 'report', 'Can view issue/return report', '2026-08-19 07:28:35'),
(42, 'settings.view', 'View Settings', 'settings', 'Can view system settings', '2026-08-19 07:28:35'),
(43, 'audit.view', 'View Audit Logs', 'audit', 'Can view audit logs', '2026-08-19 07:28:35'),
(44, 'holiday.view', 'View Holidays', 'holiday', 'Can view holidays', '2026-08-19 07:28:35'),
(45, 'backup.create', 'Create Backup', 'backup', 'Can create database backups', '2026-08-19 07:28:35'),
(46, 'export.create', 'Export Data', 'export', 'Can export data', '2026-08-19 07:28:35');

-- --------------------------------------------------------

--
-- Table structure for table `programmes`
--

CREATE TABLE `programmes` (
  `programme_id` int(11) NOT NULL,
  `programme_name` varchar(100) NOT NULL,
  `programme_code` varchar(30) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `grade_level` varchar(50) DEFAULT NULL COMMENT 'Grade/Level like KG, 1, 2',
  `is_active` tinyint(1) DEFAULT NULL,
  `library_access` tinyint(1) DEFAULT NULL,
  `sort_order` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `programmes`
--

INSERT INTO `programmes` (`programme_id`, `programme_name`, `programme_code`, `description`, `grade_level`, `is_active`, `library_access`, `sort_order`, `created_at`, `updated_at`) VALUES
(8, 'READ TO ROCK! JUNIORS (3-5)', 'RTJ', 'Auto-created from Excel import', 'READ TO ROCK! JUNIORS (3-5)', 1, 1, 0, '2026-08-18 15:17:14', '2026-08-18 15:17:14'),
(9, 'READ TO ROCK! SENIORS (6-8)', 'RTS', 'Auto-created from Excel import', 'READ TO ROCK! SENIORS (6-8)', 1, 1, 0, '2026-08-18 15:17:15', '2026-08-18 15:17:15'),
(10, 'FLY (9-12)', 'FLY', 'Auto-created from Excel import', 'FLY (9-12)', 1, 1, 0, '2026-08-18 15:17:15', '2026-08-18 17:33:26'),
(11, 'LIT READERS LEVEL - II (5-8)', 'LRL2', 'Auto-created from Excel import', 'LIT READERS LEVEL - II (5-8)', 1, 1, 0, '2026-08-18 15:17:17', '2026-08-18 17:29:49'),
(12, 'LIT READERS LEVEL - I (4-6)', 'LRL1', 'Auto-created from Excel import', 'LIT READERS LEVEL - I (4-6)', 1, 1, 0, '2026-08-18 15:17:18', '2026-08-18 17:29:58'),
(13, 'LIT READERS LEVEL - III(8-10)', 'LRL3', '', 'LIT READERS LEVEL - III(8-10)', 1, 1, 0, '2026-08-18 17:31:15', '2026-08-18 17:31:15'),
(14, 'LIT READERS LEVEL - IV(11-12)', 'LRL4', '', 'LIT READERS LEVEL - IV(11-12)', 1, 1, 0, '2026-08-18 17:31:49', '2026-08-18 17:32:55'),
(15, 'LIT READERS LEVEL - V(13-14)', 'LRL5', '', 'LIT READERS LEVEL - V(13-14)', 1, 1, 0, '2026-08-18 17:32:24', '2026-08-18 17:32:24'),
(16, 'SAMPLE', 'SAMPLE', '', '4-8', 1, 1, 0, '2026-08-19 11:49:46', '2026-08-19 11:49:46');

-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--

CREATE TABLE `role_permissions` (
  `role_permission_id` int(11) NOT NULL,
  `role` enum('ADMIN','STAFF') NOT NULL,
  `permission_id` int(11) NOT NULL,
  `created_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `student_id` int(11) NOT NULL,
  `student_uid` varchar(20) NOT NULL COMMENT 'Permanent ID: STU0001',
  `student_name` varchar(100) NOT NULL,
  `date_of_birth` date NOT NULL,
  `gender` enum('MALE','FEMALE','OTHER') DEFAULT NULL,
  `school_name` varchar(100) DEFAULT NULL,
  `student_email` varchar(100) DEFAULT NULL COMMENT 'Email supplied on membership registration',
  `mother_name` varchar(100) DEFAULT NULL,
  `mother_phone` varchar(20) DEFAULT NULL,
  `mother_email` varchar(100) DEFAULT NULL,
  `father_name` varchar(100) DEFAULT NULL,
  `father_phone` varchar(20) DEFAULT NULL,
  `father_email` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `emergency_contact_name` varchar(100) DEFAULT NULL,
  `emergency_contact_phone` varchar(20) DEFAULT NULL,
  `medical_notes` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `library_access` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`student_id`, `student_uid`, `student_name`, `date_of_birth`, `gender`, `school_name`, `student_email`, `mother_name`, `mother_phone`, `mother_email`, `father_name`, `father_phone`, `father_email`, `address`, `emergency_contact_name`, `emergency_contact_phone`, `medical_notes`, `is_active`, `created_at`, `updated_at`, `library_access`) VALUES
(1, 'JK0001', 'C. Iniya', '2023-02-06', 'OTHER', 'YRTV', NULL, 'R. D. Dhakshana', '8220435688', 'dhakshana262@gmail.com', 'G. K. Chidambaram', '8870949735', '', '', '', '', '', 1, '2026-08-18 17:36:03', '2026-08-25 13:52:34', 1),
(2, 'JK0002', 'A.V.Gowshith', '2018-12-11', 'OTHER', 'YRTV mat hr sec school', NULL, 'Nithisha Vignesh', '9626176419', 'nithisha@asoksparklers.com', 'Vignesh', '9994976419', '', '', '', '', '', 1, '2026-08-18 17:38:40', '2026-08-18 18:56:27', 1),
(3, 'JK0003', 'Subitha K', '2005-03-08', 'OTHER', 'S.H.N.V.Matric.Hr.Sec.School, Sivakasi', 'subi83.k@gmail.com', 'Shanmugapriya K', '7010276618', 'subithashanmugapriya@gmail.com', 'Kandasamy K A', '9655930997', 'ayyankandasamy@gmail.com', '', '', '', '', 1, '2026-08-19 07:10:42', '2026-08-19 07:10:42', 1),
(4, 'JK0004', 'R. Moushika Ragshri', '2016-12-19', 'OTHER', 'The sivakasi lions nursary and primary school', 'shyamala1211@gmail.com', 'R. Shyamala Gowri', '9597428148', 'shyamala1211@gmail.com', 'V. Ragunath', '8667239571', 'shyamala1211@gmail.com', 'shyamala1211@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:21', '2026-08-25 18:40:21', 1),
(5, 'JK0005', 'keerthy G', '2019-04-01', 'OTHER', 'The Sivakasi Lions Nursery and Primary School', 'vishalismiley@gmail.com', 'G.vishali devi', '7339108939', 'vishalismiley@gmail.com', 'M.Ganesan', '9944052108', 'vishalismiley@gmail.com', 'vishalismiley@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:21', '2026-08-25 18:40:21', 1),
(6, 'JK0006', 'S. Vishmaya', '2021-03-03', 'OTHER', 'YRTV MHSS', 'darshinikumar.13@gmail.com', 'S. Darshini', '8098088855', 'darshinikumar.13@gmail.com', 'K.S.Saravanan', '9566659141', 'darshinikumar.13@gmail.com', 'darshinikumar.13@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:22', '2026-08-25 18:40:22', 1),
(7, 'JK0007', 'S. Yaazhisai', '2022-07-02', 'OTHER', 'YRTV MHSS', 'kaviya1692kalyanakumar@gmail.com', 'K. Kaviya', '9790337183', 'kaviya1692kalyanakumar@gmail.com', 'R. Srinivas', '9677954585', 'kaviya1692kalyanakumar@gmail.com', 'kaviya1692kalyanakumar@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:22', '2026-08-25 18:40:22', 1),
(8, 'JK0008', 'S.Sashwanth', '2016-01-16', 'OTHER', 'The Sivakasi Lions Nursery and Primary School', 'sivaranjani59@gmail.com', 'B.Sivaranjani', '9943236899', 'sivaranjani59@gmail.com', 'R.Satheesh', '9943236899', 'sivaranjani59@gmail.com', 'sivaranjani59@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:22', '2026-08-25 18:40:22', 1),
(9, 'JK0009', 'V.Samridhi', '2021-09-20', 'OTHER', 'Lions IB', 'babyuma10@gmail.com', 'U.Baby Uma', '7550044141', 'babyuma10@gmail.com', 'V.Vivekanandhan', '9629944141', 'babyuma10@gmail.com', 'babyuma10@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:22', '2026-08-25 18:40:22', 1),
(10, 'JK0010', 'A A RUTHVIK', '2015-10-14', 'OTHER', 'The Sivakasi Lions International Institutions', 'anujha.rajen@gmail.com', 'Anujha Ajeet', '9994874749', 'anujha.rajen@gmail.com', 'Ajeet Sankar A', '9443121866', 'anujha.rajen@gmail.com', 'anujha.rajen@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:22', '2026-08-25 18:40:22', 1),
(11, 'JK0011', 'R. ATHISH', '2022-09-15', 'OTHER', 'YRTV', 'akshayadharshini04@gmail.com', 'Akshaya Dharshini', '9486546938', 'akshayadharshini04@gmail.com', 'Raj Bharat', '9585227511', 'akshayadharshini04@gmail.com', 'akshayadharshini04@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:22', '2026-08-25 18:40:22', 1),
(12, 'JK0012', 'Navina Shree R', '2022-10-28', 'OTHER', 'YRTV', 'aishwaryaram7373@gmail.com', 'Aishwarya R', '9655227511', 'aishwaryaram7373@gmail.com', 'Ram Prasad B', '9047107511', 'aishwaryaram7373@gmail.com', 'aishwaryaram7373@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:22', '2026-08-25 18:40:22', 1),
(13, 'JK0013', 'Daniel Vashikaran', '2017-03-18', 'OTHER', 'AAA International School', 'zakaria591009@gmail.com', 'Preethi Vashikaran', '8870688819', 'zakaria591009@gmail.com', 'Vashikaran Rajendrasingh', '8870688888', 'zakaria591009@gmail.com', 'zakaria591009@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:22', '2026-08-25 18:40:22', 1),
(14, 'JK0014', 'Advaitha K', '2020-09-18', 'OTHER', 'The Sivakasi Lions School', 'tkanahasabapathy@googlemail.com', 'Radhika', '8754931977', 'tkanahasabapathy@googlemail.com', 'Kanaga Sabapathy T', '8095094141', 'tkanahasabapathy@googlemail.com', 'tkanahasabapathy@googlemail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:22', '2026-08-25 18:40:22', 1),
(15, 'JK0015', 'Amith Vivaan', '2016-01-14', 'OTHER', 'YRTV Mat.Hr.Sec school', 'ahalya.neeraja@gmail.com', 'Ahalya Viswanath', '8754999771', 'ahalya.neeraja@gmail.com', 'S.P. Viswanath', '9003466771', 'ahalya.neeraja@gmail.com', 'ahalya.neeraja@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:22', '2026-08-25 18:40:22', 1),
(16, 'JK0016', 'V . Prajan', '2016-07-27', 'OTHER', 'lions school', 'kumarvignesh1328@gmail.com', 'V. Raja rajeshwari', '8870004938', 'kumarvignesh1328@gmail.com', 'R. Vignesh kumar', '9994504938', 'kumarvignesh1328@gmail.com', 'kumarvignesh1328@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:22', '2026-08-25 18:40:22', 1),
(17, 'JK0017', 'Jithesh R', '2015-09-23', 'OTHER', 'Lions Vision Academy CBSE', 'rammanoj4290@gmail.com', 'Thulasi Lakshmi R', '9500831996', 'rammanoj4290@gmail.com', 'Ramnath S P', '9003466996', 'rammanoj4290@gmail.com', 'rammanoj4290@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:22', '2026-08-25 18:40:22', 1),
(18, 'JK0018', 'V.Vidyuth', '2019-10-30', 'OTHER', 'YRTV', 'shivsenthil333@gmail.com', 'Siva Priya Vinith', '7708518200', 'shivsenthil333@gmail.com', 'Vinith Kumar', '9789182834', 'shivsenthil333@gmail.com', 'shivsenthil333@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:22', '2026-08-25 18:40:22', 1),
(19, 'JK0019', 'Vasudhra V', '2021-08-08', 'OTHER', 'Lions Nursery and Primary School', 'manimaranrohini95@gmail.com', 'Rohini V', '9894896417', 'manimaranrohini95@gmail.com', 'Vishakan V', '+919003760125', 'manimaranrohini95@gmail.com', 'manimaranrohini95@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:22', '2026-08-25 18:40:22', 1),
(20, 'JK0020', 'Rya V', '2022-05-19', 'OTHER', 'YRTV', 'tulvino@gmail.com', 'Tulasi V', '9943364397', 'tulvino@gmail.com', 'Vinoth Bhaskaran', '9171057923', 'tulvino@gmail.com', 'tulvino@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:22', '2026-08-25 18:40:22', 1),
(21, 'JK0021', 'Ridhamika', '2017-12-13', 'OTHER', 'YRTV Matric Higher secondary school', 'chestersudhakar@gmail.com', 'Sowmiya', '7708023246', 'chestersudhakar@gmail.com', 'Sudhakar', '9894723538', 'chestersudhakar@gmail.com', 'chestersudhakar@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:23', '2026-08-25 18:40:23', 1),
(22, 'JK0022', 'Diya', '2021-10-11', 'OTHER', 'Lions IB', 'varshiniganesh@gmail.com', 'Varshini Pramod', '8870013156', 'varshiniganesh@gmail.com', 'Pramod Sankar', '9894223156', 'varshiniganesh@gmail.com', 'varshiniganesh@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:23', '2026-08-25 18:40:23', 1),
(23, 'JK0023', 'Y.yashvitha', '2023-03-28', 'OTHER', 'Lions (cbse)', 'sindhumahendran91@gmail.com', 'Y.Sindhu', '91 9843860622', 'sindhumahendran91@gmail.com', 'N.K.Yogesh kumar', '9843220896', 'sindhumahendran91@gmail.com', 'sindhumahendran91@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:23', '2026-08-25 18:40:23', 1),
(24, 'JK0024', 'P.KRISHIV', '2021-11-12', 'OTHER', 'Lions International', 'poomaanandh@gmail.com', 'PoomaDevi Anantharajan', '8056320173', 'poomaanandh@gmail.com', 'Siva', '9443320173', 'poomaanandh@gmail.com', 'poomaanandh@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:23', '2026-08-25 18:40:23', 1),
(25, 'JK0025', 'Aarohi Bharath', '2022-08-10', 'OTHER', 'Lions IB', 'mail2aishwaryabharath@gmail.com', 'Aishwarya Bharath', '9566060135', 'mail2aishwaryabharath@gmail.com', 'Bharath TK', '9843488999', 'mail2aishwaryabharath@gmail.com', 'mail2aishwaryabharath@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:23', '2026-08-25 18:40:23', 1),
(26, 'JK0026', 'P.R.NITHIN', '2021-10-10', 'OTHER', 'Yrtv school', 'jave1995@gmail.com', 'R.Shanmuga Priya', '8248223132', 'jave1995@gmail.com', 'P.Rajavel', '8870788127', 'jave1995@gmail.com', 'jave1995@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:23', '2026-08-25 18:40:23', 1),
(27, 'JK0027', 'Rajatattvan', '2019-03-24', 'OTHER', 'The Sivakasi lions international school', 'saranyaborn2win@gmail.com', 'Saranya', '8940312669', 'saranyaborn2win@gmail.com', 'SHANMUGA NATARAJ', '9751999999', 'saranyaborn2win@gmail.com', 'saranyaborn2win@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:23', '2026-08-25 18:40:23', 1),
(28, 'JK0028', 'K Tharun Abhinav', '2020-02-13', 'OTHER', 'Arasan Model School', 'karthiksasp@gmail.com', 'K Pon Indhuja', '9790274810', 'karthiksasp@gmail.com', 'G Karthik paulrajan', '9994874810', 'karthiksasp@gmail.com', 'karthiksasp@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:23', '2026-08-25 18:40:23', 1),
(29, 'JK0029', 'J.Dhaanya', '2022-09-24', 'OTHER', 'The Sivakasi Lions Matriculation Higher Secondary School', 'aruljsiva@gmail.com', 'Arul Renganayagi', '9943385902', 'aruljsiva@gmail.com', 'P.Jeyasiva', '9952211221', 'aruljsiva@gmail.com', 'aruljsiva@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:23', '2026-08-25 18:40:23', 1),
(30, 'JK0030', 'M.Ridhvikaa', '2016-06-16', 'OTHER', 'Yrtv', 'beautyangel3488@gmail.com', 'Nisha Manikandan', '8072717190', 'beautyangel3488@gmail.com', 'Manikandan', '9843379239', 'beautyangel3488@gmail.com', 'beautyangel3488@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:23', '2026-08-25 18:40:23', 1),
(31, 'JK0031', 'Sashini J', '2014-08-13', 'OTHER', 'Hayagrivas International school', 'sangeethass.1186@gmail.com', 'Sangeetha', '9677866914', 'sangeethass.1186@gmail.com', 'Jagannath S', '9543504388', 'sangeethass.1186@gmail.com', 'sangeethass.1186@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:23', '2026-08-25 18:40:23', 1),
(32, 'JK0032', 'Harini A', '2019-07-04', 'OTHER', 'The SIVAKASI LIONS School', 'anand51281@gmail.com', 'Pavithra A', '8825738301', 'anand51281@gmail.com', 'Anand S', '9488052702', 'anand51281@gmail.com', 'anand51281@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:23', '2026-08-25 18:40:23', 1),
(33, 'JK0033', 'B.Rakshita', '2016-10-30', 'OTHER', 'Yrtv matriculation school', 'rathnauthaya@gmail.com', 'B.Rathna', '9790530999', 'rathnauthaya@gmail.com', 'J.Balaguru', '9600487797', 'rathnauthaya@gmail.com', 'rathnauthaya@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:23', '2026-08-25 18:40:23', 1),
(34, 'JK0034', 'D. Bala Yasvanth', '2020-08-27', 'OTHER', 'The Sivakasi Lions primary school', 'umadeepak47@gmail.com', 'D. Uma Maheswari', '9600877763', 'umadeepak47@gmail.com', 'S.Deepak Kodeeswara Prabhu', '8072855698', 'umadeepak47@gmail.com', 'umadeepak47@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:23', '2026-08-25 18:40:23', 1),
(35, 'JK0035', 'S.G.Vishnu', '2017-04-07', 'OTHER', 'Lions nursery and primary school', 'shyam166@gmail.com', 'S.Girija', '8989974545', 'shyam166@gmail.com', 'P.Shyam sundar', '9097959093', 'shyam166@gmail.com', 'shyam166@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:23', '2026-08-25 18:40:23', 1),
(36, 'JK0036', 'SARUSH S', '2016-08-11', 'OTHER', 'THE SIVAKASI LIONS INTERNATIONAL INSTITUTIONS', 'santhoshlive1@gmail.com', 'SRUTHY SANTHOSH S', '7373724966', 'santhoshlive1@gmail.com', 'SANTHOSH KUMAR K', '9865824965', 'santhoshlive1@gmail.com', 'santhoshlive1@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:23', '2026-08-25 18:40:23', 1),
(37, 'JK0037', 'G P Avantheka', '2017-01-17', 'OTHER', 'Lions', 'svkspandis@gmail.com', 'R Amutha', '9894134466', 'svkspandis@gmail.com', 'G Pandi', '99404 99904', 'svkspandis@gmail.com', 'svkspandis@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:23', '2026-08-25 18:40:23', 1),
(38, 'JK0038', 'R.V.MIRNALINI', '2017-06-29', 'OTHER', 'THE SIVAKASI LIONS INTERNATIONAL INSTITUTIONS', 'preethivishnu09@gmail.com', 'PREETHI', '7708007447', 'preethivishnu09@gmail.com', 'VISHNU', '9894157447', 'preethivishnu09@gmail.com', 'preethivishnu09@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:24', '2026-08-25 18:40:24', 1),
(39, 'JK0039', 'A.Saajini', '2016-06-25', 'OTHER', 'Wisdom Wealth International School, Virudhunagar', 'm.lalith1985@gmail.com', 'Tejaswini. A', '9597656277', 'm.lalith1985@gmail.com', 'Arun Lalith Kumar. M', '9443156277', 'm.lalith1985@gmail.com', 'm.lalith1985@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:24', '2026-08-25 18:40:24', 1),
(40, 'JK0040', 'V.Gowshik', '2015-09-07', 'OTHER', 'Y.R.T.V.Matric Higher Secondary School,Sivakasi', 'baby.revathi@gmail.com', 'V.Revathi', '9790511896', 'baby.revathi@gmail.com', 'T.Vinod', '9994529955', 'baby.revathi@gmail.com', 'baby.revathi@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:24', '2026-08-25 18:40:24', 1),
(41, 'JK0041', 'S.Farhat Siddique', '2017-12-08', 'OTHER', 'Yrtv', 'syedabu02@gmail.com', 'M.Hajar Fathima', '9597793852', 'syedabu02@gmail.com', 'Syed abubakar Siddique', '+917868034393', 'syedabu02@gmail.com', 'syedabu02@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:24', '2026-08-25 18:40:24', 1),
(42, 'JK0042', 'S. Raja Gurubalan', '2020-08-09', 'OTHER', 'Arasan Model School', 'boojismiley@gmail.com', 'Shiva Boojitha', '9486860603', 'boojismiley@gmail.com', 'Srinivasan. G', '9487528904', 'boojismiley@gmail.com', 'boojismiley@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:24', '2026-08-25 18:40:24', 1),
(43, 'JK0043', 'G Sidvik Saran', '2017-10-30', 'OTHER', 'Lions IB', 'gsaran39@gmail.com', 'S Gowthami', '9894614882', 'gsaran39@gmail.com', 'A Giri Saranyan', '9944121882', 'gsaran39@gmail.com', 'gsaran39@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:24', '2026-08-25 18:40:24', 1),
(44, 'JK0044', 'Esshaa s', '2015-04-01', 'OTHER', 'The Sivakasi lions international intuitions', 'deebiju25@gmail.com', 'Deebiga s', '9840879034', 'deebiju25@gmail.com', 'ShivaSankar v', '9787722731', 'deebiju25@gmail.com', 'deebiju25@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:24', '2026-08-25 18:40:24', 1),
(45, 'JK0045', 'Milani Claret P', '2021-11-25', 'OTHER', 'YRTV', 'princeshell408@gmail.com', 'Divine Theresa J', '7397518516', 'princeshell408@gmail.com', 'Prince Marian L', '9789670072', 'princeshell408@gmail.com', 'princeshell408@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:24', '2026-08-25 18:40:24', 1),
(46, 'JK0046', 'VENBHA GOKUL', '2022-10-27', 'OTHER', 'YRTV', 'gokulworld@gmail.com', 'KIRUTHIKA', '9486729009', 'gokulworld@gmail.com', 'GOKUL', '9600980420', 'gokulworld@gmail.com', 'gokulworld@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:24', '2026-08-25 18:40:24', 1),
(47, 'JK0047', 'Adhith D', '2016-08-18', 'OTHER', 'The SivakasiLions  International institutions', 'nalini.nullworld@gmail.com', 'Nalini M', '9597197200', 'nalini.nullworld@gmail.com', 'Dhilip Kumar', '9597197200', 'nalini.nullworld@gmail.com', 'nalini.nullworld@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:24', '2026-08-25 18:40:24', 1),
(48, 'JK0048', 'Sarvesh', '2018-09-24', 'OTHER', 'Arasan model school CBSE', 'simsonite23@gmail.com', 'Sri Vidhya Bharathi', '9487134190', 'simsonite23@gmail.com', 'Sethuram', '9788226158', 'simsonite23@gmail.com', 'simsonite23@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:24', '2026-08-25 18:40:24', 1),
(49, 'JK0049', 'A.Aajith Krishna', '2021-02-17', 'OTHER', 'Wisdom Wealth International School,Sivakasi', 'nehaponsi@gmail.com', 'Pon Shruthi', '7397625834', 'nehaponsi@gmail.com', 'Aravind Krishna', '9442665152', 'nehaponsi@gmail.com', 'nehaponsi@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:24', '2026-08-25 18:40:24', 1),
(50, 'JK0050', 'A. NATHAN ANDREWS', '2021-08-21', 'OTHER', 'Y.R.T.V', 'antoruban.christ@gmail.com', 'A. SAROJA DEVI', '7010918144', 'antoruban.christ@gmail.com', 'H. ANTO RUBAN', '9843066859', 'antoruban.christ@gmail.com', 'antoruban.christ@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:24', '2026-08-25 18:40:24', 1),
(51, 'JK0051', 'S A Aadiran', '2022-05-31', 'OTHER', 'Y.R.T.V.Mat.Hr.Sec.School', 'adhiammu1221@gmail.com', 'R Hema Sathya Priya', '9842489961', 'adhiammu1221@gmail.com', 'S V Adiban', '7708155933', 'adhiammu1221@gmail.com', 'adhiammu1221@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:24', '2026-08-25 18:40:24', 1),
(52, 'JK0052', 'Anjana.A', '2021-12-14', 'OTHER', 'Sivakasi Lions nursery and primary school', 'rojaa.arun@gmail.com', 'Rojaa', '7598779777', 'rojaa.arun@gmail.com', 'Arun Prasad', '9489533141', 'rojaa.arun@gmail.com', 'rojaa.arun@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:24', '2026-08-25 18:40:24', 1),
(53, 'JK0053', 'A.Rakshitha Anu', '2022-09-03', 'OTHER', 'Lions School', 'neerajajeganathan@gmail.com', 'Neeraja', '9791977133', 'neerajajeganathan@gmail.com', 'Avinash Prakash', '9487558794', 'neerajajeganathan@gmail.com', 'neerajajeganathan@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:25', '2026-08-25 18:40:25', 1),
(54, 'JK0054', 'Imai', '2022-09-20', 'OTHER', 'Yrtv', 'btymbysivaranjani@gmail.com', 'Siva Ranjani', '9751457597', 'btymbysivaranjani@gmail.com', 'Adib', '8884168635', 'btymbysivaranjani@gmail.com', 'btymbysivaranjani@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:25', '2026-08-25 18:40:25', 1),
(55, 'JK0055', 'AADVIK K', '2020-09-03', 'OTHER', 'ARASAN MODEL SCHOOL', 'kinderpark1234@gmail.com', 'SOBIYA J', '9688602997', 'kinderpark1234@gmail.com', 'KANNAN P', '8610213544', 'kinderpark1234@gmail.com', 'kinderpark1234@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:25', '2026-08-25 18:40:25', 1),
(56, 'JK0056', 'S.T.TANISKA', '2023-05-01', 'OTHER', 'Hayagrivas International School Sivakasi', 'raghus155@gmail.com', 'T.Vishnu Priya', '9500340922', 'raghus155@gmail.com', 'S.Thanga Thirupathi', '8903134028', 'raghus155@gmail.com', 'raghus155@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:25', '2026-08-25 18:40:25', 1),
(57, 'JK0057', 'G.Akilesh', '2019-11-13', 'OTHER', 'S.H.N.V.Mat.Hr.Sec.School', 'bestkayu@gmail.com', 'C KAYATHRI', '9489539976', 'bestkayu@gmail.com', 'M GANESH PRABHU', '9095136949', 'bestkayu@gmail.com', 'bestkayu@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:25', '2026-08-25 18:40:25', 1),
(58, 'JK0058', 'DHARINESH.P', '2018-05-05', 'OTHER', 'THE SIVAKASI LIONS INTERNATIONAL INSTITUTIONS, SIVAKASI', 'chithradevimba@gmail.com', 'CHITHRA DEVI.P', '9443372844', 'chithradevimba@gmail.com', 'P.PRABHU KANNAN', '9842108298', 'chithradevimba@gmail.com', 'chithradevimba@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:26', '2026-08-25 18:40:26', 1),
(59, 'JK0059', 'M.Kanishka', '2023-05-23', 'OTHER', 'Sri Shenbaga Vinayakar', 'mahesh.s1526@gmail.com', 'M.Priyadhanashri', '8778064094', 'mahesh.s1526@gmail.com', 'S.Mahesh', '9751044763', 'mahesh.s1526@gmail.com', 'mahesh.s1526@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:26', '2026-08-25 18:40:26', 1),
(60, 'JK0060', 'Sri Niketha', '2020-06-04', 'OTHER', 'Hayagrivas', 'muthupradeep111@gmail.com', 'Mareeswari', '6369714675', 'muthupradeep111@gmail.com', 'Muthulingam', '8778499510', 'muthupradeep111@gmail.com', 'muthupradeep111@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:26', '2026-08-25 18:40:26', 1),
(61, 'JK0061', 'R.Sivanarul', '2020-05-25', 'OTHER', 'ARASAN MODEL SCHOOL', 'ramkrishnan.ca@gmail.com', 'R.Raja Vadhana', '9655736214', 'ramkrishnan.ca@gmail.com', 'S.Ramakrishnan', '9943627288', 'ramkrishnan.ca@gmail.com', 'ramkrishnan.ca@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:26', '2026-08-25 18:40:26', 1),
(62, 'JK0062', 'Sri Harshini. S', '2018-09-06', 'OTHER', 'Lions Matric Hr Sec School', 'selvaganeshan.g@gmail.com', 'Pandi selvi', '9942210141', 'selvaganeshan.g@gmail.com', 'Selva Ganeshan', '9442213234', 'selvaganeshan.g@gmail.com', 'selvaganeshan.g@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:26', '2026-08-25 18:40:26', 1),
(63, 'JK0063', 'Iyan Parakhraman', '2022-05-15', 'OTHER', 'Lions IB', 'kriswarya00@gmail.com', 'Iswarya Sankaralingam', 'Iswarya', 'kriswarya00@gmail.com', 'Adeendren', '9597827707', 'kriswarya00@gmail.com', 'kriswarya00@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:26', '2026-08-25 18:40:26', 1),
(64, 'JK0064', 'J Janos samuel', '2019-04-03', 'OTHER', 'Arasan model school', 'angelmarycse@gmail.com', 'A.Angel mary', '9994028394', 'angelmarycse@gmail.com', 'S.Joseph Gnanasekaran', '9677877670', 'angelmarycse@gmail.com', 'angelmarycse@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:26', '2026-08-25 18:40:26', 1),
(65, 'JK0065', 'Vidikshaa A', '2016-12-13', 'OTHER', 'The Sivakasi Lions Vision Academy', 'apj.info@gmail.com', 'Pavitha A', '9894166533', 'apj.info@gmail.com', 'Ananda Prabhu .J', '9894145533', 'apj.info@gmail.com', 'apj.info@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:26', '2026-08-25 18:40:26', 1),
(66, 'JK0066', 'S.Siddh', '2018-04-27', 'OTHER', 'Vels vidhyalaya', 'jananibds@gmail.com', 'L.Janani', '8056704303', 'jananibds@gmail.com', 'A.Sri Kishore Ganesh', '8220593048', 'jananibds@gmail.com', 'jananibds@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:26', '2026-08-25 18:40:26', 1),
(67, 'JK0067', 'K.S.Aadhavv', '2021-03-07', 'OTHER', 'YRTV Matriculation Higher Secondary School', 'nm.narmadha@yahoo.com', 'S.Narmadha', '9443433189', 'nm.narmadha@yahoo.com', 'K.Sibi Shunmuga Prabhu', '9500945909', 'nm.narmadha@yahoo.com', 'nm.narmadha@yahoo.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:26', '2026-08-25 18:40:26', 1),
(68, 'JK0068', 'Ratansai R', '2020-11-13', 'OTHER', 'The Sivakasi Lions School', 'ratanmobiless@gmail.com', 'Sankareswari M', '6385384324', 'ratanmobiless@gmail.com', 'Rajaguru G', '9025544455', 'ratanmobiless@gmail.com', 'ratanmobiless@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:26', '2026-08-25 18:40:26', 1),
(69, 'JK0069', 'J AADHIRAH', '2020-04-21', 'OTHER', 'Hayagrivas International School', 'jai.ganesh310@gmail.com', 'Navayuka Natshathra M', '8220593103', 'jai.ganesh310@gmail.com', 'Jai Ganesh R', '9655676313', 'jai.ganesh310@gmail.com', 'jai.ganesh310@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:26', '2026-08-25 18:40:26', 1),
(70, 'JK0070', 'G.Divesh', '2020-11-25', 'OTHER', 'YRTV.MAT.HR.SEC. SCHOOL', 'nandhininirudivu@gmail.com', 'G.Nandhini', '9150632629', 'nandhininirudivu@gmail.com', 'M.Gauthaman', '8754850212', 'nandhininirudivu@gmail.com', 'nandhininirudivu@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:26', '2026-08-25 18:40:26', 1),
(71, 'JK0071', 'Dheerej Yugan G', '2020-12-21', 'OTHER', 'Wisdom wealth international school', 'theanvel@gmail.com', 'Shurekha M', '9442255055', 'theanvel@gmail.com', 'Gautham Rathan P', '9791574339', 'theanvel@gmail.com', 'theanvel@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:27', '2026-08-25 18:40:27', 1),
(72, 'JK0072', 'Mohamed Zaim Al Noor', '2021-01-08', 'OTHER', 'YRTV Matric Hr Sec School', 'bilalnmohamed@gmail.com', 'Afreen Nida', '9047627979', 'bilalnmohamed@gmail.com', 'Mohamed Bilal', '9488757979', 'bilalnmohamed@gmail.com', 'bilalnmohamed@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:27', '2026-08-25 18:40:27', 1),
(73, 'JK0073', 'Ridhan H', '2021-10-13', 'OTHER', 'Arasan Model School, Sivakasi', 'mail2ash.chill@gmail.com', 'Ashwini H', '9655624209', 'mail2ash.chill@gmail.com', 'Harish DV', '7358251188', 'mail2ash.chill@gmail.com', 'mail2ash.chill@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:27', '2026-08-25 18:40:27', 1),
(74, 'JK0074', 'Sandra joymabel.c', '2021-09-09', 'OTHER', 'The sivakasi lions international institute', 'ranipanneer95@gmail.com', 'Selva rani', '8778205434', 'ranipanneer95@gmail.com', 'Castro bala subramanian', '9003781071', 'ranipanneer95@gmail.com', 'ranipanneer95@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:27', '2026-08-25 18:40:27', 1),
(75, 'JK0075', 'G TARUN KRISHNA', '2021-06-22', 'OTHER', 'Arasan Model School', 'dr.sachusomasundaram@gmail.com', 'Saraswathi S', '8940024924', 'dr.sachusomasundaram@gmail.com', 'Giriraj R', '9894227357', 'dr.sachusomasundaram@gmail.com', 'dr.sachusomasundaram@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:27', '2026-08-25 18:40:27', 1),
(76, 'JK0076', 'Jaden Benjamin Daniel. J', '2020-07-10', 'OTHER', 'Lions International Group Of Institutions', 'jenifer.5396@gmail.com', 'Jenifer J', '7094107975', 'jenifer.5396@gmail.com', 'Jebastin Paul Christopher', '9442223442', 'jenifer.5396@gmail.com', 'jenifer.5396@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:27', '2026-08-25 18:40:27', 1),
(77, 'JK0077', 'S.Samrudh Karan', '2020-12-18', 'OTHER', 'The Sivakasi lions international school', 'rash_venky@yahoo.com', 'Rashmi Venkatesh', '9487760264', 'rash_venky@yahoo.com', 'Siddharth Karunakaran', '9952296077', 'rash_venky@yahoo.com', 'rash_venky@yahoo.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:27', '2026-08-25 18:40:27', 1),
(78, 'JK0078', 'N.AADHAV', '2020-05-19', 'OTHER', 'YRTV', 'spkjayashree@gmail.com', 'N.JAYASHREE', '9786613878', 'spkjayashree@gmail.com', 'S.NATESH PRABHU', '9786683878', 'spkjayashree@gmail.com', 'spkjayashree@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:27', '2026-08-25 18:40:27', 1),
(79, 'JK0079', 'R. Kasini', '2021-08-04', 'OTHER', 'YRTV', 'jaivais1993@gmail.com', 'Jai Vaishnavi Rajadurai', '9629890907', 'jaivais1993@gmail.com', 'V. Raja Durai', '9944778868', 'jaivais1993@gmail.com', 'jaivais1993@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:27', '2026-08-25 18:40:27', 1),
(80, 'JK0080', 'K.S. .Dev Mithun', '2020-03-07', 'OTHER', 'Arasan model School ,CBSE', 'babychlm1234@gmail.com', 'K.Nandhini', '9994075085', 'babychlm1234@gmail.com', 'K.Shenbagamoorthy', '6382110695', 'babychlm1234@gmail.com', 'babychlm1234@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:27', '2026-08-25 18:40:27', 1),
(81, 'JK0081', 'Keshvika Krishnan', '2022-03-12', 'OTHER', 'Lions School', 'mareeswari1426@gmail.com', 'Mareeswari S', '9585066639', 'mareeswari1426@gmail.com', 'Muthukrishnan A', '9659141812', 'mareeswari1426@gmail.com', 'mareeswari1426@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:27', '2026-08-25 18:40:27', 1),
(82, 'JK0082', 'A.Ram Mithun', '2020-10-01', 'OTHER', 'YRTV', 'ashoklaksh123@gmail.com', 'Soundarya devi', '6369092360', 'ashoklaksh123@gmail.com', 'Ashok kumar', '8508561250', 'ashoklaksh123@gmail.com', 'ashoklaksh123@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:27', '2026-08-25 18:40:27', 1),
(83, 'JK0083', 'R. sarveshwaran', '2021-09-21', 'OTHER', 'YRTV. Hr. Sec. Scl', 'balajothisankaranarayanan@gmail.com', 'R. Balajothi', '6374786678', 'balajothisankaranarayanan@gmail.com', 'R. Ramjipandian', '9790567793', 'balajothisankaranarayanan@gmail.com', 'balajothisankaranarayanan@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:27', '2026-08-25 18:40:27', 1),
(84, 'JK0084', 'R.PUGAZHAN', '2020-11-11', 'OTHER', 'YRTV', 'rajaguruit@gmail.com', 'R.VIJAYALAKSHMI', '9994717695', 'rajaguruit@gmail.com', 'C.RAJAGURU', '8056088814', 'rajaguruit@gmail.com', 'rajaguruit@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:27', '2026-08-25 18:40:27', 1),
(85, 'JK0085', 'S.Kavin', '2021-10-25', 'OTHER', 'The Sivakasi lions Nursery and Primary school', 'ganeshaish2@gmail.com', 'S.Aishwarya', '9790262115', 'ganeshaish2@gmail.com', 'T Siva Ganesh', '9003614472', 'ganeshaish2@gmail.com', 'ganeshaish2@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:27', '2026-08-25 18:40:27', 1),
(86, 'JK0086', 'B.Yogamithran', '2021-05-08', 'OTHER', 'Yrtv', 'gomsjeya83@gmail.com', 'Gomathi', '9943875430', 'gomsjeya83@gmail.com', 'Balakrishnan', '9750975430', 'gomsjeya83@gmail.com', 'gomsjeya83@gmail.com', NULL, NULL, NULL, 1, '2026-08-25 18:40:27', '2026-08-25 18:40:27', 1);

-- --------------------------------------------------------

--
-- Table structure for table `student_enrollments`
--

CREATE TABLE `student_enrollments` (
  `enrollment_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `academic_year_id` int(11) NOT NULL,
  `programme_id` int(11) NOT NULL,
  `grade` varchar(50) DEFAULT NULL,
  `roll_number` varchar(50) DEFAULT NULL,
  `section` varchar(20) DEFAULT NULL COMMENT 'A, B, C etc.',
  `status` enum('ACTIVE','COMPLETED','WITHDRAWN','TRANSFERRED') DEFAULT NULL,
  `enrollment_date` date DEFAULT NULL,
  `completion_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `registration_source` varchar(30) DEFAULT NULL,
  `payment_method` varchar(100) DEFAULT NULL,
  `payment_proof_url` text DEFAULT NULL,
  `payment_qr_url` text DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `student_enrollments`
--

INSERT INTO `student_enrollments` (`enrollment_id`, `student_id`, `academic_year_id`, `programme_id`, `grade`, `roll_number`, `section`, `status`, `enrollment_date`, `completion_date`, `notes`, `registration_source`, `payment_method`, `payment_proof_url`, `payment_qr_url`, `created_at`, `updated_at`) VALUES
(1, 1, 2, 8, 'PRE-KG', '25RTJ0001', NULL, 'ACTIVE', '2026-08-18', NULL, NULL, 'MANUAL', NULL, NULL, NULL, '2026-08-18 17:36:03', '2026-08-18 17:36:03'),
(2, 2, 2, 9, 'GRADE II', '25RTS0001', NULL, 'ACTIVE', '2026-08-18', NULL, NULL, 'MANUAL', NULL, NULL, NULL, '2026-08-18 17:38:41', '2026-08-18 17:38:41'),
(3, 3, 2, 13, 'III', '25LRL30001', NULL, 'ACTIVE', '2026-08-19', NULL, NULL, 'MANUAL', NULL, NULL, NULL, '2026-08-19 07:10:42', '2026-08-19 07:10:42'),
(4, 2, 2, 8, '1. PRE-KG', '25RTJ0002', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1M00ShFaneVwq2QAXMGTK43Leoxt-hj8Q', NULL, '2026-08-25 18:40:21', '2026-08-25 18:40:21'),
(5, 4, 2, 10, '8. GRADE V', '25FLY0001', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1oYXy73H8v262ezZyAbJQPTiRGrXtyRI2', NULL, '2026-08-25 18:40:21', '2026-08-25 18:40:21'),
(6, 5, 2, 9, '5. GRADE II', '25RTS0002', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1iW8wzHnfLyZxnMhz1XWlB_JNfyLrWw7k', NULL, '2026-08-25 18:40:21', '2026-08-25 18:40:21'),
(7, 5, 2, 8, '2. LKG', '25RTJ0003', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1tQT444X8Z3ha8Hi4i2x2uu_r6N34KfWP', NULL, '2026-08-25 18:40:22', '2026-08-25 18:40:22'),
(8, 6, 2, 8, '3. UKG', '25RTJ0004', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1_77AJ-egSOv_xdI3e7cmZ1VLzm-xkPmJ', NULL, '2026-08-25 18:40:22', '2026-08-25 18:40:22'),
(9, 7, 2, 8, '1. PRE-KG', '25RTJ0005', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1LK0BBiFw16x4iN5iUF4oWpxrgYeCrnYu', NULL, '2026-08-25 18:40:22', '2026-08-25 18:40:22'),
(10, 8, 2, 10, '8. GRADE V', '25FLY0002', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1TQUFdiFqNunzCNtKAUPTnEGRIiY0qyqP', 'Sashwanth.S', '2026-08-25 18:40:22', '2026-08-25 18:40:22'),
(11, 9, 2, 8, '2. LKG', '25RTJ0006', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1i4M5agDq527-2EYSIg7nCBGjUpRN5Gcz', 'Paid', '2026-08-25 18:40:22', '2026-08-25 18:40:22'),
(12, 10, 2, 10, '9. GRADE VI', '25FLY0003', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1EY2HUPvTErkxc_P8-ffd7TZVgMQR2O8w', 'NA', '2026-08-25 18:40:22', '2026-08-25 18:40:22'),
(13, 11, 2, 8, '1. PRE-KG', '25RTJ0007', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1B_BVTD3eWQxnhRCvI6gIfhfZ_EEfjeGJ', 'Neft', '2026-08-25 18:40:22', '2026-08-25 18:40:22'),
(14, 12, 2, 8, '1. PRE-KG', '25RTJ0008', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1mI5-whtjmzA7JIKEDffe9Y-WH6UeRWqv', 'Neft', '2026-08-25 18:40:22', '2026-08-25 18:40:22'),
(15, 13, 2, 10, '7. GRADE IV', '25FLY0004', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1IvVEXr8w6Fh4HS_Forb0UIjsHZEDfZh0', 'No', '2026-08-25 18:40:22', '2026-08-25 18:40:22'),
(16, 14, 2, 9, '4. GRADE I', '25RTS0003', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1fDNKD9jnTpAiGYMNXDtzngncMo6hNKJO', 'Paid through GPay in person', '2026-08-25 18:40:22', '2026-08-25 18:40:22'),
(17, 15, 2, 10, '9. GRADE VI', '25FLY0005', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1n0AAjuUIXibb8BNoQ_j1IUcgjW_dQxOi', 'Paid through bank transfer', '2026-08-25 18:40:22', '2026-08-25 18:40:22'),
(18, 15, 2, 8, '3. UKG', '25RTJ0009', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=13n9pC-t0lECm6p9zLE3mAVSCMl6Oz1Z7', 'Paid through bank transfer', '2026-08-25 18:40:22', '2026-08-25 18:40:22'),
(19, 16, 2, 10, '8. GRADE V', '25FLY0006', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1LHZQxFqMRwjr-_Dj6341GSd2w7Bo_ROQ', 'Done', '2026-08-25 18:40:22', '2026-08-25 18:40:22'),
(20, 17, 2, 10, '9. GRADE VI', '25FLY0007', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1YhxYikEeNAhIgbjLp7AvLO1ObArNLR-Y', 'BANK TRANSFER DONE', '2026-08-25 18:40:22', '2026-08-25 18:40:22'),
(21, 17, 2, 8, '3. UKG', '25RTJ0010', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1Cuw7qD7mOoEpwUnTYZoT3Ics-ts_pBN5', 'BanK Transfer Done', '2026-08-25 18:40:22', '2026-08-25 18:40:22'),
(22, 18, 2, 9, '5. GRADE II', '25RTS0004', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1B6Kfp502S8GTT2RviH3_29sZ8e2hUB4j', 'shivsenthil333@okicici', '2026-08-25 18:40:22', '2026-08-25 18:40:22'),
(23, 19, 2, 9, '3. UKG', '25RTS0005', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=18buhBpaN4QD9zoqzD6DBwMsJC0JmLRqb', 'Bank transfer attached', '2026-08-25 18:40:22', '2026-08-25 18:40:22'),
(24, 20, 2, 8, '2. LKG', '25RTJ0011', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1NFUJy8LMxpm4D0h71CLf3rfqLuAJbToh', 'Qr Code Scan', '2026-08-25 18:40:22', '2026-08-25 18:40:22'),
(25, 21, 2, 9, '7. GRADE IV', '25RTS0006', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1SVZ6_o-A93SlxIJ-3v7FkxWGYH3KhE8R', 'Sent via Gpay 15k', '2026-08-25 18:40:23', '2026-08-25 18:40:23'),
(26, 22, 2, 8, '3. UKG', '25RTJ0012', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1eGeOEnQ25RmowGnZryk_ag8P0Iv_h1k1', 'No', '2026-08-25 18:40:23', '2026-08-25 18:40:23'),
(27, 23, 2, 8, '1. PRE-KG', '25RTJ0013', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1rZ6jn8g67ds90MbL-D3lIpJXetuonOsw', 'Gpay', '2026-08-25 18:40:23', '2026-08-25 18:40:23'),
(28, 24, 2, 8, '2. LKG', '25RTJ0014', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1T98GK2ZyTWBfUHiy1tYL0qjeyddtqQ89', 'Bank transfer', '2026-08-25 18:40:23', '2026-08-25 18:40:23'),
(29, 25, 2, 8, '2. LKG', '25RTJ0015', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1OSPvTA7OfFbqAnZ8AdT3ggiiA1s4TFNa', 'Done through bank transfer', '2026-08-25 18:40:23', '2026-08-25 18:40:23'),
(30, 26, 2, 8, '2. LKG', '25RTJ0016', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1OrJcCNTMMmWrLbaeABpREgzaUZaiplvH', 'Yes', '2026-08-25 18:40:23', '2026-08-25 18:40:23'),
(31, 27, 2, 9, '5. GRADE II', '25RTS0007', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1GXn2ewgkqMXSR7qCMWvxulPwQL4UFGP4', 'Bank transfer', '2026-08-25 18:40:23', '2026-08-25 18:40:23'),
(32, 28, 2, 9, '4. GRADE I', '25RTS0008', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1GdBndHsV0WS7Wn9XbYgZAqf5bcMud4sY', 'UPI', '2026-08-25 18:40:23', '2026-08-25 18:40:23'),
(33, 29, 2, 8, '2. LKG', '25RTJ0017', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1LrBFvZGsCtAfTmb5TUVvPhiZWNku-fcl', 'Scanned', '2026-08-25 18:40:23', '2026-08-25 18:40:23'),
(34, 30, 2, 10, '8. GRADE V', '25FLY0008', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1c0IP6Or-Nr2smBTuZoxSPGbEPOXOs5UV', 'Gpay', '2026-08-25 18:40:23', '2026-08-25 18:40:23'),
(35, 31, 2, 10, '10. GRADE VII', '25FLY0009', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1I5S517sh4xlYVudJ7OgLOSeZ6yoHiaxU', 'Paid', '2026-08-25 18:40:23', '2026-08-25 18:40:23'),
(36, 32, 2, 9, '5. GRADE II', '25RTS0009', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1ZNavdXyyVTW2-pWAxtP2PZSOOI9yRpT2', 'Ok', '2026-08-25 18:40:23', '2026-08-25 18:40:23'),
(37, 33, 2, 10, '8. GRADE V', '25FLY0010', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1KGLJ6R-LR080K9-Xy7pmw35vRWDKidkM', 'Gpay', '2026-08-25 18:40:23', '2026-08-25 18:40:23'),
(38, 34, 2, 9, '4. GRADE I', '25RTS0010', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1Pw4PSmYqeUghcmGuOuhXX07g9qJyagsA', 'Gpay', '2026-08-25 18:40:23', '2026-08-25 18:40:23'),
(39, 35, 2, 10, '7. GRADE IV', '25FLY0011', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1awZr9NbAqFxIWTzyLvnSBh3D69cLoTgA', 'Ok', '2026-08-25 18:40:23', '2026-08-25 18:40:23'),
(40, 36, 2, 10, '8. GRADE V', '25FLY0012', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1aZd0NX8nEKF3TYRGiQaGnlvAnl5TIuAI', 'NETBANKING', '2026-08-25 18:40:23', '2026-08-25 18:40:23'),
(41, 37, 2, 10, '7. GRADE IV', '25FLY0013', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=17wX3BXFRrcmqU5C3gktF_-0Vp0eLLqta', 'Paid 18000', '2026-08-25 18:40:23', '2026-08-25 18:40:23'),
(42, 38, 2, 10, '7. GRADE IV', '25FLY0014', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1JJ3EDMSD1ICQjj9Rvyp1d1kL7vqmDcvl', 'FLY R.V.Mirnalini', '2026-08-25 18:40:24', '2026-08-25 18:40:24'),
(43, 39, 2, 10, '8. GRADE V', '25FLY0015', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1XxBXpxb0LABUxs7-yo4Y8ttuQjlDnes9', NULL, '2026-08-25 18:40:24', '2026-08-25 18:40:24'),
(44, 40, 2, 10, '9. GRADE VI', '25FLY0016', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1daIPPe7CZSvjGBthHd1bKj-huDN1ynNA', 'GPAY', '2026-08-25 18:40:24', '2026-08-25 18:40:24'),
(45, 41, 2, 10, '6. GRADE III', '25FLY0017', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1E83JSeM1A9oCqAmaztqMs5pf7CmKpcrQ', 'Paid', '2026-08-25 18:40:24', '2026-08-25 18:40:24'),
(46, 42, 2, 9, '4. GRADE I', '25RTS0011', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1W8YcZtyPF5Kj57XIfbZUSx6meEGxBF2y', 'Paid', '2026-08-25 18:40:24', '2026-08-25 18:40:24'),
(47, 43, 2, 10, '7. GRADE IV', '25FLY0018', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1k-EXV3KOGRHMhTPusJ9zn69qFVwTnN2n', 'Qr code', '2026-08-25 18:40:24', '2026-08-25 18:40:24'),
(48, 44, 2, 10, '9. GRADE VI', '25FLY0019', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1SraRY_yMjL8AdsduXSiRbQdU3jfENjde', 'Payment done through bank', '2026-08-25 18:40:24', '2026-08-25 18:40:24'),
(49, 45, 2, 8, '3. UKG', '25RTJ0018', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=10yabvpHaYdyvjtDEqfMDBVMmwUoDkNye', 'Payment done.  And attached the screenshot below', '2026-08-25 18:40:24', '2026-08-25 18:40:24'),
(50, 46, 2, 8, '1. PRE-KG', '25RTJ0019', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1qPBnmvqman7VUf8Y6CcjQ4C88SqPevWe', '15000', '2026-08-25 18:40:24', '2026-08-25 18:40:24'),
(51, 47, 2, 10, '7. GRADE IV', '25FLY0020', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1AZM8mNRuo9zmW9eztPj_K3zsVAiDhmfN', 'Nalini', '2026-08-25 18:40:24', '2026-08-25 18:40:24'),
(52, 48, 2, 9, '6. GRADE III', '25RTS0012', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1l1-FfUpkIam8ksA7a78AGW5_CBmqP7lP', 'Done', '2026-08-25 18:40:24', '2026-08-25 18:40:24'),
(53, 49, 2, 8, '3. UKG', '25RTJ0020', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1fkT9JTJVuiv583XoY3lcSuX5KurEu8du', NULL, '2026-08-25 18:40:24', '2026-08-25 18:40:24'),
(54, 50, 2, 8, '2. LKG', '25RTJ0021', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1l_U1et7PaPrFXDCbQqvYKPwRGBaeM_q-', NULL, '2026-08-25 18:40:24', '2026-08-25 18:40:24'),
(55, 51, 2, 8, '2. LKG', '25RTJ0022', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1fjpu34CTTYuH6qUOEN1p37gj4t7x911X', NULL, '2026-08-25 18:40:24', '2026-08-25 18:40:24'),
(56, 52, 2, 8, '2. LKG', '25RTJ0023', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1tAogi2CioPXp7EAuS5LxAzYav-g25yAi', '₹15000', '2026-08-25 18:40:24', '2026-08-25 18:40:24'),
(57, 53, 2, 8, '2. LKG', '25RTJ0024', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=14vwXytwvU7W7ngcWeYf82BKI9Wmne22O', 'Gpay', '2026-08-25 18:40:25', '2026-08-25 18:40:25'),
(58, 54, 2, 8, '1. PRE-KG', '25RTJ0025', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1USROnfe49-RtTJwBbgLr4Fh9YUyALglA', 'Bank transfer', '2026-08-25 18:40:25', '2026-08-25 18:40:25'),
(59, 55, 2, 9, '4. GRADE I', '25RTS0013', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1tzRKAvJqzdggWszAO5JVEOUQ9Xrr818S', NULL, '2026-08-25 18:40:25', '2026-08-25 18:40:25'),
(60, 31, 2, 9, '5. GRADE II', '25RTS0014', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=18k6n-xZN6cF9zLLnXQw0C4F8yrpk7DR_', NULL, '2026-08-25 18:40:25', '2026-08-25 18:40:25'),
(61, 56, 2, 8, '1. PRE-KG', '25RTJ0026', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=11sIdzelFV3NueKZZdzf32CuR6gd0-pph', NULL, '2026-08-25 18:40:25', '2026-08-25 18:40:25'),
(62, 57, 2, 9, '5. GRADE II', '25RTS0015', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1bqnoq47J4bfbS0jGFfeahOcPbfArA2Zz', NULL, '2026-08-25 18:40:26', '2026-08-25 18:40:26'),
(63, 58, 2, 9, '6. GRADE III', '25RTS0016', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1kEcUMkg_GaE1DpPDMJoLLC6IP5GjGw2z', NULL, '2026-08-25 18:40:26', '2026-08-25 18:40:26'),
(64, 59, 2, 8, '1. PRE-KG', '25RTJ0027', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1EAKeCwAHsc10L1w6W4yymrQtNGfZs-A9', NULL, '2026-08-25 18:40:26', '2026-08-25 18:40:26'),
(65, 60, 2, 9, '3. UKG', '25RTS0017', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1GHlkDv09h9sO5_YW8InjCPnYMAaIU-T9', NULL, '2026-08-25 18:40:26', '2026-08-25 18:40:26'),
(66, 61, 2, 9, '4. GRADE I', '25RTS0018', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1ehsQ_kfBnRgXoQrO43QwktRZ_8t4VBZY', NULL, '2026-08-25 18:40:26', '2026-08-25 18:40:26'),
(67, 61, 2, 10, '10. GRADE VII', '25FLY0021', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1NuwrBdhQQsGhmDfyMVBCfFz0vRtDFqZC', NULL, '2026-08-25 18:40:26', '2026-08-25 18:40:26'),
(68, 62, 2, 9, '5. GRADE II', '25RTS0019', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1mR0rRxTQvvMsYNo55zYnkrHVh7tTSIkJ', NULL, '2026-08-25 18:40:26', '2026-08-25 18:40:26'),
(69, 63, 2, 8, '3. UKG', '25RTJ0028', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1b9T00vH39zftvPyM93EPE0o0GjYP-CMc', NULL, '2026-08-25 18:40:26', '2026-08-25 18:40:26'),
(70, 64, 2, 9, '6. GRADE III', '25RTS0020', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1tGFPUYo2jtPu6NbETxX-9Ow8BetSuOCj', NULL, '2026-08-25 18:40:26', '2026-08-25 18:40:26'),
(71, 65, 2, 10, '8. GRADE V', '25FLY0022', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1NIl52gctWEkkYxGyfsjaDYR8QqOseRZZ', NULL, '2026-08-25 18:40:26', '2026-08-25 18:40:26'),
(72, 66, 2, 9, '6. GRADE III', '25RTS0021', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1WjuWWFKO6aVpnBsTQIxX475q6o_1ukQ3', NULL, '2026-08-25 18:40:26', '2026-08-25 18:40:26'),
(73, 67, 2, 11, '3. UKG', '25LRL20001', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=16iu5L-D3O0A0poZZKGmlNi-DyfApwL_2', NULL, '2026-08-25 18:40:26', '2026-08-25 18:40:26'),
(74, 68, 2, 11, '4. GRADE I', '25LRL20002', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1lC7ZITPqN-uRx5sDZQmqS5Kfx2JxE-BU', NULL, '2026-08-25 18:40:26', '2026-08-25 18:40:26'),
(75, 69, 2, 11, '4. GRADE I', '25LRL20003', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1pIV4-9y0d13XU4uELrI3YDyQKN2BZ5DB', NULL, '2026-08-25 18:40:26', '2026-08-25 18:40:26'),
(76, 70, 2, 11, '3. UKG', '25LRL20004', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1F_fKpzMQFoIa2gRkE-qGHt8gQcPbKwTO', NULL, '2026-08-25 18:40:26', '2026-08-25 18:40:26'),
(77, 15, 2, 11, '3. UKG', '25LRL20005', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1EwxnYTjTZ_tgPMdxbqiGWUn8hwlO1DfI', NULL, '2026-08-25 18:40:27', '2026-08-25 18:40:27'),
(78, 71, 2, 8, '4. GRADE I', '25RTJ0029', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1gucOH4YYsoCSbDdwGqs7ga84W3pX67gb', NULL, '2026-08-25 18:40:27', '2026-08-25 18:40:27'),
(79, 72, 2, 12, '3. UKG', '25LRL10001', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1VMLrqcZKReXFu4Uk2QIcCDPXHKrMg2a1', NULL, '2026-08-25 18:40:27', '2026-08-25 18:40:27'),
(80, 55, 2, 12, '3. UKG', '25LRL10002', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1E0xJczwAy1PGssop5VDgUAVu3IZrzmFi', NULL, '2026-08-25 18:40:27', '2026-08-25 18:40:27'),
(81, 73, 2, 11, '3. UKG', '25LRL20006', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1kCylwvA0ucFyT4w5KhI_R9ri8EaWh11G', NULL, '2026-08-25 18:40:27', '2026-08-25 18:40:27'),
(82, 74, 2, 12, '3. UKG', '25LRL10003', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1EtJJRBpJN_F_gBGqoPH2eWB2Yt7ifpAo', NULL, '2026-08-25 18:40:27', '2026-08-25 18:40:27'),
(83, 75, 2, 12, '3. UKG', '25LRL10004', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1MQMM3bhnQcxs03qeYDRomhLp4n8DOIKZ', NULL, '2026-08-25 18:40:27', '2026-08-25 18:40:27'),
(84, 52, 2, 12, '2. LKG', '25LRL10005', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1UWsC4zmCPzpBqRPYIfEfW80bN1U5a_Hd', NULL, '2026-08-25 18:40:27', '2026-08-25 18:40:27'),
(85, 56, 2, 11, '3. UKG', '25LRL20007', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1YbsA7MCuzEhyeKg28Fbs4SiXh17rfG9T', NULL, '2026-08-25 18:40:27', '2026-08-25 18:40:27'),
(86, 76, 2, 12, '4. GRADE I', '25LRL10006', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1ZsNOTQc6lkHJiHDJZ2QBXKKXfu49BeVw', NULL, '2026-08-25 18:40:27', '2026-08-25 18:40:27'),
(87, 77, 2, 12, '4. GRADE I', '25LRL10007', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1bw2qMVZcC6P6F-wxdys5Q66-1kIiJRcd', NULL, '2026-08-25 18:40:27', '2026-08-25 18:40:27'),
(88, 78, 2, 11, '4. GRADE I', '25LRL20008', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1onf7wSqEQcgP8BKGWuAF6WHOMkx_khTC', NULL, '2026-08-25 18:40:27', '2026-08-25 18:40:27'),
(89, 79, 2, 11, '3. UKG', '25LRL20009', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1zWsNlOxutrcL2A99PdT-LHRBmvU0_y9T', NULL, '2026-08-25 18:40:27', '2026-08-25 18:40:27'),
(90, 19, 2, 11, '3. UKG', '25LRL20010', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=124AcXbJTNQGto7dIxBXtclY__ov1i4VT', NULL, '2026-08-25 18:40:27', '2026-08-25 18:40:27'),
(91, 80, 2, 11, '4. GRADE I', '25LRL20011', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1fC54nHjv4E949wsWWRoXrLZs1-d7z-Vi', NULL, '2026-08-25 18:40:27', '2026-08-25 18:40:27'),
(92, 81, 2, 12, '2. LKG', '25LRL10008', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1grhmeyJr34Kaj9aO0SgJRQAcTZe7N7oJ', NULL, '2026-08-25 18:40:27', '2026-08-25 18:40:27'),
(93, 82, 2, 12, '3. UKG', '25LRL10009', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1WY6zCfo1Yf20jdQxv71RbQ7zMYKDnZQ8', NULL, '2026-08-25 18:40:27', '2026-08-25 18:40:27'),
(94, 83, 2, 12, '3. UKG', '25LRL10010', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1383KGS66CrvPV6WnEKuvLhI_gdmcp8K_', NULL, '2026-08-25 18:40:27', '2026-08-25 18:40:27'),
(95, 84, 2, 11, '3. UKG', '25LRL20012', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1AkObBumOIoIkpvCXPnOaYFwocfTutAUb', NULL, '2026-08-25 18:40:27', '2026-08-25 18:40:27'),
(96, 85, 2, 11, '3. UKG', '25LRL20013', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=14Hy3HAK6WgGXVcNKGJ9nGrFKzqOe4-hr', NULL, '2026-08-25 18:40:27', '2026-08-25 18:40:27'),
(97, 86, 2, 12, '3. UKG', '25LRL10011', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1ZS4LQdzM82PhFwU2D0xaKwqIKCdWYqRx', NULL, '2026-08-25 18:40:27', '2026-08-25 18:40:27'),
(98, 63, 2, 12, '3. UKG', '25LRL10012', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1fBdJrokoBpcpuP_wqlB4al5_xrc5FuX_', NULL, '2026-08-25 18:40:27', '2026-08-25 18:40:27'),
(99, 43, 2, 11, '4. GRADE I', '25LRL20014', NULL, 'ACTIVE', '2026-08-26', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1zGBJdt5v9Uyz74Cc4kVbtHzqpFuRs1GD', NULL, '2026-08-25 18:40:27', '2026-08-25 18:40:27');

-- --------------------------------------------------------

--
-- Table structure for table `student_subscriptions`
--

CREATE TABLE `student_subscriptions` (
  `subscription_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `subscription_plan_id` int(11) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('ACTIVE','EXPIRED','CANCELLED','PENDING') DEFAULT NULL,
  `amount_paid` decimal(10,2) DEFAULT NULL,
  `payment_date` date DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `student_subscriptions`
--

INSERT INTO `student_subscriptions` (`subscription_id`, `student_id`, `subscription_plan_id`, `start_date`, `end_date`, `status`, `amount_paid`, `payment_date`, `payment_method`, `notes`, `created_at`, `updated_at`) VALUES
(1, 2, 4, '2026-08-19', '2026-11-17', 'ACTIVE', 500.00, '2026-08-19', NULL, NULL, '2026-08-18 19:16:58', '2026-08-18 19:16:58'),
(2, 3, 5, '2026-08-19', '2027-02-15', 'ACTIVE', 1000.00, '2026-08-19', NULL, NULL, '2026-08-19 07:10:58', '2026-08-19 07:10:58'),
(3, 1, 4, '2026-08-25', '2026-11-23', 'ACTIVE', 500.00, '2026-08-25', NULL, NULL, '2026-08-25 13:53:04', '2026-08-25 13:53:04'),
(4, 13, 4, '2026-08-26', '2026-11-24', 'ACTIVE', 500.00, '2026-08-26', 'BANK TRANSFER', 'Created from student Excel import', '2026-08-25 18:40:22', '2026-08-25 18:40:22'),
(5, 28, 4, '2026-08-26', '2026-11-24', 'ACTIVE', 500.00, '2026-08-26', 'UPI/GPAY/PAYTM', 'Created from student Excel import', '2026-08-25 18:40:23', '2026-08-25 18:40:23'),
(6, 36, 4, '2026-08-26', '2026-11-24', 'ACTIVE', 500.00, '2026-08-26', 'BANK TRANSFER', 'Created from student Excel import', '2026-08-25 18:40:23', '2026-08-25 18:40:23'),
(7, 42, 4, '2026-08-26', '2026-11-24', 'ACTIVE', 500.00, '2026-08-26', 'UPI/GPAY/PAYTM', 'Created from student Excel import', '2026-08-25 18:40:24', '2026-08-25 18:40:24'),
(8, 55, 4, '2026-08-26', '2026-11-24', 'ACTIVE', 500.00, '2026-08-26', 'UPI/GPAY/PAYTM', 'Created from student Excel import', '2026-08-25 18:40:25', '2026-08-25 18:40:25'),
(9, 63, 4, '2026-08-26', '2026-11-24', 'ACTIVE', 500.00, '2026-08-26', 'BANK TRANSFER', 'Created from student Excel import', '2026-08-25 18:40:26', '2026-08-25 18:40:26'),
(10, 66, 4, '2026-08-26', '2026-11-24', 'ACTIVE', 500.00, '2026-08-26', 'UPI/GPAY/PAYTM', 'Created from student Excel import', '2026-08-25 18:40:26', '2026-08-25 18:40:26');

-- --------------------------------------------------------

--
-- Table structure for table `subscription_plans`
--

CREATE TABLE `subscription_plans` (
  `subscription_plan_id` int(11) NOT NULL,
  `plan_name` varchar(50) NOT NULL,
  `plan_code` varchar(20) DEFAULT NULL,
  `max_books` int(11) NOT NULL,
  `duration_months` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subscription_plans`
--

INSERT INTO `subscription_plans` (`subscription_plan_id`, `plan_name`, `plan_code`, `max_books`, `duration_months`, `price`, `is_active`, `description`, `created_at`, `updated_at`) VALUES
(4, 'Caterpillar', 'CAT', 1, 3, 500.00, 1, '', '2026-08-18 19:15:22', '2026-08-18 19:15:22'),
(5, 'Butterfly', 'BUT', 2, 6, 1000.00, 1, '', '2026-08-18 19:15:51', '2026-08-18 19:15:51'),
(6, 'Annual', 'ANU', 3, 12, 2000.00, 1, '', '2026-08-18 19:16:49', '2026-08-18 19:16:49');

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `setting_id` int(11) NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `data_type` enum('STRING','INTEGER','DECIMAL','BOOLEAN','JSON','DATE') DEFAULT NULL,
  `category` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `is_editable` tinyint(1) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`setting_id`, `setting_key`, `setting_value`, `data_type`, `category`, `description`, `is_editable`, `updated_by`, `created_at`, `updated_at`) VALUES
(1, 'school_name', 'Just Kidding Co', 'STRING', 'GENERAL', 'Official institution name', 1, NULL, '2026-08-17 07:03:57', '2026-08-25 14:23:48'),
(2, 'fine_per_day', '5.00', 'DECIMAL', 'LIBRARY', 'Daily overdue fine in INR', 1, NULL, '2026-08-17 07:03:57', '2026-08-17 07:03:57'),
(3, 'default_issue_days', '14', 'INTEGER', 'LIBRARY', 'Standard issue period in days', 1, NULL, '2026-08-17 07:03:57', '2026-08-17 07:03:57'),
(4, 'max_books_default', '2', 'INTEGER', 'LIBRARY', 'Default max books allowed per student', 1, NULL, '2026-08-17 07:03:57', '2026-08-17 07:03:57'),
(5, 'currency_symbol', '₹', 'STRING', 'FINANCE', 'Currency symbol used in display', 1, NULL, '2026-08-17 07:03:57', '2026-08-17 07:03:57'),
(6, 'warning_threshold_default', '100.00', 'DECIMAL', 'FINANCE', 'Minimum balance warning threshold', 1, NULL, '2026-08-17 07:03:57', '2026-08-17 07:03:57'),
(7, 'low_deposit_threshold', '3000', 'DECIMAL', 'Deposit', 'Low deposit warning and borrowing-block threshold', 1, NULL, '2026-08-19 09:57:26', '2026-08-27 11:07:47');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `role` enum('ADMIN','STAFF') DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `email`, `password_hash`, `full_name`, `role`, `is_active`, `last_login`, `created_at`, `updated_at`) VALUES
(1, 'admin', 'admin@kinderpark.com', '$2b$12$OwFcrN/TSuIWISgru/YxPu46kqZ1T/nGRBiBhAQIimyc5knD.Ig6y', 'System Administrator', 'ADMIN', 1, '2026-08-27 18:04:16', '2026-08-17 07:03:55', '2026-08-27 12:34:16'),
(4, 'staff', 'staff@kinderpark.com', '$2b$12$UocGqYfYqcysiGCPHp7uXOS..3fSCmAFjFT2E5eUUx2dhg45RtQw2', 'Varshini M.', 'STAFF', 1, '2026-08-25 19:49:04', '2026-08-19 07:24:09', '2026-08-25 14:19:04'),
(5, 'sarah', 'sarah.librarian@kinderpark.com', '$2b$12$fIL4vpIPc/OPWgxDfXKNdepUvWi/DTeGlwJgjdtZlmntqY.a/71CS', 'Sarah Jenkins', 'STAFF', 1, NULL, '2026-08-27 12:20:41', '2026-08-27 12:20:41'),
(6, 'david', 'david.clerk@kinderpark.com', '$2b$12$nZ2capqyaz//Y7o/Lz9vyuSSOy9F7imrx11pU16Kyszy7GCKv4HtC', 'David Miller', 'STAFF', 1, NULL, '2026-08-27 12:20:41', '2026-08-27 12:20:41');

-- --------------------------------------------------------

--
-- Table structure for table `user_permissions`
--

CREATE TABLE `user_permissions` (
  `user_permission_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  `is_allowed` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_permissions`
--

INSERT INTO `user_permissions` (`user_permission_id`, `user_id`, `permission_id`, `is_allowed`, `created_at`, `updated_at`) VALUES
(489, 4, 29, 1, '2026-08-26 10:44:05', '2026-08-26 10:44:05'),
(490, 5, 28, 1, '2026-08-27 12:31:40', '2026-08-27 12:31:40'),
(491, 5, 30, 1, '2026-08-27 12:31:40', '2026-08-27 12:31:40'),
(492, 5, 29, 1, '2026-08-27 12:31:40', '2026-08-27 12:31:40'),
(493, 5, 27, 1, '2026-08-27 12:31:41', '2026-08-27 12:31:41');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `academic_years`
--
ALTER TABLE `academic_years`
  ADD PRIMARY KEY (`academic_year_id`),
  ADD UNIQUE KEY `year_code` (`year_code`);

--
-- Indexes for table `alembic_version`
--
ALTER TABLE `alembic_version`
  ADD PRIMARY KEY (`version_num`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`audit_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `book_categories`
--
ALTER TABLE `book_categories`
  ADD PRIMARY KEY (`category_id`),
  ADD UNIQUE KEY `category_code` (`category_code`);

--
-- Indexes for table `book_copies`
--
ALTER TABLE `book_copies`
  ADD PRIMARY KEY (`book_copy_id`),
  ADD UNIQUE KEY `barcode` (`barcode`),
  ADD UNIQUE KEY `accession_number` (`accession_number`),
  ADD KEY `book_title_id` (`book_title_id`);

--
-- Indexes for table `book_issues`
--
ALTER TABLE `book_issues`
  ADD PRIMARY KEY (`issue_id`),
  ADD KEY `book_copy_id` (`book_copy_id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `enrollment_id` (`enrollment_id`),
  ADD KEY `issued_by` (`issued_by`);

--
-- Indexes for table `book_levels`
--
ALTER TABLE `book_levels`
  ADD PRIMARY KEY (`level_id`),
  ADD UNIQUE KEY `level_code` (`level_code`);

--
-- Indexes for table `book_level_sequences`
--
ALTER TABLE `book_level_sequences`
  ADD PRIMARY KEY (`level_id`);

--
-- Indexes for table `book_returns`
--
ALTER TABLE `book_returns`
  ADD PRIMARY KEY (`return_id`),
  ADD UNIQUE KEY `issue_id` (`issue_id`),
  ADD KEY `received_by` (`received_by`);

--
-- Indexes for table `book_titles`
--
ALTER TABLE `book_titles`
  ADD PRIMARY KEY (`book_title_id`),
  ADD KEY `level_id` (`level_id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `damage_loss_records`
--
ALTER TABLE `damage_loss_records`
  ADD PRIMARY KEY (`record_id`),
  ADD KEY `book_copy_id` (`book_copy_id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `issue_id` (`issue_id`),
  ADD KEY `recorded_by` (`recorded_by`),
  ADD KEY `deposit_transaction_id` (`deposit_transaction_id`);

--
-- Indexes for table `deposit_accounts`
--
ALTER TABLE `deposit_accounts`
  ADD PRIMARY KEY (`deposit_account_id`),
  ADD UNIQUE KEY `student_id` (`student_id`);

--
-- Indexes for table `deposit_transactions`
--
ALTER TABLE `deposit_transactions`
  ADD PRIMARY KEY (`transaction_id`),
  ADD KEY `deposit_account_id` (`deposit_account_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `grade_levels`
--
ALTER TABLE `grade_levels`
  ADD PRIMARY KEY (`grade_id`),
  ADD UNIQUE KEY `grade_code` (`grade_code`);

--
-- Indexes for table `holidays`
--
ALTER TABLE `holidays`
  ADD PRIMARY KEY (`holiday_id`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`permission_id`),
  ADD UNIQUE KEY `permission_code` (`permission_code`);

--
-- Indexes for table `programmes`
--
ALTER TABLE `programmes`
  ADD PRIMARY KEY (`programme_id`),
  ADD UNIQUE KEY `programme_name` (`programme_name`),
  ADD UNIQUE KEY `programme_code` (`programme_code`);

--
-- Indexes for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`role_permission_id`),
  ADD KEY `permission_id` (`permission_id`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`student_id`),
  ADD UNIQUE KEY `student_uid` (`student_uid`);

--
-- Indexes for table `student_enrollments`
--
ALTER TABLE `student_enrollments`
  ADD PRIMARY KEY (`enrollment_id`),
  ADD UNIQUE KEY `uq_student_year_programme` (`student_id`,`academic_year_id`,`programme_id`),
  ADD KEY `academic_year_id` (`academic_year_id`),
  ADD KEY `programme_id` (`programme_id`);

--
-- Indexes for table `student_subscriptions`
--
ALTER TABLE `student_subscriptions`
  ADD PRIMARY KEY (`subscription_id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `subscription_plan_id` (`subscription_plan_id`);

--
-- Indexes for table `subscription_plans`
--
ALTER TABLE `subscription_plans`
  ADD PRIMARY KEY (`subscription_plan_id`),
  ADD UNIQUE KEY `plan_name` (`plan_name`),
  ADD UNIQUE KEY `plan_code` (`plan_code`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`setting_id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`),
  ADD KEY `updated_by` (`updated_by`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `user_permissions`
--
ALTER TABLE `user_permissions`
  ADD PRIMARY KEY (`user_permission_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `permission_id` (`permission_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `academic_years`
--
ALTER TABLE `academic_years`
  MODIFY `academic_year_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `audit_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=146;

--
-- AUTO_INCREMENT for table `book_categories`
--
ALTER TABLE `book_categories`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `book_copies`
--
ALTER TABLE `book_copies`
  MODIFY `book_copy_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `book_issues`
--
ALTER TABLE `book_issues`
  MODIFY `issue_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `book_levels`
--
ALTER TABLE `book_levels`
  MODIFY `level_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `book_level_sequences`
--
ALTER TABLE `book_level_sequences`
  MODIFY `level_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `book_returns`
--
ALTER TABLE `book_returns`
  MODIFY `return_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `book_titles`
--
ALTER TABLE `book_titles`
  MODIFY `book_title_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `damage_loss_records`
--
ALTER TABLE `damage_loss_records`
  MODIFY `record_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `deposit_accounts`
--
ALTER TABLE `deposit_accounts`
  MODIFY `deposit_account_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=87;

--
-- AUTO_INCREMENT for table `deposit_transactions`
--
ALTER TABLE `deposit_transactions`
  MODIFY `transaction_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `grade_levels`
--
ALTER TABLE `grade_levels`
  MODIFY `grade_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `holidays`
--
ALTER TABLE `holidays`
  MODIFY `holiday_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `permission_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- AUTO_INCREMENT for table `programmes`
--
ALTER TABLE `programmes`
  MODIFY `programme_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `role_permissions`
--
ALTER TABLE `role_permissions`
  MODIFY `role_permission_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `student_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=87;

--
-- AUTO_INCREMENT for table `student_enrollments`
--
ALTER TABLE `student_enrollments`
  MODIFY `enrollment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;

--
-- AUTO_INCREMENT for table `student_subscriptions`
--
ALTER TABLE `student_subscriptions`
  MODIFY `subscription_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `subscription_plans`
--
ALTER TABLE `subscription_plans`
  MODIFY `subscription_plan_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `setting_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `user_permissions`
--
ALTER TABLE `user_permissions`
  MODIFY `user_permission_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=494;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `book_copies`
--
ALTER TABLE `book_copies`
  ADD CONSTRAINT `book_copies_ibfk_1` FOREIGN KEY (`book_title_id`) REFERENCES `book_titles` (`book_title_id`);

--
-- Constraints for table `book_issues`
--
ALTER TABLE `book_issues`
  ADD CONSTRAINT `book_issues_ibfk_1` FOREIGN KEY (`book_copy_id`) REFERENCES `book_copies` (`book_copy_id`),
  ADD CONSTRAINT `book_issues_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`),
  ADD CONSTRAINT `book_issues_ibfk_3` FOREIGN KEY (`enrollment_id`) REFERENCES `student_enrollments` (`enrollment_id`),
  ADD CONSTRAINT `book_issues_ibfk_4` FOREIGN KEY (`issued_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `book_returns`
--
ALTER TABLE `book_returns`
  ADD CONSTRAINT `book_returns_ibfk_1` FOREIGN KEY (`issue_id`) REFERENCES `book_issues` (`issue_id`),
  ADD CONSTRAINT `book_returns_ibfk_2` FOREIGN KEY (`received_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `book_titles`
--
ALTER TABLE `book_titles`
  ADD CONSTRAINT `book_titles_ibfk_1` FOREIGN KEY (`level_id`) REFERENCES `book_levels` (`level_id`),
  ADD CONSTRAINT `book_titles_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `book_categories` (`category_id`);

--
-- Constraints for table `damage_loss_records`
--
ALTER TABLE `damage_loss_records`
  ADD CONSTRAINT `damage_loss_records_ibfk_1` FOREIGN KEY (`book_copy_id`) REFERENCES `book_copies` (`book_copy_id`),
  ADD CONSTRAINT `damage_loss_records_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`),
  ADD CONSTRAINT `damage_loss_records_ibfk_3` FOREIGN KEY (`issue_id`) REFERENCES `book_issues` (`issue_id`),
  ADD CONSTRAINT `damage_loss_records_ibfk_4` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `damage_loss_records_ibfk_5` FOREIGN KEY (`deposit_transaction_id`) REFERENCES `deposit_transactions` (`transaction_id`);

--
-- Constraints for table `deposit_accounts`
--
ALTER TABLE `deposit_accounts`
  ADD CONSTRAINT `deposit_accounts_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`);

--
-- Constraints for table `deposit_transactions`
--
ALTER TABLE `deposit_transactions`
  ADD CONSTRAINT `deposit_transactions_ibfk_1` FOREIGN KEY (`deposit_account_id`) REFERENCES `deposit_accounts` (`deposit_account_id`),
  ADD CONSTRAINT `deposit_transactions_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`permission_id`);

--
-- Constraints for table `student_enrollments`
--
ALTER TABLE `student_enrollments`
  ADD CONSTRAINT `student_enrollments_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`),
  ADD CONSTRAINT `student_enrollments_ibfk_2` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`academic_year_id`),
  ADD CONSTRAINT `student_enrollments_ibfk_3` FOREIGN KEY (`programme_id`) REFERENCES `programmes` (`programme_id`);

--
-- Constraints for table `student_subscriptions`
--
ALTER TABLE `student_subscriptions`
  ADD CONSTRAINT `student_subscriptions_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`),
  ADD CONSTRAINT `student_subscriptions_ibfk_2` FOREIGN KEY (`subscription_plan_id`) REFERENCES `subscription_plans` (`subscription_plan_id`);

--
-- Constraints for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD CONSTRAINT `system_settings_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `user_permissions`
--
ALTER TABLE `user_permissions`
  ADD CONSTRAINT `user_permissions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `user_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`permission_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
