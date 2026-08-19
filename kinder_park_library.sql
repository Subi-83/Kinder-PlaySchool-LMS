-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 14, 2026 at 07:13 AM
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

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_issue_book` (IN `p_book_copy_id` INT, IN `p_student_id` INT, IN `p_issued_by` INT, IN `p_days` INT)   BEGIN
    DECLARE v_due_date DATE;
    DECLARE v_issue_id INT;
    
    SET v_due_date = DATE_ADD(CURDATE(), INTERVAL p_days DAY);
    
    INSERT INTO book_issues (book_copy_id, student_id, issue_date, issue_time, due_date, issued_by)
    VALUES (p_book_copy_id, p_student_id, CURDATE(), CURTIME(), v_due_date, p_issued_by);
    
    SET v_issue_id = LAST_INSERT_ID();
    
    UPDATE book_copies SET status = 'ISSUED' WHERE book_copy_id = p_book_copy_id;
    
    -- Log the action
    INSERT INTO audit_logs (user_id, username, action, module, record_id, details)
    SELECT p_issued_by, username, 'ISSUE_BOOK', 'Library', v_issue_id, 
           CONCAT('Book copy ID: ', p_book_copy_id, ', Student ID: ', p_student_id)
    FROM users WHERE user_id = p_issued_by;
    
    SELECT v_issue_id AS issue_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_return_book` (IN `p_issue_id` INT, IN `p_received_by` INT, IN `p_condition` VARCHAR(20), IN `p_fine_amount` DECIMAL(10,2), IN `p_damage_charge` DECIMAL(10,2))   BEGIN
    DECLARE v_book_copy_id INT;
    DECLARE v_student_id INT;
    DECLARE v_deposit_account_id INT;
    DECLARE v_total_charge DECIMAL(10,2);
    
    -- Get book copy and student info
    SELECT book_copy_id, student_id INTO v_book_copy_id, v_student_id
    FROM book_issues WHERE issue_id = p_issue_id;
    
    -- Calculate total charge
    SET v_total_charge = p_fine_amount + p_damage_charge;
    
    -- Record the return
    INSERT INTO book_returns (
        issue_id, 
        return_date, 
        return_time, 
        received_by, 
        `condition_returned`, 
        fine_amount, 
        damage_charge
    ) VALUES (
        p_issue_id, 
        CURDATE(), 
        CURTIME(), 
        p_received_by, 
        p_condition, 
        p_fine_amount, 
        p_damage_charge
    );
    
    -- Update issue status
    UPDATE book_issues 
    SET status = 'RETURNED', updated_at = NOW() 
    WHERE issue_id = p_issue_id;
    
    -- Update book copy status and condition
    UPDATE book_copies 
    SET status = 'AVAILABLE', `condition` = p_condition 
    WHERE book_copy_id = v_book_copy_id;
    
    -- If there's a fine or damage charge, deduct from deposit
    IF v_total_charge > 0 THEN
        -- Get the deposit account
        SELECT deposit_account_id INTO v_deposit_account_id
        FROM deposit_accounts 
        WHERE student_id = v_student_id;
        
        -- Create deposit transaction
        INSERT INTO deposit_transactions (
            deposit_account_id, 
            transaction_type, 
            amount, 
            balance_after, 
            reference_id, 
            description, 
            created_by
        ) 
        SELECT 
            v_deposit_account_id,
            'FINE',
            v_total_charge,
            current_balance - v_total_charge,
            p_issue_id,
            CONCAT('Fine/Damage for issue #', p_issue_id),
            p_received_by
        FROM deposit_accounts 
        WHERE deposit_account_id = v_deposit_account_id;
        
        -- Update deposit balance
        UPDATE deposit_accounts 
        SET current_balance = current_balance - v_total_charge
        WHERE deposit_account_id = v_deposit_account_id;
    END IF;
    
    -- Log the action
    INSERT INTO audit_logs (
        user_id, 
        username, 
        action, 
        module, 
        record_id, 
        details
    )
    SELECT 
        p_received_by, 
        username, 
        'RETURN_BOOK', 
        'Library', 
        p_issue_id,
        CONCAT('Book copy ID: ', v_book_copy_id, ', Fine: ', p_fine_amount, ', Damage: ', p_damage_charge)
    FROM users 
    WHERE user_id = p_received_by;
    
