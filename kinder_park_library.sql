-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 01, 2026 at 06:45 AM
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
(4, '2026-27', '2k26 batch', '2026-06-01', '2027-03-31', 1, 1, '2026-08-30 10:30:12', '2026-08-30 10:30:12');

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
('20260830_academic_library');

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
(158, 1, 'admin', 'COMPLETE_SYSTEM_RESET', 'Settings', NULL, 'Complete reset cleared 19 data tables; administrators, permissions, and settings were preserved.', NULL, NULL, '2026-08-30 10:20:47'),
(159, 1, 'admin', 'CREATE_ACADEMIC_YEAR', 'Academic', '2026-27', 'Created academic year: 2026-27', NULL, NULL, '2026-08-30 10:30:12'),
(160, 1, 'admin', 'IMPORT_STUDENT_SPREADSHEET', 'Student', NULL, 'Imported 101 enrollment(s) from FLY _ Read To Rock! _ Lit Readers Membership Form 2026-27 (Responses).xlsx', NULL, NULL, '2026-08-30 10:30:41'),
(161, 1, 'admin', 'RESET_ALL_STUDENTS', 'Student', 'ALL', 'Cleared all student records, enrollments, and reset sequence counters.', NULL, NULL, '2026-08-30 10:32:13'),
(162, 1, 'admin', 'IMPORT_STUDENT_SPREADSHEET', 'Student', NULL, 'Imported 101 enrollment(s) from FLY _ Read To Rock! _ Lit Readers Membership Form 2026-27 (Responses).xlsx', NULL, NULL, '2026-08-30 13:44:54'),
(163, 1, 'admin', 'CREATE_SUBSCRIPTION_PLAN', 'Subscription', 'CAT', 'Created plan: caterpiller', NULL, NULL, '2026-08-30 13:46:35'),
(164, 1, 'admin', 'CREATE_SUBSCRIPTION_PLAN', 'Subscription', 'BUT', 'Created plan: butterfly', NULL, NULL, '2026-08-30 13:47:05'),
(165, 1, 'admin', 'CREATE_SUBSCRIPTION_PLAN', 'Subscription', 'ANN', 'Created plan: annual', NULL, NULL, '2026-08-30 13:47:30'),
(166, 1, 'admin', 'RESET_ALL_STUDENTS', 'Student', 'ALL', 'Cleared all student records, enrollments, and reset sequence counters.', NULL, NULL, '2026-08-30 13:48:00'),
(167, 1, 'admin', 'IMPORT_STUDENT_SPREADSHEET', 'Student', NULL, 'Imported 101 enrollment(s) from FLY _ Read To Rock! _ Lit Readers Membership Form 2026-27 (Responses).xlsx', NULL, NULL, '2026-08-30 13:48:11'),
(168, 1, 'admin', 'UPDATE_SETTING', 'Settings', 'low_deposit_threshold', 'Updated setting low_deposit_threshold to 300', NULL, NULL, '2026-08-30 13:48:55'),
(169, 1, 'admin', 'CREATE_BOOK', 'Book', '8', 'Created book: The Very Hungry Caterpillar by Eric Carle with first physical copy', NULL, NULL, '2026-08-30 13:51:49'),
(170, 1, 'admin', 'CREATE_BOOK', 'Book', '9', 'Created book: my last days by mukesh kumar with first physical copy', NULL, NULL, '2026-08-30 13:54:43'),
(171, 1, 'admin', 'CREATE_BOOK', 'Book', '10', 'Created book: Ikigai by Héctor García with first physical copy', NULL, NULL, '2026-08-30 14:21:35'),
(172, 1, 'admin', 'LOGOUT', 'Auth', NULL, 'User logged out', NULL, NULL, '2026-08-30 14:22:49'),
(173, 1, 'admin', 'LOGIN', 'Auth', NULL, 'User logged in successfully', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0', '2026-08-30 14:22:52'),
(174, 1, 'admin', 'LOGOUT', 'Auth', NULL, 'User logged out', NULL, NULL, '2026-08-30 14:35:43'),
(175, 1, 'admin', 'LOGIN', 'Auth', NULL, 'User logged in successfully', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0', '2026-08-30 14:35:45'),
(176, 1, 'admin', 'UPDATE_BOOK', 'Book', '9', 'Updated book fields: {\"category_id\": {\"from\": \"13\", \"to\": \"11\"}}', NULL, NULL, '2026-08-30 14:52:56'),
(177, 1, 'admin', 'LOGOUT', 'Auth', NULL, 'User logged out', NULL, NULL, '2026-08-30 15:01:25'),
(178, 1, 'admin', 'LOGIN', 'Auth', NULL, 'User logged in successfully', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0', '2026-08-30 15:01:27'),
(179, 1, 'admin', 'TODAY_HOLIDAY_CONFIRMED', 'Holiday', '2026-08-30', '2026-08-30 confirmed as sunday', NULL, NULL, '2026-08-30 15:01:47'),
(180, 1, 'admin', 'LOGOUT', 'Auth', NULL, 'User logged out', NULL, NULL, '2026-08-30 15:02:11'),
(181, 1, 'admin', 'LOGIN', 'Auth', NULL, 'User logged in successfully', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0', '2026-08-30 15:02:13'),
(182, 1, 'admin', 'DELETE_BOOK_APPROVED', 'Book', '9', 'Requested deletion of book: my last days | Approved by admin', NULL, NULL, '2026-08-30 15:07:58'),
(183, 1, 'admin', 'DEPOSIT_TOPUP', 'Deposit', '32', 'Topped up ₹5000.0 for student 32. Cleared outstanding: ₹0.0, Net balance addition: ₹5000.0', NULL, NULL, '2026-08-30 15:15:00'),
(184, 1, 'admin', 'ISSUE_BOOK', 'Library', '5', 'Issued book copy 9 to student 32', NULL, NULL, '2026-08-30 15:16:14'),
(185, 1, 'admin', 'RETURN_BOOK', 'Library', '5', 'Returned book, fine: 70.0, damage: 100, deducted: 170.0, outstanding: 0.0', NULL, NULL, '2026-08-30 15:18:40'),
(186, 1, 'admin', 'LOGOUT', 'Auth', NULL, 'User logged out', NULL, NULL, '2026-08-30 16:33:52'),
(187, 1, 'admin', 'LOGIN', 'Auth', NULL, 'User logged in successfully', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0', '2026-08-30 16:35:15'),
(188, 1, 'admin', 'UPDATE_PROFILE', 'Auth', NULL, 'User updated profile details', NULL, NULL, '2026-08-30 16:36:45'),
(189, 1, 'admin', 'UPDATE_PROFILE', 'Auth', NULL, 'User updated profile details', NULL, NULL, '2026-08-30 16:36:51'),
(190, 1, 'admin', 'LOGOUT', 'Auth', NULL, 'User logged out', NULL, NULL, '2026-08-30 16:36:55'),
(191, 1, 'admin', 'RESET_PASSWORD', 'Auth', '1', 'Password reset using a signed recovery link', NULL, NULL, '2026-08-30 16:55:36'),
(192, 1, 'admin', 'LOGIN', 'Auth', NULL, 'User logged in successfully', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-30 16:55:52'),
(193, 1, 'admin', 'LOGIN', 'Auth', NULL, 'User logged in successfully', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-31 17:18:30'),
(194, 1, 'admin', 'TODAY_NOT_HOLIDAY', 'Holiday', '2026-08-31', '2026-08-31 confirmed as a working day', NULL, NULL, '2026-08-31 17:18:35');

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
(11, 'F-P', 'fiction picture book', '', 1, '2026-08-30 10:25:49'),
(12, 'F-CH', 'fiction chapter book', '', 1, '2026-08-30 10:27:04'),
(13, 'NF-P', 'non-fiction picture book', '', 1, '2026-08-30 10:27:38'),
(14, 'NF-CH', 'non-fiction chapter book', '', 1, '2026-08-30 10:28:27');

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
(9, 8, 1, '100001', NULL, 2022, NULL, 'DAMAGED', 'DAMAGED', 'Main Shelf', NULL, '2026-08-30 13:51:49', '2026-08-30 15:18:40'),
(11, 8, 2, '100002', NULL, NULL, NULL, 'NEW', 'AVAILABLE', 'Main Shelf', NULL, '2026-08-30 14:19:49', '2026-08-30 14:19:49'),
(12, 10, 1, '300001', NULL, 22222, NULL, 'NEW', 'AVAILABLE', 'Main Shelf', NULL, '2026-08-30 14:21:35', '2026-08-30 14:21:35');

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
(5, 9, 32, NULL, '2026-08-01', '20:46:14', '2026-08-15', NULL, 1, 'RETURNED', NULL, '2026-08-30 15:16:14', '2026-08-30 15:18:40');

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
(11, 'L1', 'level 1', '', 1, 1, '2026-08-30 10:23:00'),
(12, 'L2', 'Level 2', '', 2, 1, '2026-08-30 10:23:15'),
(13, 'L3', 'level 3', '', 3, 1, '2026-08-30 10:24:10'),
(14, 'L4', 'level 4', '', 4, 1, '2026-08-30 10:24:34'),
(15, 'L5', 'Level 5', '', 5, 1, '2026-08-30 10:24:54');

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
(11, 2, '2026-08-30 14:19:49'),
(12, 1, '2026-08-30 13:54:43'),
(13, 1, '2026-08-30 14:21:35');

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
(3, 5, '2026-08-30', '20:48:40', 1, 'GOOD', 1, 0, 70.00, 100.00, '', '2026-08-30 15:18:40');

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
(8, 'The Very Hungry Caterpillar', 'Eric Carle', '9780399226908', 500.00, 11, NULL, 1969, 'World Publishing Company', NULL, NULL, '2026-08-30 13:51:49', '2026-08-30 13:51:49', 0),
(10, 'Ikigai', 'Héctor García', '9780143130727', 333.00, 13, 13, 2017, 'Penguin Life', NULL, NULL, '2026-08-30 14:21:35', '2026-08-30 14:21:35', 0);

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
(1, 14, 0.00, 0.00, 300.00, NULL, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0.00),
(2, 32, 4830.00, 0.00, 300.00, '2026-08-30 20:45:00', '2026-08-30 13:48:09', '2026-08-30 15:18:40', 0.00),
(3, 40, 0.00, 0.00, 300.00, NULL, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0.00),
(4, 46, 0.00, 0.00, 300.00, NULL, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0.00),
(5, 61, 0.00, 0.00, 300.00, NULL, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0.00),
(6, 71, 0.00, 0.00, 300.00, NULL, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0.00),
(7, 74, 0.00, 0.00, 300.00, NULL, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0.00);

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
(1, 2, 'TOP_UP', 5000.00, 5000.00, NULL, 'Deposit payment', 1, '2026-08-30 15:15:00'),
(2, 2, 'DAMAGE_CHARGE', -170.00, 4830.00, '5', 'Return #5: Fine ₹70.00, Damage ₹100.00. Deducted ₹170.00', 1, '2026-08-30 15:18:40');

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
(12, 'sunday', '2026-08-30', 0, 'Confirmed from daily admin notification', '2026-08-30 15:01:47', '2026-08-30 15:01:47');

-- --------------------------------------------------------

--
-- Table structure for table `member_groups`
--

CREATE TABLE `member_groups` (
  `group_code` varchar(40) NOT NULL,
  `group_name` varchar(100) NOT NULL,
  `singular_label` varchar(100) NOT NULL,
  `plural_label` varchar(100) NOT NULL,
  `library_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `programmes_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `subscriptions_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `member_groups`
--

INSERT INTO `member_groups` (`group_code`, `group_name`, `singular_label`, `plural_label`, `library_enabled`, `programmes_enabled`, `subscriptions_enabled`, `is_active`, `created_at`) VALUES
('JK_MEMBERS', 'JK Members', 'JK Member', 'JK Members', 1, 1, 1, 1, '2026-09-01 08:11:52'),
('KINDER_PARK', 'Kinder Park', 'Kinder Park Student', 'Kinder Park Students', 0, 0, 0, 1, '2026-09-01 08:11:52');

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
(46, 'export.create', 'Export Data', 'export', 'Can export data', '2026-08-19 07:28:35'),
(47, 'user.create', 'Create Users', 'users', 'Can create system users', '2026-08-31 18:37:41'),
(48, 'user.edit', 'Edit Users', 'users', 'Can edit system users and permissions', '2026-08-31 18:37:41'),
(49, 'user.delete', 'Delete Users', 'users', 'Can disable or delete system users', '2026-08-31 18:37:41'),
(50, 'ebook.view', 'View E-books Page', 'e-books', 'Can view information-only e-book records', '2026-08-31 18:37:41'),
(51, 'ebook.create', 'Create E-books', 'e-books', 'Can add information-only e-book records', '2026-08-31 18:37:41'),
(52, 'ebook.edit', 'Edit E-books', 'e-books', 'Can edit information-only e-book records', '2026-08-31 18:37:41'),
(53, 'ebook.delete', 'Delete E-books', 'e-books', 'Can delete information-only e-book records', '2026-08-31 18:37:42'),
(54, 'subscription.payment.view', 'View Subscription Payments Page', 'subscription payments', 'Can view academic-year subscription payments', '2026-08-31 18:37:42'),
(55, 'subscription.payment.edit', 'Edit Subscription Payments', 'subscription payments', 'Can correct subscription payment details', '2026-08-31 18:37:42'),
(56, 'holiday.create', 'Create Holidays', 'holidays', 'Can add holidays to the calendar', '2026-08-31 18:37:42'),
(57, 'holiday.edit', 'Edit Holidays', 'holidays', 'Can edit holidays in the calendar', '2026-08-31 18:37:42'),
(58, 'holiday.delete', 'Delete Holidays', 'holidays', 'Can delete holidays from the calendar', '2026-08-31 18:37:42'),
(59, 'deposit.refund', 'Refund Deposit', 'deposits', 'Can return the complete deposit when next-year library subscription is declined', '2026-09-01 02:20:06');

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
(28, 'READ TO ROCK! JUNIORS', 'RTJ', 'Auto-created from Excel import', '(3-5)', 1, 1, 0, '2026-08-30 10:30:39', '2026-08-30 10:51:54'),
(29, 'READ TO ROCK! SENIORS', 'RTS', 'Auto-created from Excel import', '(6-8)', 1, 1, 0, '2026-08-30 10:30:39', '2026-08-30 10:51:54'),
(30, 'FLY', 'F', 'Auto-created from Excel import', '(9-12)', 1, 1, 0, '2026-08-30 10:30:39', '2026-08-30 11:05:54'),
(31, 'LIT READERS LEVEL - II', 'LRLI', 'Auto-created from Excel import', '(5-8)', 1, 1, 0, '2026-08-30 10:30:41', '2026-08-30 10:51:54'),
(32, 'LIT READERS LEVEL - I', 'LRLI1', 'Auto-created from Excel import', '(4-6)', 1, 1, 0, '2026-08-30 10:30:41', '2026-08-30 10:51:54');

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
  `library_access` tinyint(1) DEFAULT 1,
  `member_group_code` varchar(40) NOT NULL DEFAULT 'JK_MEMBERS'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`student_id`, `student_uid`, `student_name`, `date_of_birth`, `gender`, `school_name`, `student_email`, `mother_name`, `mother_phone`, `mother_email`, `father_name`, `father_phone`, `father_email`, `address`, `emergency_contact_name`, `emergency_contact_phone`, `medical_notes`, `is_active`, `created_at`, `updated_at`, `library_access`, `member_group_code`) VALUES
(1, 'JK0001', 'C. Iniya', '2023-02-06', 'OTHER', 'YRTV', 'dhakshana262@gmail.com', 'R. D. Dhakshana', '8220435688', NULL, 'G. K. Chidambaram', '8870949735', NULL, 'dhakshana262@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0, 'JK_MEMBERS'),
(2, 'JK0002', 'A.V.Gowshith', '2018-11-12', 'OTHER', 'YRTV mat hr sec school', 'nithisha@asoksparklers.com', 'Nithisha Vignesh', '9626176419', NULL, 'Vignesh', '9994976419', NULL, 'nithisha@asoksparklers.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0, 'JK_MEMBERS'),
(3, 'JK0003', 'V.Vihanikha', '2022-12-26', 'OTHER', 'YRTV mat hr sec school', 'nithisha@asoksparklers.com', 'Nithisha Vignesh', '9626176419', NULL, 'VIGNESH', '9994976419', NULL, 'nithisha@asoksparklers.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0, 'JK_MEMBERS'),
(4, 'JK0004', 'R. Moushika Ragshri', '2016-12-19', 'OTHER', 'The sivakasi lions nursary and primary school', 'shyamala1211@gmail.com', 'R. Shyamala Gowri', '9597428148', NULL, 'V. Ragunath', '8667239571', NULL, 'shyamala1211@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0, 'JK_MEMBERS'),
(5, 'JK0005', 'keerthy G', '2019-04-01', 'OTHER', 'The Sivakasi Lions Nursery and Primary School', 'vishalismiley@gmail.com', 'G.vishali devi', '7339108939', NULL, 'M.Ganesan', '9944052108', NULL, 'vishalismiley@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0, 'JK_MEMBERS'),
(6, 'JK0006', 'Vedashree.G', '2022-05-04', 'OTHER', 'The Sivakasi Lions Nursery and Primary School', 'vishalismiley@gmail.com', 'Vishali devi .G', '7339108939', NULL, 'Ganesan.M', '9944052108', NULL, 'vishalismiley@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0, 'JK_MEMBERS'),
(7, 'JK0007', 'S. Vishmaya', '2021-03-03', 'OTHER', 'YRTV MHSS', 'darshinikumar.13@gmail.com', 'S. Darshini', '8098088855', NULL, 'K.S.Saravanan', '9566659141', NULL, 'darshinikumar.13@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0, 'JK_MEMBERS'),
(8, 'JK0008', 'S. Yaazhisai', '2022-07-02', 'OTHER', 'YRTV MHSS', 'kaviya1692kalyanakumar@gmail.com', 'K. Kaviya', '9790337183', NULL, 'R. Srinivas', '9677954585', NULL, 'kaviya1692kalyanakumar@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0, 'JK_MEMBERS'),
(9, 'JK0009', 'S.Sashwanth', '2016-01-16', 'OTHER', 'The Sivakasi Lions Nursery and Primary School', 'sivaranjani59@gmail.com', 'B.Sivaranjani', '9943236899', NULL, 'R.Satheesh', '9943236899', NULL, 'sivaranjani59@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0, 'JK_MEMBERS'),
(10, 'JK0010', 'V.Samridhi', '2021-09-20', 'OTHER', 'Lions IB', 'babyuma10@gmail.com', 'U.Baby Uma', '7550044141', NULL, 'V.Vivekanandhan', '9629944141', NULL, 'babyuma10@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0, 'JK_MEMBERS'),
(11, 'JK0011', 'A A RUTHVIK', '2015-10-14', 'OTHER', 'The Sivakasi Lions International Institutions', 'anujha.rajen@gmail.com', 'Anujha Ajeet', '9994874749', NULL, 'Ajeet Sankar A', '9443121866', NULL, 'anujha.rajen@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0, 'JK_MEMBERS'),
(12, 'JK0012', 'R. ATHISH', '2022-09-15', 'OTHER', 'YRTV', 'akshayadharshini04@gmail.com', 'Akshaya Dharshini', '9486546938', NULL, 'Raj Bharat', '9585227511', NULL, 'akshayadharshini04@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0, 'JK_MEMBERS'),
(13, 'JK0013', 'Navina Shree R', '2022-10-28', 'OTHER', 'YRTV', 'aishwaryaram7373@gmail.com', 'Aishwarya R', '9655227511', NULL, 'Ram Prasad B', '9047107511', NULL, 'aishwaryaram7373@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0, 'JK_MEMBERS'),
(14, 'JK0014', 'Daniel Vashikaran', '2017-03-18', 'OTHER', 'AAA International School', 'zakaria591009@gmail.com', 'Preethi Vashikaran', '8870688819', NULL, 'Vashikaran Rajendrasingh', '8870688888', NULL, 'zakaria591009@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 1, 'JK_MEMBERS'),
(15, 'JK0015', 'Advaitha K', '2020-09-18', 'OTHER', 'The Sivakasi Lions School', 'tkanahasabapathy@googlemail.com', 'Radhika', '8754931977', NULL, 'Kanaga Sabapathy T', '8095094141', NULL, 'tkanahasabapathy@googlemail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0, 'JK_MEMBERS'),
(16, 'JK0016', 'Akshita K', '2020-09-18', 'OTHER', 'The Sivakasi Lions School', 'tkanahasabapathy@googlemail.com', 'Radhika', '8754931977', NULL, 'Kanaga Sabapathy T', '8095094141', NULL, 'tkanahasabapathy@googlemail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0, 'JK_MEMBERS'),
(17, 'JK0017', 'Amith Vivaan', '2016-01-14', 'OTHER', 'YRTV Mat.Hr.Sec school', 'ahalya.neeraja@gmail.com', 'Ahalya Viswanath', '8754999771', NULL, 'S.P. Viswanath', '9003466771', NULL, 'ahalya.neeraja@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0, 'JK_MEMBERS'),
(18, 'JK0018', 'V. Aariv Yugan', '2021-05-27', 'OTHER', 'YRTV Mat. Hr. Sec school', 'ahalya.neeraja@gmail.com', 'Ahalya Viswanath', '8754999771', NULL, 'S.P.Viswanath', '9003466771', NULL, 'ahalya.neeraja@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0, 'JK_MEMBERS'),
(19, 'JK0019', 'V . Prajan', '2016-07-27', 'OTHER', 'lions school', 'kumarvignesh1328@gmail.com', 'V. Raja rajeshwari', '8870004938', NULL, 'R. Vignesh kumar', '9994504938', NULL, 'kumarvignesh1328@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0, 'JK_MEMBERS'),
(20, 'JK0020', 'Jithesh R', '2015-09-23', 'OTHER', 'Lions Vision Academy CBSE', 'rammanoj4290@gmail.com', 'Thulasi Lakshmi R', '9500831996', NULL, 'Ramnath S P', '9003466996', NULL, 'rammanoj4290@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0, 'JK_MEMBERS'),
(21, 'JK0021', 'Maanvi Thara R', '2021-04-22', 'OTHER', 'Lions Nursery And Primary School - CBSE', 'rammanoj4290@gmail.com', 'Thulasi Lakshmi R', '9500831996', NULL, 'Ramnath S P', '9003466996', NULL, 'rammanoj4290@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0, 'JK_MEMBERS'),
(22, 'JK0022', 'V.Vidyuth', '2019-10-30', 'OTHER', 'YRTV', 'shivsenthil333@gmail.com', 'Siva Priya Vinith', '7708518200', NULL, 'Vinith Kumar', '9789182834', NULL, 'shivsenthil333@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0, 'JK_MEMBERS'),
(23, 'JK0023', 'Vasudhra V', '2021-08-08', 'OTHER', 'Lions Nursery and Primary School', 'manimaranrohini95@gmail.com', 'Rohini V', '9894896417', NULL, 'Vishakan V', '+919003760125', NULL, 'manimaranrohini95@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0, 'JK_MEMBERS'),
(24, 'JK0024', 'Rya V', '2022-05-19', 'OTHER', 'YRTV', 'tulvino@gmail.com', 'Tulasi V', '9943364397', NULL, 'Vinoth Bhaskaran', '9171057923', NULL, 'tulvino@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0, 'JK_MEMBERS'),
(25, 'JK0025', 'Ridhamika', '2017-12-13', 'OTHER', 'YRTV Matric Higher secondary school', 'chestersudhakar@gmail.com', 'Sowmiya', '7708023246', NULL, 'Sudhakar', '9894723538', NULL, 'chestersudhakar@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0, 'JK_MEMBERS'),
(26, 'JK0026', 'Diya', '2021-10-11', 'OTHER', 'Lions IB', 'varshiniganesh@gmail.com', 'Varshini Pramod', '8870013156', NULL, 'Pramod Sankar', '9894223156', NULL, 'varshiniganesh@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0, 'JK_MEMBERS'),
(27, 'JK0027', 'Y.yashvitha', '2023-03-28', 'OTHER', 'Lions (cbse)', 'sindhumahendran91@gmail.com', 'Y.Sindhu', '91 9843860622', NULL, 'N.K.Yogesh kumar', '9843220896', NULL, 'sindhumahendran91@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0, 'JK_MEMBERS'),
(28, 'JK0028', 'P.KRISHIV', '2021-11-12', 'OTHER', 'Lions International', 'poomaanandh@gmail.com', 'PoomaDevi Anantharajan', '8056320173', NULL, 'Siva', '9443320173', NULL, 'poomaanandh@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0, 'JK_MEMBERS'),
(29, 'JK0029', 'Aarohi Bharath', '2022-08-10', 'OTHER', 'Lions IB', 'mail2aishwaryabharath@gmail.com', 'Aishwarya Bharath', '9566060135', NULL, 'Bharath TK', '9843488999', NULL, 'mail2aishwaryabharath@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0, 'JK_MEMBERS'),
(30, 'JK0030', 'P.R.NITHIN', '2021-10-10', 'OTHER', 'Yrtv school', 'jave1995@gmail.com', 'R.Shanmuga Priya', '8248223132', NULL, 'P.Rajavel', '8870788127', NULL, 'jave1995@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0, 'JK_MEMBERS'),
(31, 'JK0031', 'Rajatattvan', '2019-03-24', 'OTHER', 'The Sivakasi lions international school', 'saranyaborn2win@gmail.com', 'Saranya', '8940312669', NULL, 'SHANMUGA NATARAJ', '9751999999', NULL, 'saranyaborn2win@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0, 'JK_MEMBERS'),
(32, 'JK0032', 'K Tharun Abhinav', '2020-02-13', 'OTHER', 'Arasan Model School', 'karthiksasp@gmail.com', 'K Pon Indhuja', '9790274810', NULL, 'G Karthik paulrajan', '9994874810', NULL, 'karthiksasp@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 1, 'JK_MEMBERS'),
(33, 'JK0033', 'J.Dhaanya', '2022-09-24', 'OTHER', 'The Sivakasi Lions Matriculation Higher Secondary School', 'aruljsiva@gmail.com', 'Arul Renganayagi', '9943385902', NULL, 'P.Jeyasiva', '9952211221', NULL, 'aruljsiva@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0, 'JK_MEMBERS'),
(34, 'JK0034', 'M.Ridhvikaa', '2016-06-16', 'OTHER', 'Yrtv', 'beautyangel3488@gmail.com', 'Nisha Manikandan', '8072717190', NULL, 'Manikandan', '9843379239', NULL, 'beautyangel3488@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0, 'JK_MEMBERS'),
(35, 'JK0035', 'Sashini J', '2014-08-13', 'OTHER', 'Hayagrivas International school', 'sangeethass.1186@gmail.com', 'Sangeetha', '9677866914', NULL, 'Jagannath S', '9543504388', NULL, 'sangeethass.1186@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0, 'JK_MEMBERS'),
(36, 'JK0036', 'Harini A', '2019-07-04', 'OTHER', 'The SIVAKASI LIONS School', 'anand51281@gmail.com', 'Pavithra A', '8825738301', NULL, 'Anand S', '9488052702', NULL, 'anand51281@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0, 'JK_MEMBERS'),
(37, 'JK0037', 'B.Rakshita', '2016-10-30', 'OTHER', 'Yrtv matriculation school', 'rathnauthaya@gmail.com', 'B.Rathna', '9790530999', NULL, 'J.Balaguru', '9600487797', NULL, 'rathnauthaya@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0, 'JK_MEMBERS'),
(38, 'JK0038', 'D. Bala Yasvanth', '2020-08-27', 'OTHER', 'The Sivakasi Lions primary school', 'umadeepak47@gmail.com', 'D. Uma Maheswari', '9600877763', NULL, 'S.Deepak Kodeeswara Prabhu', '8072855698', NULL, 'umadeepak47@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0, 'JK_MEMBERS'),
(39, 'JK0039', 'S.G.Vishnu', '2017-04-07', 'OTHER', 'Lions nursery and primary school', 'shyam166@gmail.com', 'S.Girija', '8989974545', NULL, 'P.Shyam sundar', '9097959093', NULL, 'shyam166@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0, 'JK_MEMBERS'),
(40, 'JK0040', 'SARUSH S', '2016-08-11', 'OTHER', 'THE SIVAKASI LIONS INTERNATIONAL INSTITUTIONS', 'santhoshlive1@gmail.com', 'SRUTHY SANTHOSH S', '7373724966', NULL, 'SANTHOSH KUMAR K', '9865824965', NULL, 'santhoshlive1@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 1, 'JK_MEMBERS'),
(41, 'JK0041', 'G P Avantheka', '2017-01-17', 'OTHER', 'Lions', 'svkspandis@gmail.com', 'R Amutha', '9894134466', NULL, 'G Pandi', '99404 99904', NULL, 'svkspandis@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0, 'JK_MEMBERS'),
(42, 'JK0042', 'R.V.MIRNALINI', '2017-06-29', 'OTHER', 'THE SIVAKASI LIONS INTERNATIONAL INSTITUTIONS', 'preethivishnu09@gmail.com', 'PREETHI', '7708007447', NULL, 'VISHNU', '9894157447', NULL, 'preethivishnu09@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0, 'JK_MEMBERS'),
(43, 'JK0043', 'A.Saajini', '2016-06-25', 'OTHER', 'Wisdom Wealth International School, Virudhunagar', 'm.lalith1985@gmail.com', 'Tejaswini. A', '9597656277', NULL, 'Arun Lalith Kumar. M', '9443156277', NULL, 'm.lalith1985@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0, 'JK_MEMBERS'),
(44, 'JK0044', 'V.Gowshik', '2015-09-07', 'OTHER', 'Y.R.T.V.Matric Higher Secondary School,Sivakasi', 'baby.revathi@gmail.com', 'V.Revathi', '9790511896', NULL, 'T.Vinod', '9994529955', NULL, 'baby.revathi@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0, 'JK_MEMBERS'),
(45, 'JK0045', 'S.Farhat Siddique', '2017-12-08', 'OTHER', 'Yrtv', 'syedabu02@gmail.com', 'M.Hajar Fathima', '9597793852', NULL, 'Syed abubakar Siddique', '+917868034393', NULL, 'syedabu02@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0, 'JK_MEMBERS'),
(46, 'JK0046', 'S. Raja Gurubalan', '2020-08-09', 'OTHER', 'Arasan Model School', 'boojismiley@gmail.com', 'Shiva Boojitha', '9486860603', NULL, 'Srinivasan. G', '9487528904', NULL, 'boojismiley@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 1, 'JK_MEMBERS'),
(47, 'JK0047', 'G Sidvik Saran', '2017-10-30', 'OTHER', 'Lions IB', 'gsaran39@gmail.com', 'S Gowthami', '9894614882', NULL, 'A Giri Saranyan', '9944121882', NULL, 'gsaran39@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0, 'JK_MEMBERS'),
(48, 'JK0048', 'Sidvik Saran', '2016-10-30', 'OTHER', 'The lions international school', 'gowthamiroddick@gmail.com', 'Gowthami Sanjeevi', '9894614882', NULL, 'Giri Saranyan', '9944121882', NULL, 'gowthamiroddick@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0, 'JK_MEMBERS'),
(49, 'JK0049', 'Esshaa s', '2015-04-01', 'OTHER', 'The Sivakasi lions international intuitions', 'deebiju25@gmail.com', 'Deebiga s', '9840879034', NULL, 'ShivaSankar v', '9787722731', NULL, 'deebiju25@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0, 'JK_MEMBERS'),
(50, 'JK0050', 'JUNO S', '2017-12-13', 'OTHER', 'The Sivakasi lions international institution', 'deebiju25@gmail.com', 'Deebiga ShivaSankar', '9840879034', NULL, 'ShivaSankar v', '9787722731', NULL, 'deebiju25@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0, 'JK_MEMBERS'),
(51, 'JK0051', 'Milani Claret P', '2021-11-25', 'OTHER', 'YRTV', 'princeshell408@gmail.com', 'Divine Theresa J', '7397518516', NULL, 'Prince Marian L', '9789670072', NULL, 'princeshell408@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0, 'JK_MEMBERS'),
(52, 'JK0052', 'VENBHA GOKUL', '2022-10-27', 'OTHER', 'YRTV', 'gokulworld@gmail.com', 'KIRUTHIKA', '9486729009', NULL, 'GOKUL', '9600980420', NULL, 'gokulworld@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0, 'JK_MEMBERS'),
(53, 'JK0053', 'Adhith D', '2016-08-18', 'OTHER', 'The SivakasiLions  International institutions', 'nalini.nullworld@gmail.com', 'Nalini M', '9597197200', NULL, 'Dhilip Kumar', '9597197200', NULL, 'nalini.nullworld@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0, 'JK_MEMBERS'),
(54, 'JK0054', 'Sarvesh', '2018-09-24', 'OTHER', 'Arasan model school CBSE', 'simsonite23@gmail.com', 'Sri Vidhya Bharathi', '9487134190', NULL, 'Sethuram', '9788226158', NULL, 'simsonite23@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0, 'JK_MEMBERS'),
(55, 'JK0055', 'A.Aajith Krishna', '2021-02-17', 'OTHER', 'Wisdom Wealth International School,Sivakasi', 'nehaponsi@gmail.com', 'Pon Shruthi', '7397625834', NULL, 'Aravind Krishna', '9442665152', NULL, 'nehaponsi@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0, 'JK_MEMBERS'),
(56, 'JK0056', 'A. NATHAN ANDREWS', '2021-08-21', 'OTHER', 'Y.R.T.V', 'antoruban.christ@gmail.com', 'A. SAROJA DEVI', '7010918144', NULL, 'H. ANTO RUBAN', '9843066859', NULL, 'antoruban.christ@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0, 'JK_MEMBERS'),
(57, 'JK0057', 'S A Aadiran', '2022-05-31', 'OTHER', 'Y.R.T.V.Mat.Hr.Sec.School', 'adhiammu1221@gmail.com', 'R Hema Sathya Priya', '9842489961', NULL, 'S V Adiban', '7708155933', NULL, 'adhiammu1221@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0, 'JK_MEMBERS'),
(58, 'JK0058', 'Anjana.A', '2021-12-14', 'OTHER', 'Sivakasi Lions nursery and primary school', 'rojaa.arun@gmail.com', 'Rojaa', '7598779777', NULL, 'Arun Prasad', '9489533141', NULL, 'rojaa.arun@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0, 'JK_MEMBERS'),
(59, 'JK0059', 'A.Rakshitha Anu', '2022-09-03', 'OTHER', 'Lions School', 'neerajajeganathan@gmail.com', 'Neeraja', '9791977133', NULL, 'Avinash Prakash', '9487558794', NULL, 'neerajajeganathan@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0, 'JK_MEMBERS'),
(60, 'JK0060', 'Imai', '2022-09-20', 'OTHER', 'Yrtv', 'btymbysivaranjani@gmail.com', 'Siva Ranjani', '9751457597', NULL, 'Adib', '8884168635', NULL, 'btymbysivaranjani@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0, 'JK_MEMBERS'),
(61, 'JK0061', 'AADVIK K', '2020-09-03', 'OTHER', 'ARASAN MODEL SCHOOL', 'kinderpark1234@gmail.com', 'SOBIYA J', '9688602997', NULL, 'KANNAN P', '8610213544', NULL, 'kinderpark1234@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 1, 'JK_MEMBERS'),
(62, 'JK0062', 'Silamban Jeyaraj', '2020-03-30', 'OTHER', 'Hayagrivas International School', 'saaralfoodcraft@gmail.com', 'Sangeetha', '9677866914', NULL, 'Jagannath S', '9543504388', NULL, 'saaralfoodcraft@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0, 'JK_MEMBERS'),
(63, 'JK0063', 'S.T.TANISKA', '2023-05-01', 'OTHER', 'Hayagrivas International School Sivakasi', 'raghus155@gmail.com', 'T.Vishnu Priya', '9500340922', NULL, 'S.Thanga Thirupathi', '8903134028', NULL, 'raghus155@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0, 'JK_MEMBERS'),
(64, 'JK0064', 'G.Akilesh', '2019-11-13', 'OTHER', 'S.H.N.V.Mat.Hr.Sec.School', 'bestkayu@gmail.com', 'C KAYATHRI', '9489539976', NULL, 'M GANESH PRABHU', '9095136949', NULL, 'bestkayu@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0, 'JK_MEMBERS'),
(65, 'JK0065', 'DHARINESH.P', '2018-05-05', 'OTHER', 'THE SIVAKASI LIONS INTERNATIONAL INSTITUTIONS, SIVAKASI', 'chithradevimba@gmail.com', 'CHITHRA DEVI.P', '9443372844', NULL, 'P.PRABHU KANNAN', '9842108298', NULL, 'chithradevimba@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0, 'JK_MEMBERS'),
(66, 'JK0066', 'M.Kanishka', '2023-05-23', 'OTHER', 'Sri Shenbaga Vinayakar', 'mahesh.s1526@gmail.com', 'M.Priyadhanashri', '8778064094', NULL, 'S.Mahesh', '9751044763', NULL, 'mahesh.s1526@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0, 'JK_MEMBERS'),
(67, 'JK0067', 'Sri Niketha', '2020-06-04', 'OTHER', 'Hayagrivas', 'muthupradeep111@gmail.com', 'Mareeswari', '6369714675', NULL, 'Muthulingam', '8778499510', NULL, 'muthupradeep111@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0, 'JK_MEMBERS'),
(68, 'JK0068', 'R.Sivanarul', '2020-05-25', 'OTHER', 'ARASAN MODEL SCHOOL', 'ramkrishnan.ca@gmail.com', 'R.Raja Vadhana', '9655736214', NULL, 'S.Ramakrishnan', '9943627288', NULL, 'ramkrishnan.ca@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0, 'JK_MEMBERS'),
(69, 'JK0069', 'R.Sivani', '2015-03-03', 'OTHER', 'ARASAN MODEL SCHOOL', 'ramkrishnan.ca@gmail.com', 'R.Raja Vadhana', '9655736214', NULL, 'S.RamaKrishnan', '9943627288', NULL, 'ramkrishnan.ca@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0, 'JK_MEMBERS'),
(70, 'JK0070', 'Sri Harshini. S', '2018-09-06', 'OTHER', 'Lions Matric Hr Sec School', 'selvaganeshan.g@gmail.com', 'Pandi selvi', '9942210141', NULL, 'Selva Ganeshan', '9442213234', NULL, 'selvaganeshan.g@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0, 'JK_MEMBERS'),
(71, 'JK0071', 'Iyan Parakhraman', '2022-05-15', 'OTHER', 'Lions IB', 'kriswarya00@gmail.com', 'Iswarya Sankaralingam', 'Iswarya', NULL, 'Adeendren', '9597827707', NULL, 'kriswarya00@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 1, 'JK_MEMBERS'),
(72, 'JK0072', 'J Janos samuel', '2019-04-03', 'OTHER', 'Arasan model school', 'angelmarycse@gmail.com', 'A.Angel mary', '9994028394', NULL, 'S.Joseph Gnanasekaran', '9677877670', NULL, 'angelmarycse@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0, 'JK_MEMBERS'),
(73, 'JK0073', 'Vidikshaa A', '2016-12-13', 'OTHER', 'The Sivakasi Lions Vision Academy', 'apj.info@gmail.com', 'Pavitha A', '9894166533', NULL, 'Ananda Prabhu .J', '9894145533', NULL, 'apj.info@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0, 'JK_MEMBERS'),
(74, 'JK0074', 'S.Siddh', '2018-04-27', 'OTHER', 'Vels vidhyalaya', 'jananibds@gmail.com', 'L.Janani', '8056704303', NULL, 'A.Sri Kishore Ganesh', '8220593048', NULL, 'jananibds@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 1, 'JK_MEMBERS'),
(75, 'JK0075', 'K.S.Aadhavv', '2021-03-07', 'OTHER', 'YRTV Matriculation Higher Secondary School', 'nm.narmadha@yahoo.com', 'S.Narmadha', '9443433189', NULL, 'K.Sibi Shunmuga Prabhu', '9500945909', NULL, 'nm.narmadha@yahoo.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0, 'JK_MEMBERS'),
(76, 'JK0076', 'Ratansai R', '2020-11-13', 'OTHER', 'The Sivakasi Lions School', 'ratanmobiless@gmail.com', 'Sankareswari M', '6385384324', NULL, 'Rajaguru G', '9025544455', NULL, 'ratanmobiless@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0, 'JK_MEMBERS'),
(77, 'JK0077', 'J AADHIRAH', '2020-04-21', 'OTHER', 'Hayagrivas International School', 'jai.ganesh310@gmail.com', 'Navayuka Natshathra M', '8220593103', NULL, 'Jai Ganesh R', '9655676313', NULL, 'jai.ganesh310@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0, 'JK_MEMBERS'),
(78, 'JK0078', 'G.Divesh', '2020-11-25', 'OTHER', 'YRTV.MAT.HR.SEC. SCHOOL', 'nandhininirudivu@gmail.com', 'G.Nandhini', '9150632629', NULL, 'M.Gauthaman', '8754850212', NULL, 'nandhininirudivu@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0, 'JK_MEMBERS'),
(79, 'JK0079', 'V.Aariv yugan', '2021-05-27', 'OTHER', 'Kinder Park', 'visu42@gmail.com', 'V.Ahalya', '8754999771', NULL, 'S.P.Viswanath', '9003466771', NULL, 'visu42@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0, 'JK_MEMBERS'),
(80, 'JK0080', 'Dheerej Yugan G', '2020-12-21', 'OTHER', 'Wisdom wealth international school', 'theanvel@gmail.com', 'Shurekha M', '9442255055', NULL, 'Gautham Rathan P', '9791574339', NULL, 'theanvel@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0, 'JK_MEMBERS'),
(81, 'JK0081', 'Mohamed Zaim Al Noor', '2021-01-08', 'OTHER', 'YRTV Matric Hr Sec School', 'bilalnmohamed@gmail.com', 'Afreen Nida', '9047627979', NULL, 'Mohamed Bilal', '9488757979', NULL, 'bilalnmohamed@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0, 'JK_MEMBERS'),
(82, 'JK0082', 'Iyan Aarushan I', '2022-02-02', 'OTHER', 'Lions International School', 'kinderpark1234@gmail.com', 'Varsha Ravi', '7338865757', NULL, 'Iyan Adhedheeren', '9677675757', NULL, 'kinderpark1234@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0, 'JK_MEMBERS'),
(83, 'JK0083', 'Ridhan H', '2021-10-13', 'OTHER', 'Arasan Model School, Sivakasi', 'mail2ash.chill@gmail.com', 'Ashwini H', '9655624209', NULL, 'Harish DV', '7358251188', NULL, 'mail2ash.chill@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0, 'JK_MEMBERS'),
(84, 'JK0084', 'Sandra joymabel.c', '2021-09-09', 'OTHER', 'The sivakasi lions international institute', 'ranipanneer95@gmail.com', 'Selva rani', '8778205434', NULL, 'Castro bala subramanian', '9003781071', NULL, 'ranipanneer95@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0, 'JK_MEMBERS'),
(85, 'JK0085', 'G TARUN KRISHNA', '2021-06-22', 'OTHER', 'Arasan Model School', 'dr.sachusomasundaram@gmail.com', 'Saraswathi S', '8940024924', NULL, 'Giriraj R', '9894227357', NULL, 'dr.sachusomasundaram@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0, 'JK_MEMBERS'),
(86, 'JK0086', 'Anjana A', '2021-12-14', 'OTHER', 'The Sivakasi lions nursery and primary school', 'rojaa.arun@gmail.com', 'Rojaa', '7598779777', NULL, 'Arun Prasad', '9489533141', NULL, 'rojaa.arun@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0, 'JK_MEMBERS'),
(87, 'JK0087', 'S.T.ABI NANDHAN', '2021-03-26', 'OTHER', 'Hayagrivas international school Sivakasi', 'raghus155@gmail.com', 'Vishnu Priya.T', '9500340922', NULL, 'Thanga Thirupathi.S', '9003308822', NULL, 'raghus155@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0, 'JK_MEMBERS'),
(88, 'JK0088', 'Jaden Benjamin Daniel. J', '2020-07-10', 'OTHER', 'Lions International Group Of Institutions', 'jenifer.5396@gmail.com', 'Jenifer J', '7094107975', NULL, 'Jebastin Paul Christopher', '9442223442', NULL, 'jenifer.5396@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0, 'JK_MEMBERS'),
(89, 'JK0089', 'S.Samrudh Karan', '2020-12-18', 'OTHER', 'The Sivakasi lions international school', 'rash_venky@yahoo.com', 'Rashmi Venkatesh', '9487760264', NULL, 'Siddharth Karunakaran', '9952296077', NULL, 'rash_venky@yahoo.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0, 'JK_MEMBERS'),
(90, 'JK0090', 'N.AADHAV', '2020-05-19', 'OTHER', 'YRTV', 'spkjayashree@gmail.com', 'N.JAYASHREE', '9786613878', NULL, 'S.NATESH PRABHU', '9786683878', NULL, 'spkjayashree@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0, 'JK_MEMBERS'),
(91, 'JK0091', 'R. Kasini', '2021-08-04', 'OTHER', 'YRTV', 'jaivais1993@gmail.com', 'Jai Vaishnavi Rajadurai', '9629890907', NULL, 'V. Raja Durai', '9944778868', NULL, 'jaivais1993@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0, 'JK_MEMBERS'),
(92, 'JK0092', 'V. Vasudhra', '2021-08-08', 'OTHER', 'Lions', 'manimaranrohini95@gmail.com', 'Rohini Vishakan', '9894896417', NULL, 'V. Vishakan', '9003760125', NULL, 'manimaranrohini95@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0, 'JK_MEMBERS'),
(93, 'JK0093', 'K.S. .Dev Mithun', '2020-03-07', 'OTHER', 'Arasan model School ,CBSE', 'babychlm1234@gmail.com', 'K.Nandhini', '9994075085', NULL, 'K.Shenbagamoorthy', '6382110695', NULL, 'babychlm1234@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0, 'JK_MEMBERS'),
(94, 'JK0094', 'Keshvika Krishnan', '2022-03-12', 'OTHER', 'Lions School', 'mareeswari1426@gmail.com', 'Mareeswari S', '9585066639', NULL, 'Muthukrishnan A', '9659141812', NULL, 'mareeswari1426@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0, 'JK_MEMBERS'),
(95, 'JK0095', 'A.Ram Mithun', '2020-10-01', 'OTHER', 'YRTV', 'ashoklaksh123@gmail.com', 'Soundarya devi', '6369092360', NULL, 'Ashok kumar', '8508561250', NULL, 'ashoklaksh123@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0, 'JK_MEMBERS'),
(96, 'JK0096', 'R. sarveshwaran', '2021-09-21', 'OTHER', 'YRTV. Hr. Sec. Scl', 'balajothisankaranarayanan@gmail.com', 'R. Balajothi', '6374786678', NULL, 'R. Ramjipandian', '9790567793', NULL, 'balajothisankaranarayanan@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0, 'JK_MEMBERS'),
(97, 'JK0097', 'R.PUGAZHAN', '2020-11-11', 'OTHER', 'YRTV', 'rajaguruit@gmail.com', 'R.VIJAYALAKSHMI', '9994717695', NULL, 'C.RAJAGURU', '8056088814', NULL, 'rajaguruit@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0, 'JK_MEMBERS'),
(98, 'JK0098', 'S.Kavin', '2021-10-25', 'OTHER', 'The Sivakasi lions Nursery and Primary school', 'ganeshaish2@gmail.com', 'S.Aishwarya', '9790262115', NULL, 'T Siva Ganesh', '9003614472', NULL, 'ganeshaish2@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0, 'JK_MEMBERS'),
(99, 'JK0099', 'B.Yogamithran', '2021-05-08', 'OTHER', 'Yrtv', 'gomsjeya83@gmail.com', 'Gomathi', '9943875430', NULL, 'Balakrishnan', '9750975430', NULL, 'gomsjeya83@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0, 'JK_MEMBERS'),
(100, 'JK0100', 'I. Iyan Parakhraman', '2022-05-15', 'OTHER', 'Lions IB', 'kriswarya00@gmail.com', 'Iswarya Sankaralingam', '8903435252', NULL, 'Iyan Adeendren', '9597827707', NULL, 'kriswarya00@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0, 'JK_MEMBERS'),
(101, 'JK0101', 'G Tanvik Saran', '2020-08-25', 'OTHER', 'Lions IB', 'gsaran39@gmail.com', 'S Gowthami', '9894614882', NULL, 'A Giri Saranyan', '9944121882', NULL, 'gsaran39@gmail.com', NULL, NULL, NULL, 1, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0, 'JK_MEMBERS');

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
  `updated_at` datetime DEFAULT NULL,
  `library_access` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `student_enrollments`
--

INSERT INTO `student_enrollments` (`enrollment_id`, `student_id`, `academic_year_id`, `programme_id`, `grade`, `roll_number`, `section`, `status`, `enrollment_date`, `completion_date`, `notes`, `registration_source`, `payment_method`, `payment_proof_url`, `payment_qr_url`, `created_at`, `updated_at`, `library_access`) VALUES
(1, 1, 4, 28, '1. PRE-KG', '26RTJ0001', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1OLkU2AjrPEDtut0nZSbE2Ltqp6yOZ7EH', NULL, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0),
(2, 2, 4, 29, '5. GRADE II', '26RTS0001', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1cd3-Grt0XX5boz2O6flXyp0sucJDdupA', NULL, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0),
(3, 3, 4, 28, '1. PRE-KG', '26RTJ0002', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1M00ShFaneVwq2QAXMGTK43Leoxt-hj8Q', NULL, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0),
(4, 4, 4, 30, '8. GRADE V', '26F0001', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1oYXy73H8v262ezZyAbJQPTiRGrXtyRI2', NULL, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0),
(5, 5, 4, 29, '5. GRADE II', '26RTS0002', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1iW8wzHnfLyZxnMhz1XWlB_JNfyLrWw7k', NULL, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0),
(6, 6, 4, 28, '2. LKG', '26RTJ0003', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1tQT444X8Z3ha8Hi4i2x2uu_r6N34KfWP', NULL, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0),
(7, 7, 4, 28, '3. UKG', '26RTJ0004', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1_77AJ-egSOv_xdI3e7cmZ1VLzm-xkPmJ', NULL, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0),
(8, 8, 4, 28, '1. PRE-KG', '26RTJ0005', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1LK0BBiFw16x4iN5iUF4oWpxrgYeCrnYu', NULL, '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0),
(9, 9, 4, 30, '8. GRADE V', '26F0002', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1TQUFdiFqNunzCNtKAUPTnEGRIiY0qyqP', 'Sashwanth.S', '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0),
(10, 10, 4, 28, '2. LKG', '26RTJ0006', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1i4M5agDq527-2EYSIg7nCBGjUpRN5Gcz', 'Paid', '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0),
(11, 11, 4, 30, '9. GRADE VI', '26F0003', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1EY2HUPvTErkxc_P8-ffd7TZVgMQR2O8w', 'NA', '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0),
(12, 12, 4, 28, '1. PRE-KG', '26RTJ0007', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1B_BVTD3eWQxnhRCvI6gIfhfZ_EEfjeGJ', 'Neft', '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0),
(13, 13, 4, 28, '1. PRE-KG', '26RTJ0008', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1mI5-whtjmzA7JIKEDffe9Y-WH6UeRWqv', 'Neft', '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0),
(14, 14, 4, 30, '7. GRADE IV', '26F0004', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1IvVEXr8w6Fh4HS_Forb0UIjsHZEDfZh0', 'No', '2026-08-30 13:48:09', '2026-08-30 13:48:09', 1),
(15, 15, 4, 29, '4. GRADE I', '26RTS0003', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1fDNKD9jnTpAiGYMNXDtzngncMo6hNKJO', 'Paid through GPay in person', '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0),
(16, 16, 4, 29, '4. GRADE I', '26RTS0004', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=12ST1tVkck6eABvtJXlzBwP6xsYdOq-96', 'Paid through GPay in person', '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0),
(17, 17, 4, 30, '9. GRADE VI', '26F0005', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1n0AAjuUIXibb8BNoQ_j1IUcgjW_dQxOi', 'Paid through bank transfer', '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0),
(18, 18, 4, 28, '3. UKG', '26RTJ0009', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=13n9pC-t0lECm6p9zLE3mAVSCMl6Oz1Z7', 'Paid through bank transfer', '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0),
(19, 19, 4, 30, '8. GRADE V', '26F0006', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1LHZQxFqMRwjr-_Dj6341GSd2w7Bo_ROQ', 'Done', '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0),
(20, 20, 4, 30, '9. GRADE VI', '26F0007', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1YhxYikEeNAhIgbjLp7AvLO1ObArNLR-Y', 'BANK TRANSFER DONE', '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0),
(21, 21, 4, 28, '3. UKG', '26RTJ0010', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1Cuw7qD7mOoEpwUnTYZoT3Ics-ts_pBN5', 'BanK Transfer Done', '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0),
(22, 22, 4, 29, '5. GRADE II', '26RTS0005', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1B6Kfp502S8GTT2RviH3_29sZ8e2hUB4j', 'shivsenthil333@okicici', '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0),
(23, 23, 4, 29, '3. UKG', '26RTS0006', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=18buhBpaN4QD9zoqzD6DBwMsJC0JmLRqb', 'Bank transfer attached', '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0),
(24, 24, 4, 28, '2. LKG', '26RTJ0011', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1NFUJy8LMxpm4D0h71CLf3rfqLuAJbToh', 'Qr Code Scan', '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0),
(25, 25, 4, 29, '7. GRADE IV', '26RTS0007', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1SVZ6_o-A93SlxIJ-3v7FkxWGYH3KhE8R', 'Sent via Gpay 15k', '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0),
(26, 26, 4, 28, '3. UKG', '26RTJ0012', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1eGeOEnQ25RmowGnZryk_ag8P0Iv_h1k1', 'No', '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0),
(27, 27, 4, 28, '1. PRE-KG', '26RTJ0013', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1rZ6jn8g67ds90MbL-D3lIpJXetuonOsw', 'Gpay', '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0),
(28, 28, 4, 28, '2. LKG', '26RTJ0014', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1T98GK2ZyTWBfUHiy1tYL0qjeyddtqQ89', 'Bank transfer', '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0),
(29, 29, 4, 28, '2. LKG', '26RTJ0015', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1OSPvTA7OfFbqAnZ8AdT3ggiiA1s4TFNa', 'Done through bank transfer', '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0),
(30, 30, 4, 28, '2. LKG', '26RTJ0016', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1OrJcCNTMMmWrLbaeABpREgzaUZaiplvH', 'Yes', '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0),
(31, 31, 4, 29, '5. GRADE II', '26RTS0008', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1GXn2ewgkqMXSR7qCMWvxulPwQL4UFGP4', 'Bank transfer', '2026-08-30 13:48:09', '2026-08-30 13:48:09', 0),
(32, 32, 4, 29, '4. GRADE I', '26RTS0009', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1GdBndHsV0WS7Wn9XbYgZAqf5bcMud4sY', 'UPI', '2026-08-30 13:48:09', '2026-08-30 13:48:09', 1),
(33, 33, 4, 28, '2. LKG', '26RTJ0017', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1LrBFvZGsCtAfTmb5TUVvPhiZWNku-fcl', 'Scanned', '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0),
(34, 34, 4, 30, '8. GRADE V', '26F0008', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1c0IP6Or-Nr2smBTuZoxSPGbEPOXOs5UV', 'Gpay', '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0),
(35, 35, 4, 30, '10. GRADE VII', '26F0009', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1I5S517sh4xlYVudJ7OgLOSeZ6yoHiaxU', 'Paid', '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0),
(36, 36, 4, 29, '5. GRADE II', '26RTS0010', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1ZNavdXyyVTW2-pWAxtP2PZSOOI9yRpT2', 'Ok', '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0),
(37, 37, 4, 30, '8. GRADE V', '26F0010', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1KGLJ6R-LR080K9-Xy7pmw35vRWDKidkM', 'Gpay', '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0),
(38, 38, 4, 29, '4. GRADE I', '26RTS0011', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1Pw4PSmYqeUghcmGuOuhXX07g9qJyagsA', 'Gpay', '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0),
(39, 39, 4, 30, '7. GRADE IV', '26F0011', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1awZr9NbAqFxIWTzyLvnSBh3D69cLoTgA', 'Ok', '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0),
(40, 40, 4, 30, '8. GRADE V', '26F0012', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1aZd0NX8nEKF3TYRGiQaGnlvAnl5TIuAI', 'NETBANKING', '2026-08-30 13:48:10', '2026-08-30 13:48:10', 1),
(41, 41, 4, 30, '7. GRADE IV', '26F0013', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=17wX3BXFRrcmqU5C3gktF_-0Vp0eLLqta', 'Paid 18000', '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0),
(42, 42, 4, 30, '7. GRADE IV', '26F0014', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1JJ3EDMSD1ICQjj9Rvyp1d1kL7vqmDcvl', 'FLY R.V.Mirnalini', '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0),
(43, 43, 4, 30, '8. GRADE V', '26F0015', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1XxBXpxb0LABUxs7-yo4Y8ttuQjlDnes9', NULL, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0),
(44, 44, 4, 30, '9. GRADE VI', '26F0016', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1daIPPe7CZSvjGBthHd1bKj-huDN1ynNA', 'GPAY', '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0),
(45, 45, 4, 30, '6. GRADE III', '26F0017', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1E83JSeM1A9oCqAmaztqMs5pf7CmKpcrQ', 'Paid', '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0),
(46, 46, 4, 29, '4. GRADE I', '26RTS0012', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1W8YcZtyPF5Kj57XIfbZUSx6meEGxBF2y', 'Paid', '2026-08-30 13:48:10', '2026-08-30 13:48:10', 1),
(47, 47, 4, 30, '7. GRADE IV', '26F0018', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1k-EXV3KOGRHMhTPusJ9zn69qFVwTnN2n', 'Qr code', '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0),
(48, 48, 4, 30, '7. GRADE IV', '26F0019', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1z7xl-S9F7wjGbXuqdlATZ0j_VBTr6xYe', 'Gpay', '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0),
(49, 49, 4, 30, '9. GRADE VI', '26F0020', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1SraRY_yMjL8AdsduXSiRbQdU3jfENjde', 'Payment done through bank', '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0),
(50, 50, 4, 30, '7. GRADE IV', '26F0021', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1J2qUi5e9af3IHpUxky6iWQSuGlHdtUSX', 'Bank transfer done', '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0),
(51, 51, 4, 28, '3. UKG', '26RTJ0018', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=10yabvpHaYdyvjtDEqfMDBVMmwUoDkNye', 'Payment done.  And attached the screenshot below', '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0),
(52, 52, 4, 28, '1. PRE-KG', '26RTJ0019', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1qPBnmvqman7VUf8Y6CcjQ4C88SqPevWe', '15000', '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0),
(53, 53, 4, 30, '7. GRADE IV', '26F0022', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1AZM8mNRuo9zmW9eztPj_K3zsVAiDhmfN', 'Nalini', '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0),
(54, 54, 4, 29, '6. GRADE III', '26RTS0013', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1l1-FfUpkIam8ksA7a78AGW5_CBmqP7lP', 'Done', '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0),
(55, 55, 4, 28, '3. UKG', '26RTJ0020', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1fkT9JTJVuiv583XoY3lcSuX5KurEu8du', NULL, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0),
(56, 56, 4, 28, '2. LKG', '26RTJ0021', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1l_U1et7PaPrFXDCbQqvYKPwRGBaeM_q-', NULL, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0),
(57, 57, 4, 28, '2. LKG', '26RTJ0022', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1fjpu34CTTYuH6qUOEN1p37gj4t7x911X', NULL, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0),
(58, 58, 4, 28, '2. LKG', '26RTJ0023', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1tAogi2CioPXp7EAuS5LxAzYav-g25yAi', '₹15000', '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0),
(59, 59, 4, 28, '2. LKG', '26RTJ0024', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=14vwXytwvU7W7ngcWeYf82BKI9Wmne22O', 'Gpay', '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0),
(60, 60, 4, 28, '1. PRE-KG', '26RTJ0025', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1USROnfe49-RtTJwBbgLr4Fh9YUyALglA', 'Bank transfer', '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0),
(61, 61, 4, 29, '4. GRADE I', '26RTS0014', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1tzRKAvJqzdggWszAO5JVEOUQ9Xrr818S', NULL, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 1),
(62, 62, 4, 29, '5. GRADE II', '26RTS0015', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=18k6n-xZN6cF9zLLnXQw0C4F8yrpk7DR_', NULL, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0),
(63, 63, 4, 28, '1. PRE-KG', '26RTJ0026', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=11sIdzelFV3NueKZZdzf32CuR6gd0-pph', NULL, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0),
(64, 64, 4, 29, '5. GRADE II', '26RTS0016', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1bqnoq47J4bfbS0jGFfeahOcPbfArA2Zz', NULL, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0),
(65, 65, 4, 29, '6. GRADE III', '26RTS0017', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1kEcUMkg_GaE1DpPDMJoLLC6IP5GjGw2z', NULL, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0),
(66, 66, 4, 28, '1. PRE-KG', '26RTJ0027', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1EAKeCwAHsc10L1w6W4yymrQtNGfZs-A9', NULL, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0),
(67, 67, 4, 29, '3. UKG', '26RTS0018', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1GHlkDv09h9sO5_YW8InjCPnYMAaIU-T9', NULL, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0),
(68, 68, 4, 29, '4. GRADE I', '26RTS0019', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1ehsQ_kfBnRgXoQrO43QwktRZ_8t4VBZY', NULL, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0),
(69, 69, 4, 30, '10. GRADE VII', '26F0023', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1NuwrBdhQQsGhmDfyMVBCfFz0vRtDFqZC', NULL, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0),
(70, 70, 4, 29, '5. GRADE II', '26RTS0020', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1mR0rRxTQvvMsYNo55zYnkrHVh7tTSIkJ', NULL, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0),
(71, 71, 4, 28, '3. UKG', '26RTJ0028', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1b9T00vH39zftvPyM93EPE0o0GjYP-CMc', NULL, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 1),
(72, 72, 4, 29, '6. GRADE III', '26RTS0021', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1tGFPUYo2jtPu6NbETxX-9Ow8BetSuOCj', NULL, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0),
(73, 73, 4, 30, '8. GRADE V', '26F0024', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1NIl52gctWEkkYxGyfsjaDYR8QqOseRZZ', NULL, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0),
(74, 74, 4, 29, '6. GRADE III', '26RTS0022', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1WjuWWFKO6aVpnBsTQIxX475q6o_1ukQ3', NULL, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 1),
(75, 75, 4, 31, '3. UKG', '26LRLI0001', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=16iu5L-D3O0A0poZZKGmlNi-DyfApwL_2', NULL, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0),
(76, 76, 4, 31, '4. GRADE I', '26LRLI0002', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1lC7ZITPqN-uRx5sDZQmqS5Kfx2JxE-BU', NULL, '2026-08-30 13:48:10', '2026-08-30 13:48:10', 0),
(77, 77, 4, 31, '4. GRADE I', '26LRLI0003', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1pIV4-9y0d13XU4uELrI3YDyQKN2BZ5DB', NULL, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0),
(78, 78, 4, 31, '3. UKG', '26LRLI0004', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1F_fKpzMQFoIa2gRkE-qGHt8gQcPbKwTO', NULL, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0),
(79, 79, 4, 31, '3. UKG', '26LRLI0005', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'BANK TRANSFER', 'https://drive.google.com/open?id=1EwxnYTjTZ_tgPMdxbqiGWUn8hwlO1DfI', NULL, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0),
(80, 80, 4, 28, '4. GRADE I', '26RTJ0029', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1gucOH4YYsoCSbDdwGqs7ga84W3pX67gb', NULL, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0),
(81, 81, 4, 32, '3. UKG', '26LRLI10001', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1VMLrqcZKReXFu4Uk2QIcCDPXHKrMg2a1', NULL, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0),
(82, 82, 4, 32, '3. UKG', '26LRLI10002', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1E0xJczwAy1PGssop5VDgUAVu3IZrzmFi', NULL, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0),
(83, 83, 4, 31, '3. UKG', '26LRLI0006', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1kCylwvA0ucFyT4w5KhI_R9ri8EaWh11G', NULL, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0),
(84, 84, 4, 32, '3. UKG', '26LRLI10003', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1EtJJRBpJN_F_gBGqoPH2eWB2Yt7ifpAo', NULL, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0),
(85, 85, 4, 32, '3. UKG', '26LRLI10004', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1MQMM3bhnQcxs03qeYDRomhLp4n8DOIKZ', NULL, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0),
(86, 86, 4, 32, '2. LKG', '26LRLI10005', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1UWsC4zmCPzpBqRPYIfEfW80bN1U5a_Hd', NULL, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0),
(87, 87, 4, 31, '3. UKG', '26LRLI0007', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1YbsA7MCuzEhyeKg28Fbs4SiXh17rfG9T', NULL, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0),
(88, 88, 4, 32, '4. GRADE I', '26LRLI10006', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1ZsNOTQc6lkHJiHDJZ2QBXKKXfu49BeVw', NULL, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0),
(89, 89, 4, 32, '4. GRADE I', '26LRLI10007', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1bw2qMVZcC6P6F-wxdys5Q66-1kIiJRcd', NULL, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0),
(90, 90, 4, 31, '4. GRADE I', '26LRLI0008', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1onf7wSqEQcgP8BKGWuAF6WHOMkx_khTC', NULL, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0),
(91, 91, 4, 31, '3. UKG', '26LRLI0009', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1zWsNlOxutrcL2A99PdT-LHRBmvU0_y9T', NULL, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0),
(92, 92, 4, 31, '3. UKG', '26LRLI0010', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=124AcXbJTNQGto7dIxBXtclY__ov1i4VT', NULL, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0),
(93, 93, 4, 31, '4. GRADE I', '26LRLI0011', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1fC54nHjv4E949wsWWRoXrLZs1-d7z-Vi', NULL, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0),
(94, 94, 4, 32, '2. LKG', '26LRLI10008', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1grhmeyJr34Kaj9aO0SgJRQAcTZe7N7oJ', NULL, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0),
(95, 95, 4, 32, '3. UKG', '26LRLI10009', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1WY6zCfo1Yf20jdQxv71RbQ7zMYKDnZQ8', NULL, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0),
(96, 96, 4, 32, '3. UKG', '26LRLI10010', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1383KGS66CrvPV6WnEKuvLhI_gdmcp8K_', NULL, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0),
(97, 97, 4, 31, '3. UKG', '26LRLI0012', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1AkObBumOIoIkpvCXPnOaYFwocfTutAUb', NULL, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0),
(98, 98, 4, 31, '3. UKG', '26LRLI0013', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=14Hy3HAK6WgGXVcNKGJ9nGrFKzqOe4-hr', NULL, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0),
(99, 99, 4, 32, '3. UKG', '26LRLI10011', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1ZS4LQdzM82PhFwU2D0xaKwqIKCdWYqRx', NULL, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0),
(100, 100, 4, 32, '3. UKG', '26LRLI10012', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1fBdJrokoBpcpuP_wqlB4al5_xrc5FuX_', NULL, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0),
(101, 101, 4, 31, '4. GRADE I', '26LRLI0014', NULL, 'ACTIVE', '2026-08-30', NULL, NULL, 'EXCEL_IMPORT', 'UPI/GPAY/PAYTM', 'https://drive.google.com/open?id=1zGBJdt5v9Uyz74Cc4kVbtHzqpFuRs1GD', NULL, '2026-08-30 13:48:11', '2026-08-30 13:48:11', 0);

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
  `updated_at` datetime DEFAULT NULL,
  `academic_year_id` int(11) DEFAULT NULL,
  `payment_proof_url` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `student_subscriptions`
--

INSERT INTO `student_subscriptions` (`subscription_id`, `student_id`, `subscription_plan_id`, `start_date`, `end_date`, `status`, `amount_paid`, `payment_date`, `payment_method`, `notes`, `created_at`, `updated_at`, `academic_year_id`, `payment_proof_url`) VALUES
(1, 14, 7, '2026-06-01', '2026-08-30', 'EXPIRED', 500.00, '2026-08-30', 'BANK TRANSFER', 'Created from student Excel import', '2026-08-30 13:48:09', '2026-08-31 17:18:58', 4, 'https://drive.google.com/open?id=1IvVEXr8w6Fh4HS_Forb0UIjsHZEDfZh0'),
(2, 32, 7, '2026-06-01', '2026-08-30', 'EXPIRED', 500.00, '2026-08-30', 'UPI/GPAY/PAYTM', 'Created from student Excel import', '2026-08-30 13:48:09', '2026-08-31 17:18:58', 4, 'https://drive.google.com/open?id=1GdBndHsV0WS7Wn9XbYgZAqf5bcMud4sY'),
(3, 40, 7, '2026-08-31', '2026-11-29', 'ACTIVE', 500.00, '2026-08-31', 'BANK TRANSFER', 'Created from student Excel import', '2026-08-30 13:48:10', '2026-08-31 17:20:21', 4, 'https://drive.google.com/open?id=1aZd0NX8nEKF3TYRGiQaGnlvAnl5TIuAI'),
(4, 46, 7, '2026-06-01', '2026-08-30', 'EXPIRED', 500.00, '2026-08-30', 'UPI/GPAY/PAYTM', 'Created from student Excel import', '2026-08-30 13:48:10', '2026-08-31 17:18:58', 4, 'https://drive.google.com/open?id=1W8YcZtyPF5Kj57XIfbZUSx6meEGxBF2y'),
(5, 61, 7, '2026-06-01', '2026-08-30', 'EXPIRED', 500.00, '2026-08-30', 'UPI/GPAY/PAYTM', 'Created from student Excel import', '2026-08-30 13:48:10', '2026-08-31 17:18:58', 4, 'https://drive.google.com/open?id=1tzRKAvJqzdggWszAO5JVEOUQ9Xrr818S'),
(6, 71, 7, '2026-06-01', '2026-08-30', 'EXPIRED', 500.00, '2026-08-30', 'BANK TRANSFER', 'Created from student Excel import', '2026-08-30 13:48:10', '2026-08-31 17:18:58', 4, 'https://drive.google.com/open?id=1b9T00vH39zftvPyM93EPE0o0GjYP-CMc'),
(7, 74, 7, '2026-06-01', '2026-08-30', 'EXPIRED', 500.00, '2026-08-30', 'UPI/GPAY/PAYTM', 'Created from student Excel import', '2026-08-30 13:48:10', '2026-08-31 17:18:58', 4, 'https://drive.google.com/open?id=1WjuWWFKO6aVpnBsTQIxX475q6o_1ukQ3');

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
(7, 'caterpiller', 'CAT', 1, 3, 500.00, 1, '', '2026-08-30 13:46:35', '2026-08-30 13:46:35'),
(8, 'butterfly', 'BUT', 2, 6, 1000.00, 1, '', '2026-08-30 13:47:04', '2026-08-30 13:47:04'),
(9, 'annual', 'ANN', 3, 12, 1500.00, 1, '', '2026-08-30 13:47:30', '2026-08-30 13:47:30');

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
(5, 'currency_symbol', '₹', 'STRING', 'FINANCE', 'Currency symbol used in display', 1, NULL, '2026-08-17 07:03:57', '2026-08-17 07:03:57'),
(6, 'warning_threshold_default', '100.00', 'DECIMAL', 'FINANCE', 'Minimum balance warning threshold', 1, NULL, '2026-08-17 07:03:57', '2026-08-17 07:03:57'),
(7, 'low_deposit_threshold', '300', 'DECIMAL', 'Deposit', 'Low deposit warning and borrowing-block threshold', 1, NULL, '2026-08-19 09:57:26', '2026-08-30 13:48:55'),
(8, 'backup_reminder_days', '7', 'INTEGER', 'Backup', 'Days between login backup reminders', 1, NULL, '2026-08-30 15:01:04', '2026-08-30 15:01:04'),
(9, 'backup_last_export_date', '2026-08-30', 'STRING', 'Backup', 'Date of the last generated backup', 0, NULL, '2026-08-30 15:01:04', '2026-08-30 15:01:50');

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
(1, 'admin', '22us25@anjaconline.org', '$2b$12$BkNXNFS497/Q8LV97P8S9OGqbMPbVDgAM1qztE6ishUukXm8u6DSW', 'System Administrator', 'ADMIN', 1, '2026-08-31 22:48:30', '2026-08-17 07:03:55', '2026-08-31 17:18:30'),
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
-- Indexes for table `member_groups`
--
ALTER TABLE `member_groups`
  ADD PRIMARY KEY (`group_code`);

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
  ADD KEY `subscription_plan_id` (`subscription_plan_id`),
  ADD KEY `fk_subscription_academic_year` (`academic_year_id`);

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
  MODIFY `academic_year_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `audit_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=195;

--
-- AUTO_INCREMENT for table `book_categories`
--
ALTER TABLE `book_categories`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `book_copies`
--
ALTER TABLE `book_copies`
  MODIFY `book_copy_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `book_issues`
--
ALTER TABLE `book_issues`
  MODIFY `issue_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `book_levels`
--
ALTER TABLE `book_levels`
  MODIFY `level_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `book_level_sequences`
--
ALTER TABLE `book_level_sequences`
  MODIFY `level_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `book_returns`
--
ALTER TABLE `book_returns`
  MODIFY `return_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `book_titles`
--
ALTER TABLE `book_titles`
  MODIFY `book_title_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `damage_loss_records`
--
ALTER TABLE `damage_loss_records`
  MODIFY `record_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `deposit_accounts`
--
ALTER TABLE `deposit_accounts`
  MODIFY `deposit_account_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `deposit_transactions`
--
ALTER TABLE `deposit_transactions`
  MODIFY `transaction_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `grade_levels`
--
ALTER TABLE `grade_levels`
  MODIFY `grade_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `holidays`
--
ALTER TABLE `holidays`
  MODIFY `holiday_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `permission_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=60;

--
-- AUTO_INCREMENT for table `programmes`
--
ALTER TABLE `programmes`
  MODIFY `programme_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `role_permissions`
--
ALTER TABLE `role_permissions`
  MODIFY `role_permission_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `student_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=102;

--
-- AUTO_INCREMENT for table `student_enrollments`
--
ALTER TABLE `student_enrollments`
  MODIFY `enrollment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=102;

--
-- AUTO_INCREMENT for table `student_subscriptions`
--
ALTER TABLE `student_subscriptions`
  MODIFY `subscription_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `subscription_plans`
--
ALTER TABLE `subscription_plans`
  MODIFY `subscription_plan_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `setting_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

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
  ADD CONSTRAINT `fk_subscription_academic_year` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`academic_year_id`),
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