END$$

DELIMITER ;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `academic_years`
--

INSERT INTO `academic_years` (`academic_year_id`, `year_code`, `year_name`, `start_date`, `end_date`, `is_current`, `is_active`, `created_at`, `updated_at`) VALUES
(1, '2026-27', 'Academic Year 2026-27', '2026-06-01', '2027-05-31', 1, 1, '2026-08-14 02:50:43', '2026-08-14 02:50:43');

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`audit_id`, `user_id`, `username`, `action`, `module`, `record_id`, `details`, `ip_address`, `user_agent`, `created_at`) VALUES
(1, 1, 'admin', 'LOGIN', 'Auth', NULL, 'User logged in successfully', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-14 02:52:37'),
(2, 1, 'admin', 'LOGIN', 'Auth', NULL, 'User logged in successfully', '127.0.0.1', 'Werkzeug/3.1.8', '2026-08-14 03:43:31'),
(3, 1, 'admin', 'LOGIN', 'Auth', NULL, 'User logged in successfully', '127.0.0.1', 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Edg/151.0.0.0 Mobile Safari/537.36', '2026-08-14 03:46:41'),
(4, 1, 'admin', 'LOGIN', 'Auth', NULL, 'User logged in successfully', '127.0.0.1', 'Werkzeug/3.1.8', '2026-08-14 03:57:18'),
(5, 1, 'admin', 'LOGIN', 'Auth', NULL, 'User logged in successfully', '127.0.0.1', 'Werkzeug/3.1.8', '2026-08-14 04:00:45'),
(6, 1, 'admin', 'UPDATE_SETTINGS', 'Settings', NULL, 'Updated settings: late_fine_per_day', NULL, NULL, '2026-08-14 04:00:45'),
(7, 1, 'admin', 'LOGIN', 'Auth', NULL, 'User logged in successfully', '127.0.0.1', 'Werkzeug/3.1.8', '2026-08-14 04:12:24'),
(8, 1, 'admin', 'LOGIN', 'Auth', NULL, 'User logged in successfully', '127.0.0.1', 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Edg/151.0.0.0 Mobile Safari/537.36', '2026-08-14 05:06:42');

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `book_categories`
--

INSERT INTO `book_categories` (`category_id`, `category_code`, `category_name`, `description`, `is_active`, `created_at`) VALUES
(1, 'F-P', 'Fiction - Picture', NULL, 1, '2026-08-14 02:50:43'),
(2, 'F-CH', 'Fiction - Chapter', NULL, 1, '2026-08-14 02:50:43'),
(3, 'NF-P', 'Non-Fiction - Picture', NULL, 1, '2026-08-14 02:50:43'),
(4, 'NF-CH', 'Non-Fiction - Chapter', NULL, 1, '2026-08-14 02:50:43');

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `book_levels`
--

INSERT INTO `book_levels` (`level_id`, `level_code`, `level_name`, `description`, `sort_order`, `is_active`, `created_at`) VALUES
(1, 'L1', 'Level 1', NULL, 1, 1, '2026-08-14 02:50:43'),
(2, 'L2', 'Level 2', NULL, 2, 1, '2026-08-14 02:50:43'),
(3, 'L3', 'Level 3', NULL, 3, 1, '2026-08-14 02:50:43'),
(4, 'L4', 'Level 4', NULL, 4, 1, '2026-08-14 02:50:43'),
(5, 'L5', 'Level 5', NULL, 5, 1, '2026-08-14 02:50:43');

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `book_titles`
--

CREATE TABLE `book_titles` (
  `book_title_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `author` varchar(100) NOT NULL,
  `isbn` varchar(20) DEFAULT NULL,
  `level_id` int(11) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `publication_year` int(11) DEFAULT NULL,
  `publisher` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `cover_image` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `permissions`
--

INSERT INTO `permissions` (`permission_id`, `permission_code`, `permission_name`, `module`, `description`, `created_at`) VALUES
(1, 'student.view', 'View Students', 'student', NULL, '2026-08-14 02:50:42'),
(2, 'student.create', 'Create Students', 'student', NULL, '2026-08-14 02:50:42'),
(3, 'student.edit', 'Edit Students', 'student', NULL, '2026-08-14 02:50:42'),
(4, 'student.delete', 'Delete Students', 'student', NULL, '2026-08-14 02:50:42'),
(5, 'programme.view', 'View Programmes', 'programme', NULL, '2026-08-14 02:50:42'),
(6, 'programme.create', 'Create Programmes', 'programme', NULL, '2026-08-14 02:50:42'),
(7, 'programme.edit', 'Edit Programmes', 'programme', NULL, '2026-08-14 02:50:42'),
(8, 'programme.delete', 'Delete Programmes', 'programme', NULL, '2026-08-14 02:50:42'),
(9, 'subscription.view', 'View Subscriptions', 'subscription', NULL, '2026-08-14 02:50:42'),
(10, 'subscription.create', 'Create Subscriptions', 'subscription', NULL, '2026-08-14 02:50:42'),
(11, 'subscription.edit', 'Edit Subscriptions', 'subscription', NULL, '2026-08-14 02:50:42'),
(12, 'subscription.delete', 'Delete Subscriptions', 'subscription', NULL, '2026-08-14 02:50:42'),
(13, 'book.view', 'View Books', 'book', NULL, '2026-08-14 02:50:42'),
(14, 'book.create', 'Create Books', 'book', NULL, '2026-08-14 02:50:42'),
(15, 'book.edit', 'Edit Books', 'book', NULL, '2026-08-14 02:50:42'),
(16, 'book.delete', 'Delete Books', 'book', NULL, '2026-08-14 02:50:42'),
(17, 'book.issue', 'Issue Books', 'library', NULL, '2026-08-14 02:50:42'),
(18, 'book.return', 'Return Books', 'library', NULL, '2026-08-14 02:50:42'),
(19, 'damage.create', 'Record Damage', 'damage', NULL, '2026-08-14 02:50:42'),
(20, 'deposit.view', 'View Deposits', 'deposit', NULL, '2026-08-14 02:50:42'),
(21, 'deposit.topup', 'Top-up Deposit', 'deposit', NULL, '2026-08-14 02:50:42'),
(22, 'deposit.adjust', 'Adjust Deposit', 'deposit', NULL, '2026-08-14 02:50:42'),
(23, 'report.stock', 'Stock Report', 'report', NULL, '2026-08-14 02:50:42'),
(24, 'report.member', 'Member Report', 'report', NULL, '2026-08-14 02:50:42'),
(25, 'report.fine', 'Fine Report', 'report', NULL, '2026-08-14 02:50:42'),
(26, 'report.financial', 'Financial Report', 'report', NULL, '2026-08-14 02:50:42'),
(27, 'report.issue_return', 'Issue/Return Report', 'report', NULL, '2026-08-14 02:50:42'),
(28, 'settings.view', 'View Settings', 'settings', NULL, '2026-08-14 02:50:42'),
(29, 'audit.view', 'View Audit Logs', 'audit', NULL, '2026-08-14 02:50:42'),
(30, 'holiday.view', 'View Holidays', 'holiday', NULL, '2026-08-14 02:50:42'),
(31, 'user.view', 'View Users', 'user', NULL, '2026-08-14 02:50:42'),
(32, 'backup.create', 'Create Backup', 'backup', NULL, '2026-08-14 02:50:42'),
(33, 'export.create', 'Export Data', 'export', NULL, '2026-08-14 02:50:42');

-- --------------------------------------------------------

--
-- Table structure for table `programmes`
--

CREATE TABLE `programmes` (
  `programme_id` int(11) NOT NULL,
  `programme_name` varchar(50) NOT NULL,
  `programme_code` varchar(20) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `grade_level` varchar(20) DEFAULT NULL COMMENT 'Grade/Level like KG, 1, 2',
  `is_active` tinyint(1) DEFAULT NULL,
  `library_access` tinyint(1) DEFAULT NULL,
  `max_books_allowed` int(11) DEFAULT NULL,
  `sort_order` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `programmes`
--

INSERT INTO `programmes` (`programme_id`, `programme_name`, `programme_code`, `description`, `grade_level`, `is_active`, `library_access`, `max_books_allowed`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 'FLY', 'FLY', NULL, 'Pre-K', 1, 1, 2, 0, '2026-08-14 02:50:43', '2026-08-14 02:50:43'),
(2, 'R2R - Junior', 'R2RJ', NULL, 'KG1', 1, 1, 2, 0, '2026-08-14 02:50:43', '2026-08-14 02:50:43'),
(3, 'R2R - Senior', 'R2RS', NULL, 'KG2', 1, 1, 2, 0, '2026-08-14 02:50:44', '2026-08-14 02:50:44'),
(4, 'Lit Readers', 'LITR', NULL, 'Primary', 1, 1, 2, 0, '2026-08-14 02:50:44', '2026-08-14 02:50:44');

-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--

CREATE TABLE `role_permissions` (
  `role_permission_id` int(11) NOT NULL,
  `role` enum('ADMIN','STAFF') NOT NULL,
  `permission_id` int(11) NOT NULL,
  `created_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `role_permissions`
--

INSERT INTO `role_permissions` (`role_permission_id`, `role`, `permission_id`, `created_at`) VALUES
(1, 'STAFF', 1, '2026-08-14 02:50:42'),
(2, 'STAFF', 2, '2026-08-14 02:50:42'),
(3, 'STAFF', 3, '2026-08-14 02:50:42'),
(4, 'STAFF', 5, '2026-08-14 02:50:42'),
(5, 'STAFF', 9, '2026-08-14 02:50:42'),
(6, 'STAFF', 13, '2026-08-14 02:50:42'),
(7, 'STAFF', 14, '2026-08-14 02:50:42'),
(8, 'STAFF', 15, '2026-08-14 02:50:42'),
(9, 'STAFF', 17, '2026-08-14 02:50:42'),
(10, 'STAFF', 18, '2026-08-14 02:50:42'),
(11, 'STAFF', 19, '2026-08-14 02:50:42'),
(12, 'STAFF', 20, '2026-08-14 02:50:42'),
(13, 'STAFF', 21, '2026-08-14 02:50:42'),
(14, 'STAFF', 23, '2026-08-14 02:50:42'),
(15, 'STAFF', 24, '2026-08-14 02:50:42'),
(16, 'STAFF', 27, '2026-08-14 02:50:42'),
(17, 'STAFF', 30, '2026-08-14 02:50:42');

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `student_id` int(11) NOT NULL,
  `student_uid` varchar(20) NOT NULL COMMENT 'Permanent ID: KP000125',
  `student_name` varchar(100) NOT NULL,
  `date_of_birth` date NOT NULL,
  `gender` enum('MALE','FEMALE','OTHER') DEFAULT NULL,
  `school_name` varchar(100) DEFAULT NULL,
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
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `student_enrollments`
--

CREATE TABLE `student_enrollments` (
  `enrollment_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `academic_year_id` int(11) NOT NULL,
  `programme_id` int(11) NOT NULL,
  `grade` varchar(10) DEFAULT NULL,
  `roll_number` varchar(50) DEFAULT NULL,
  `section` varchar(10) DEFAULT NULL COMMENT 'A, B, C etc.',
  `status` enum('ACTIVE','COMPLETED','WITHDRAWN','TRANSFERRED') DEFAULT NULL,
  `enrollment_date` date DEFAULT NULL,
  `completion_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subscription_plans`
--

INSERT INTO `subscription_plans` (`subscription_plan_id`, `plan_name`, `plan_code`, `max_books`, `duration_months`, `price`, `is_active`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Caterpillar', 'CATER', 1, 3, 300.00, 1, NULL, '2026-08-14 02:50:44', '2026-08-14 02:50:44'),
(2, 'Butterfly', 'BUTTER', 2, 6, 550.00, 1, NULL, '2026-08-14 02:50:44', '2026-08-14 02:50:44'),
(3, 'Annual', 'ANNUAL', 3, 12, 1000.00, 1, NULL, '2026-08-14 02:50:44', '2026-08-14 02:50:44');

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`setting_id`, `setting_key`, `setting_value`, `data_type`, `category`, `description`, `is_editable`, `updated_by`, `created_at`, `updated_at`) VALUES
(1, 'backup_time', '02:00', 'STRING', 'Backup', 'Time to run daily backup (HH:MM)', 1, NULL, '2026-08-14 02:50:42', '2026-08-14 02:50:42'),
(2, 'holiday_adjustment', 'true', 'BOOLEAN', 'Library', 'Adjust due dates for holidays', 1, NULL, '2026-08-14 02:50:42', '2026-08-14 02:50:42'),
(3, 'low_deposit_threshold', '300', 'DECIMAL', 'Deposit', 'Low deposit warning and borrowing-block threshold', 1, NULL, '2026-08-14 02:50:43', '2026-08-14 02:50:43'),
(4, 'issue_period_days', '14', 'INTEGER', 'Library', 'Default book issue period in days', 1, NULL, '2026-08-14 02:50:43', '2026-08-14 02:50:43'),
(5, 'max_books_per_student', '3', 'INTEGER', 'Library', 'Maximum books a student can borrow', 1, NULL, '2026-08-14 02:50:43', '2026-08-14 02:50:43'),
(6, 'school_address', '', 'STRING', 'General', 'School address', 1, NULL, '2026-08-14 02:50:43', '2026-08-14 02:50:43'),
(7, 'damage_large', '200', 'DECIMAL', 'Charges', 'Damage charge - large', 1, NULL, '2026-08-14 02:50:43', '2026-08-14 02:50:43'),
(8, 'school_phone', '', 'STRING', 'General', 'School phone number', 1, NULL, '2026-08-14 02:50:43', '2026-08-14 02:50:43'),
(9, 'backup_retention_days', '30', 'INTEGER', 'Backup', 'Number of days to keep backups', 1, NULL, '2026-08-14 02:50:43', '2026-08-14 02:50:43'),
(10, 'session_timeout_minutes', '60', 'INTEGER', 'Security', 'Session timeout in minutes', 1, NULL, '2026-08-14 02:50:43', '2026-08-14 02:50:43'),
(11, 'barcode_lookup_enabled', 'true', 'BOOLEAN', 'Library', 'Enable barcode/ISBN lookup via API', 1, NULL, '2026-08-14 02:50:43', '2026-08-14 02:50:43'),
(12, 'damage_default', '300', 'DECIMAL', 'Charges', 'Damage charge - default', 1, NULL, '2026-08-14 02:50:43', '2026-08-14 02:50:43'),
(13, 'max_login_attempts', '5', 'INTEGER', 'Security', 'Maximum login attempts before lockout', 1, NULL, '2026-08-14 02:50:43', '2026-08-14 02:50:43'),
(14, 'school_name', 'Kinder Park Preschool', 'STRING', 'General', 'School name', 1, NULL, '2026-08-14 02:50:43', '2026-08-14 02:50:43'),
(15, 'damage_small', '100', 'DECIMAL', 'Charges', 'Damage charge - small', 1, NULL, '2026-08-14 02:50:43', '2026-08-14 02:50:43'),
(16, 'late_fine_per_day', '5.00', 'DECIMAL', 'Charges', 'Late fine per day in currency', 1, NULL, '2026-08-14 02:50:43', '2026-08-14 04:00:45'),
(17, 'open_library_api_url', 'https://openlibrary.org/api/books', 'STRING', 'API', 'Open Library API URL', 1, NULL, '2026-08-14 02:50:43', '2026-08-14 02:50:43'),
(18, 'time_format', '24h', 'STRING', 'General', 'Time display format', 1, NULL, '2026-08-14 02:50:43', '2026-08-14 02:50:43'),
(19, 'backup_frequency', 'daily', 'STRING', 'Backup', 'Backup frequency (daily/weekly/monthly)', 1, NULL, '2026-08-14 02:50:43', '2026-08-14 02:50:43'),
(20, 'min_deposit', '0', 'DECIMAL', 'Deposit', 'Minimum required deposit', 1, NULL, '2026-08-14 02:50:43', '2026-08-14 02:50:43'),
(21, 'date_format', 'YYYY-MM-DD', 'STRING', 'General', 'Date display format', 1, NULL, '2026-08-14 02:50:43', '2026-08-14 02:50:43'),
(22, 'backup_enabled', 'true', 'BOOLEAN', 'Backup', 'Enable automatic backups', 1, NULL, '2026-08-14 02:50:43', '2026-08-14 02:50:43'),
(23, 'open_library_api_timeout', '10', 'INTEGER', 'API', 'API request timeout in seconds', 1, NULL, '2026-08-14 02:50:43', '2026-08-14 02:50:43'),
(24, 'lost_book_charge', '500', 'DECIMAL', 'Charges', 'Lost book charge', 1, NULL, '2026-08-14 02:50:43', '2026-08-14 02:50:43'),
(25, 'currency', 'INR', 'STRING', 'General', 'Currency symbol', 1, NULL, '2026-08-14 02:50:43', '2026-08-14 02:50:43'),
(26, 'deposit_topup_min', '50', 'DECIMAL', 'Deposit', 'Minimum top-up amount', 1, NULL, '2026-08-14 02:50:43', '2026-08-14 02:50:43'),
(27, 'lockout_duration_minutes', '30', 'INTEGER', 'Security', 'Account lockout duration in minutes', 1, NULL, '2026-08-14 02:50:43', '2026-08-14 02:50:43'),
(28, 'school_email', '', 'STRING', 'General', 'School email address', 1, NULL, '2026-08-14 02:50:43', '2026-08-14 02:50:43');

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `email`, `password_hash`, `full_name`, `role`, `is_active`, `last_login`, `created_at`, `updated_at`) VALUES
(1, 'admin', 'admin@kinderpark.com', '$2b$12$YhcYibcUM7HJ9IvUQhDlpeAXEW2BT7JsSD4O36E/rmtIGmm19X/9u', 'System Administrator', 'ADMIN', 1, '2026-08-14 10:36:42', '2026-08-14 02:50:42', '2026-08-14 05:06:42');

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_active_enrollments`
-- (See below for the actual view)
--
CREATE TABLE `vw_active_enrollments` (
`student_uid` varchar(20)
,`student_name` varchar(100)
,`date_of_birth` date
,`academic_year` varchar(20)
,`programme_name` varchar(50)
,`roll_number` varchar(50)
,`grade` varchar(10)
,`enrollment_status` enum('ACTIVE','COMPLETED','WITHDRAWN','TRANSFERRED')
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_book_inventory`
-- (See below for the actual view)
--
CREATE TABLE `vw_book_inventory` (
`book_title_id` int(11)
,`title` varchar(255)
,`author` varchar(100)
,`isbn` varchar(20)
,`level_name` varchar(50)
,`category_name` varchar(50)
,`publication_year` int(11)
,`total_copies` bigint(21)
,`available_copies` decimal(22,0)
,`issued_copies` decimal(22,0)
,`damaged_copies` decimal(22,0)
,`lost_copies` decimal(22,0)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_student_deposits`
-- (See below for the actual view)
--
CREATE TABLE `vw_student_deposits` (
`student_uid` varchar(20)
,`student_name` varchar(100)
,`current_balance` decimal(10,2)
,`warning_threshold` decimal(10,2)
,`balance_status` varchar(6)
,`transaction_count` bigint(21)
,`last_transaction` datetime
);

-- --------------------------------------------------------

--
-- Structure for view `vw_active_enrollments`
--
DROP TABLE IF EXISTS `vw_active_enrollments`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_active_enrollments`  AS SELECT `s`.`student_uid` AS `student_uid`, `s`.`student_name` AS `student_name`, `s`.`date_of_birth` AS `date_of_birth`, `ay`.`year_code` AS `academic_year`, `p`.`programme_name` AS `programme_name`, `se`.`roll_number` AS `roll_number`, `se`.`grade` AS `grade`, `se`.`status` AS `enrollment_status` FROM (((`student_enrollments` `se` join `students` `s` on(`se`.`student_id` = `s`.`student_id`)) join `academic_years` `ay` on(`se`.`academic_year_id` = `ay`.`academic_year_id`)) join `programmes` `p` on(`se`.`programme_id` = `p`.`programme_id`)) WHERE `se`.`status` = 'ACTIVE' ;

-- --------------------------------------------------------

--
-- Structure for view `vw_book_inventory`
--
DROP TABLE IF EXISTS `vw_book_inventory`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_book_inventory`  AS SELECT `bt`.`book_title_id` AS `book_title_id`, `bt`.`title` AS `title`, `bt`.`author` AS `author`, `bt`.`isbn` AS `isbn`, `bl`.`level_name` AS `level_name`, `bc2`.`category_name` AS `category_name`, `bt`.`publication_year` AS `publication_year`, count(`bc`.`book_copy_id`) AS `total_copies`, sum(case when `bc`.`status` = 'AVAILABLE' then 1 else 0 end) AS `available_copies`, sum(case when `bc`.`status` = 'ISSUED' then 1 else 0 end) AS `issued_copies`, sum(case when `bc`.`status` = 'DAMAGED' then 1 else 0 end) AS `damaged_copies`, sum(case when `bc`.`status` = 'LOST' then 1 else 0 end) AS `lost_copies` FROM (((`book_titles` `bt` left join `book_copies` `bc` on(`bt`.`book_title_id` = `bc`.`book_title_id`)) left join `book_levels` `bl` on(`bt`.`level_id` = `bl`.`level_id`)) left join `book_categories` `bc2` on(`bt`.`category_id` = `bc2`.`category_id`)) GROUP BY `bt`.`book_title_id` ;

-- --------------------------------------------------------

--
-- Structure for view `vw_student_deposits`
--
DROP TABLE IF EXISTS `vw_student_deposits`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_student_deposits`  AS SELECT `s`.`student_uid` AS `student_uid`, `s`.`student_name` AS `student_name`, `da`.`current_balance` AS `current_balance`, `da`.`warning_threshold` AS `warning_threshold`, CASE WHEN `da`.`current_balance` < `da`.`warning_threshold` THEN 'LOW' WHEN `da`.`current_balance` >= `da`.`warning_threshold` AND `da`.`current_balance` < `da`.`warning_threshold` * 2 THEN 'MEDIUM' ELSE 'GOOD' END AS `balance_status`, count(`dt`.`transaction_id`) AS `transaction_count`, max(`dt`.`created_at`) AS `last_transaction` FROM ((`students` `s` join `deposit_accounts` `da` on(`s`.`student_id` = `da`.`student_id`)) left join `deposit_transactions` `dt` on(`da`.`deposit_account_id` = `dt`.`deposit_account_id`)) GROUP BY `s`.`student_id` ;

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
  ADD KEY `student_id` (`student_id`),
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
  MODIFY `academic_year_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `audit_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `book_categories`
--
ALTER TABLE `book_categories`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `book_copies`
--
ALTER TABLE `book_copies`
  MODIFY `book_copy_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `book_issues`
--
ALTER TABLE `book_issues`
  MODIFY `issue_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `book_levels`
--
ALTER TABLE `book_levels`
  MODIFY `level_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `book_returns`
--
ALTER TABLE `book_returns`
  MODIFY `return_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `book_titles`
--
ALTER TABLE `book_titles`
  MODIFY `book_title_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `damage_loss_records`
--
ALTER TABLE `damage_loss_records`
  MODIFY `record_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `deposit_accounts`
--
ALTER TABLE `deposit_accounts`
  MODIFY `deposit_account_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `deposit_transactions`
--
ALTER TABLE `deposit_transactions`
  MODIFY `transaction_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `grade_levels`
--
ALTER TABLE `grade_levels`
  MODIFY `grade_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `holidays`
--
ALTER TABLE `holidays`
  MODIFY `holiday_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `permission_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `programmes`
--
ALTER TABLE `programmes`
  MODIFY `programme_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `role_permissions`
--
ALTER TABLE `role_permissions`
  MODIFY `role_permission_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `student_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `student_enrollments`
--
ALTER TABLE `student_enrollments`
  MODIFY `enrollment_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `student_subscriptions`
--
ALTER TABLE `student_subscriptions`
  MODIFY `subscription_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `subscription_plans`
--
ALTER TABLE `subscription_plans`
  MODIFY `subscription_plan_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `setting_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `user_permissions`
--
ALTER TABLE `user_permissions`
  MODIFY `user_permission_id` int(11) NOT NULL AUTO_INCREMENT;

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
