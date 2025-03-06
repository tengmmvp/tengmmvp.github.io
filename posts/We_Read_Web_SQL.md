---
title: "微读(WeRead)图书平台数据库创建脚本"
date: 2025-03-06
author: "WeRead Team"
tags: ["Web", "Mysql"]
---

# “微读”平台SQL_脚本

```sql
-- ====================================================
-- 微读(WeRead)图书平台数据库创建脚本
-- ====================================================

/********************************************/
/**       0. 先删除视图、触发器、过程         **/
/********************************************/
DROP VIEW IF EXISTS View_Popular_Books;
DROP VIEW IF EXISTS View_User_Activity;
DROP VIEW IF EXISTS View_Popular_Searches;

DROP TRIGGER IF EXISTS Trigger_Update_Book_Stats;
DROP TRIGGER IF EXISTS Trigger_Update_Book_Stats_OnRatingUpdate;
DROP TRIGGER IF EXISTS Trigger_Update_Book_Stats_OnRatingDelete;

DROP TRIGGER IF EXISTS Trigger_Update_Last_Login_Time;  -- 预留触发器
DROP TRIGGER IF EXISTS Trigger_Update_User_Collection;
DROP TRIGGER IF EXISTS Trigger_Update_User_Collection_OnDelete;
DROP TRIGGER IF EXISTS Trigger_Update_User_Collection_OnUpdate; -- 可能用不到，视需求添加
DROP TRIGGER IF EXISTS Trigger_Insert_Book_Stats;
DROP TRIGGER IF EXISTS Trigger_Update_Browse_Count;
DROP TRIGGER IF EXISTS Trigger_Update_Browse_Count_OnDelete;

DROP PROCEDURE IF EXISTS GetSearchHistoryByDate;
DROP PROCEDURE IF EXISTS CleanUpSearchHistory;
DROP PROCEDURE IF EXISTS UpdateLastLoginTime;

/********************************************/
/**       1. 先删除依赖表 (外键顺序)        **/
/********************************************/
DROP TABLE IF EXISTS Notification;
DROP TABLE IF EXISTS Review;
DROP TABLE IF EXISTS Rating;
DROP TABLE IF EXISTS Search_History;
DROP TABLE IF EXISTS Browsing_History;
DROP TABLE IF EXISTS User_Collection;
DROP TABLE IF EXISTS Book_Tag;
DROP TABLE IF EXISTS Tag;
DROP TABLE IF EXISTS Book_Stats;
DROP TABLE IF EXISTS Book_Author;
DROP TABLE IF EXISTS Book;
DROP TABLE IF EXISTS Author;
DROP TABLE IF EXISTS Role_Permission;
DROP TABLE IF EXISTS Permission;
DROP TABLE IF EXISTS Admin;
DROP TABLE IF EXISTS Role;
DROP TABLE IF EXISTS Category;
DROP TABLE IF EXISTS User;

/********************************************/
/**       2. 创建数据表                   **/
/********************************************/

-- 2.1 图书分类表（Category）
CREATE TABLE Category (
    Category_ID BIGINT AUTO_INCREMENT PRIMARY KEY,
    Parent_ID BIGINT NULL,
    Name VARCHAR(100) NOT NULL,
    Description TEXT NULL COMMENT '分类描述',
    Level INT NOT NULL DEFAULT 1 COMMENT '分类层级，1为顶级分类',
    Sort_Order INT NOT NULL DEFAULT 0 COMMENT '排序权重',
    Status TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
    Created_At TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Parent_ID) REFERENCES Category(Category_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='图书分类表';

-- 2.2 角色表（Role）
CREATE TABLE Role (
    Role_ID BIGINT AUTO_INCREMENT PRIMARY KEY,
    Role_Name VARCHAR(50) NOT NULL COMMENT '角色名称',
    Description VARCHAR(255) NULL COMMENT '角色描述',
    Status TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
    Created_At TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_role_name (Role_Name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统角色表';

-- 2.3 权限表（Permission）
CREATE TABLE Permission (
    Permission_ID BIGINT AUTO_INCREMENT PRIMARY KEY,
    Permission_Name VARCHAR(50) NOT NULL COMMENT '权限名称',
    Permission_Code VARCHAR(50) NOT NULL COMMENT '权限代码',
    Description VARCHAR(255) NULL COMMENT '权限描述',
    Status TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
    UNIQUE KEY uk_permission_name (Permission_Name),
    UNIQUE KEY uk_permission_code (Permission_Code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统权限表';

-- 2.4 标签信息表（Tag）
CREATE TABLE Tag (
    Tag_ID BIGINT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL COMMENT '标签名称',
    Status TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
    Created_At TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_tag_name (Name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='图书标签表';

-- 2.5 用户信息表（User）
CREATE TABLE User (
    User_ID BIGINT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(50) NOT NULL COMMENT '用户登录名',
    Nickname VARCHAR(50) NOT NULL COMMENT '用户昵称',
    Password VARCHAR(255) NOT NULL COMMENT '密码（加密存储）',
    Email VARCHAR(100) NULL COMMENT '电子邮箱',
    Phone VARCHAR(20) NULL COMMENT '手机号码',
    Avatar VARCHAR(255) NULL COMMENT '头像URL',
    Gender TINYINT NOT NULL DEFAULT 0 COMMENT '性别：0-未知，1-男，2-女',
    Preference JSON COMMENT '用户偏好，JSON格式存储',
    Status TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1-正常，0-禁用',
    Last_Login_Time TIMESTAMP NULL COMMENT '最后登录时间',
    Created_At TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    Updated_At TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_username (Username),
    UNIQUE KEY uk_email (Email),
    UNIQUE KEY uk_phone (Phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户信息表';

-- 2.6 管理员信息表（Admin）
CREATE TABLE Admin (
    Admin_ID BIGINT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(50) NOT NULL COMMENT '管理员登录名',
    Real_Name VARCHAR(50) NOT NULL COMMENT '管理员真实姓名',
    Password VARCHAR(255) NOT NULL COMMENT '密码（加密存储）',
    Email VARCHAR(100) NOT NULL COMMENT '电子邮箱',
    Role_ID BIGINT NOT NULL COMMENT '角色ID',
    Status TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1-正常，0-禁用',
    Created_At TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    Updated_At TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_admin_username (Username),
    UNIQUE KEY uk_admin_email (Email),
    FOREIGN KEY (Role_ID) REFERENCES Role(Role_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员信息表';

-- 2.7 作者信息表（Author）
CREATE TABLE Author (
    Author_ID BIGINT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL COMMENT '作者姓名',
    Country VARCHAR(50) NULL COMMENT '作者国籍',
    Biography TEXT NULL COMMENT '作者简介',
    Created_At TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    Updated_At TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_author_name (Name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='作者信息表';

-- 2.8 书籍信息表（Book）
CREATE TABLE Book (
    Book_ID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ISBN VARCHAR(20) NOT NULL COMMENT '国际标准书号',
    Title VARCHAR(200) NOT NULL COMMENT '书名',
    Publisher VARCHAR(100) NULL COMMENT '出版社',
    Publication_Date DATE NULL COMMENT '出版日期',
    Language VARCHAR(20) NULL COMMENT '图书语言',
    Pages INT NULL COMMENT '页数',
    Description TEXT NULL COMMENT '图书简介',
    Cover_Image VARCHAR(255) NULL COMMENT '封面图片URL',
    File_Path VARCHAR(255) NULL COMMENT '电子书文件路径',
    Category_ID BIGINT NOT NULL COMMENT '分类ID',
    Has_Ebook TINYINT NOT NULL DEFAULT 0 COMMENT '是否有电子书：1-有，0-无',
    Status TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1-上架，0-下架',
    Created_At TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    Updated_At TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_book_isbn (ISBN),
    INDEX idx_book_title (Title),
    INDEX idx_book_publisher (Publisher),
    INDEX idx_book_pubdate (Publication_Date),
    FOREIGN KEY (Category_ID) REFERENCES Category(Category_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='图书信息表';

-- 2.9 书籍作者关联表（Book_Author）
CREATE TABLE Book_Author (
    Book_ID BIGINT NOT NULL,
    Author_ID BIGINT NOT NULL,
    Author_Order INT NOT NULL DEFAULT 1 COMMENT '作者顺序，用于多作者排序',
    PRIMARY KEY (Book_ID, Author_ID),
    FOREIGN KEY (Book_ID) REFERENCES Book(Book_ID),
    FOREIGN KEY (Author_ID) REFERENCES Author(Author_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='图书与作者关联表';

-- 2.10 书籍动态统计表（Book_Stats）
CREATE TABLE Book_Stats (
    Book_ID BIGINT PRIMARY KEY,
    View_Count INT NOT NULL DEFAULT 0 COMMENT '浏览次数',
    Download_Count INT NOT NULL DEFAULT 0 COMMENT '下载次数',
    Collection_Count INT NOT NULL DEFAULT 0 COMMENT '收藏次数',
    Rating_Sum INT NOT NULL DEFAULT 0 COMMENT '评分总和',
    Rating_Count INT NOT NULL DEFAULT 0 COMMENT '评分人数',
    Updated_At TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (Book_ID) REFERENCES Book(Book_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='图书统计数据表';

-- 2.11 书籍标签关联表（Book_Tag）
CREATE TABLE Book_Tag (
    Book_ID BIGINT NOT NULL,
    Tag_ID BIGINT NOT NULL,
    Created_At TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (Book_ID, Tag_ID),
    FOREIGN KEY (Book_ID) REFERENCES Book(Book_ID),
    FOREIGN KEY (Tag_ID) REFERENCES Tag(Tag_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='图书与标签关联表';

-- 2.12 用户收藏/书架表（User_Collection）
CREATE TABLE User_Collection (
    Collection_ID BIGINT AUTO_INCREMENT PRIMARY KEY,
    User_ID BIGINT NOT NULL,
    Book_ID BIGINT NOT NULL,
    Collection_Type TINYINT NOT NULL DEFAULT 3 COMMENT '收藏类型：1-想读，2-在读，3-已读',
    Note VARCHAR(255) NULL COMMENT '用户备注',
    Created_At TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
    FOREIGN KEY (User_ID) REFERENCES User(User_ID),
    FOREIGN KEY (Book_ID) REFERENCES Book(Book_ID),
    UNIQUE KEY uk_user_collection (User_ID, Book_ID, Collection_Type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户书籍收藏表';

-- 2.13 用户浏览记录表（Browsing_History）
CREATE TABLE Browsing_History (
    History_ID BIGINT AUTO_INCREMENT PRIMARY KEY,
    User_ID BIGINT NOT NULL,
    Book_ID BIGINT NOT NULL,
    Source VARCHAR(50) NULL COMMENT '浏览来源',
    Viewed_At TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '浏览时间',
    FOREIGN KEY (User_ID) REFERENCES User(User_ID),
    FOREIGN KEY (Book_ID) REFERENCES Book(Book_ID),
    INDEX idx_browsing_history_user_book (User_ID, Book_ID),
    INDEX idx_browsing_history_time (User_ID, Viewed_At)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户浏览历史表';

-- 2.14 用户搜索记录表（Search_History）
CREATE TABLE Search_History (
    Search_ID BIGINT AUTO_INCREMENT PRIMARY KEY,
    User_ID BIGINT NOT NULL,
    Query VARCHAR(255) NOT NULL COMMENT '搜索关键词',
    Result_Count INT DEFAULT 0 COMMENT '搜索结果数量',
    Searched_At TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '搜索时间',
    FOREIGN KEY (User_ID) REFERENCES User(User_ID),
    INDEX idx_search_query (Query),
    INDEX idx_search_user_time (User_ID, Searched_At)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户搜索历史表';

-- 2.15 用户评分表（Rating）
CREATE TABLE Rating (
    Rating_ID BIGINT AUTO_INCREMENT PRIMARY KEY,
    User_ID BIGINT NOT NULL,
    Book_ID BIGINT NOT NULL,
    Score DECIMAL(2,1) NOT NULL 
        CHECK (Score IN (0.5,1.0,1.5,2.0,2.5,3.0,3.5,4.0,4.5,5.0)) COMMENT '评分：0.5-5.0',
    Comment TEXT NULL COMMENT '评分评语',
    Status TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1-有效，0-已删除',
    Rated_At TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '评分时间',
    FOREIGN KEY (User_ID) REFERENCES User(User_ID),
    FOREIGN KEY (Book_ID) REFERENCES Book(Book_ID),
    UNIQUE KEY uk_rating_user_book (User_ID, Book_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户图书评分表';

-- 2.16 书评表（Review）
CREATE TABLE Review (
    Review_ID BIGINT AUTO_INCREMENT PRIMARY KEY,
    User_ID BIGINT NOT NULL,
    Book_ID BIGINT NOT NULL,
    Title VARCHAR(200) NOT NULL COMMENT '书评标题',
    Content TEXT NOT NULL COMMENT '书评内容',
    Status TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1-已发布，0-已删除',
    Created_At TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    Updated_At TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (User_ID) REFERENCES User(User_ID),
    FOREIGN KEY (Book_ID) REFERENCES Book(Book_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户书评表';

-- 2.17 系统通知表（Notification）
CREATE TABLE Notification (
    Notification_ID BIGINT AUTO_INCREMENT PRIMARY KEY,
    User_ID BIGINT NULL COMMENT '用户ID，NULL表示系统通知',
    Title VARCHAR(200) NOT NULL COMMENT '通知标题',
    Content TEXT NOT NULL COMMENT '通知内容',
    Type TINYINT NOT NULL COMMENT '通知类型：1-系统通知，2-个人通知',
    Is_Read TINYINT NOT NULL DEFAULT 0 COMMENT '是否已读：0-未读，1-已读',
    Created_At TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (User_ID) REFERENCES User(User_ID),
    INDEX idx_notification_is_read (Is_Read),
    INDEX idx_notification_user_read (User_ID, Is_Read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统通知表';

-- 2.18 角色权限关联表（Role_Permission）
CREATE TABLE Role_Permission (
    Role_ID BIGINT NOT NULL,
    Permission_ID BIGINT NOT NULL,
    Created_At TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (Role_ID, Permission_ID),
    FOREIGN KEY (Role_ID) REFERENCES Role(Role_ID),
    FOREIGN KEY (Permission_ID) REFERENCES Permission(Permission_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色权限关联表';

/********************************************/
/**       3. 存储过程（Stored Procedures）  **/
/********************************************/
DELIMITER $$

-- 带参数的存储过程：查询指定时间段内的用户搜索记录
CREATE PROCEDURE GetSearchHistoryByDate(
    IN start_date DATE,
    IN end_date DATE
)
BEGIN
    SELECT 
        sh.Search_ID,
        u.Username,
        sh.Query,
        sh.Result_Count,
        sh.Searched_At
    FROM 
        Search_History sh
    JOIN 
        User u ON sh.User_ID = u.User_ID
    WHERE 
        sh.Searched_At BETWEEN start_date AND end_date
    ORDER BY
        sh.Searched_At DESC;
END$$

-- 无参存储过程：清理超过三天的搜索记录
CREATE PROCEDURE CleanUpSearchHistory()
BEGIN
    DELETE FROM Search_History
    WHERE Searched_At < DATE_SUB(CURRENT_DATE, INTERVAL 3 DAY);

    SELECT CONCAT('已清理 ', ROW_COUNT(), ' 条过期搜索记录') AS Result;
END$$

-- 存储过程：更新用户最后登录时间
CREATE PROCEDURE UpdateLastLoginTime(
    IN user_id BIGINT
)
BEGIN
    UPDATE User
    SET Last_Login_Time = CURRENT_TIMESTAMP
    WHERE User_ID = user_id;
    
    SELECT Last_Login_Time FROM User WHERE User_ID = user_id;
END$$
DELIMITER ;

/********************************************/
/**       4. 视图（Views）                 **/
/********************************************/
-- 热门书籍视图（View_Popular_Books）
CREATE VIEW View_Popular_Books AS
SELECT 
    b.Book_ID,
    b.Title,
    a.Name AS Author_Name,
    b.Publisher,
    b.Publication_Date,
    b.Cover_Image,
    c.Name AS Category_Name,
    bs.View_Count,
    bs.Collection_Count,
    bs.Rating_Sum / CASE WHEN bs.Rating_Count = 0 THEN 1 ELSE bs.Rating_Count END AS Avg_Rating,
    bs.Rating_Count
FROM 
    Book b
JOIN 
    Book_Author ba ON b.Book_ID = ba.Book_ID AND ba.Author_Order = 1
JOIN 
    Author a ON ba.Author_ID = a.Author_ID
JOIN 
    Category c ON b.Category_ID = c.Category_ID
LEFT JOIN 
    Book_Stats bs ON b.Book_ID = bs.Book_ID
WHERE
    b.Status = 1
ORDER BY 
    bs.View_Count DESC, bs.Collection_Count DESC, Avg_Rating DESC;

-- 用户行为分析视图（View_User_Activity）
CREATE VIEW View_User_Activity AS
SELECT 
    u.User_ID,
    u.Username,
    u.Nickname,
    COUNT(DISTINCT sh.Search_ID) AS Search_Count,
    COUNT(DISTINCT bh.History_ID) AS View_Count,
    COUNT(DISTINCT uc.Collection_ID) AS Collection_Count,
    COUNT(DISTINCT r.Rating_ID) AS Rating_Count,
    COUNT(DISTINCT rv.Review_ID) AS Review_Count,
    DATEDIFF(CURRENT_TIMESTAMP, MIN(u.Created_At)) AS Days_Since_Joined,
    u.Last_Login_Time
FROM 
    User u
LEFT JOIN 
    Search_History sh ON u.User_ID = sh.User_ID
LEFT JOIN 
    Browsing_History bh ON u.User_ID = bh.User_ID
LEFT JOIN 
    User_Collection uc ON u.User_ID = uc.User_ID
LEFT JOIN 
    Rating r ON u.User_ID = r.User_ID
LEFT JOIN
    Review rv ON u.User_ID = rv.User_ID
GROUP BY 
    u.User_ID, u.Username, u.Nickname, u.Last_Login_Time;

-- 热门搜索视图（View_Popular_Searches）
CREATE VIEW View_Popular_Searches AS
SELECT 
    Query AS Search_Query,
    COUNT(Search_ID) AS Search_Count,
    MAX(Searched_At) AS Last_Searched_At
FROM 
    Search_History
WHERE 
    Searched_At >= CURDATE() - INTERVAL 3 DAY
GROUP BY 
    Query
ORDER BY 
    Search_Count DESC
LIMIT 10;

/********************************************/
/**       5. 触发器（Triggers）            **/
/********************************************/

-- 5.1 新书插入后初始化统计数据
DELIMITER $$
CREATE TRIGGER Trigger_Insert_Book_Stats
AFTER INSERT ON Book
FOR EACH ROW
BEGIN
    INSERT INTO Book_Stats (Book_ID, View_Count, Download_Count, Collection_Count, Rating_Sum, Rating_Count)
    VALUES (NEW.Book_ID, 0, 0, 0, 0, 0);
END$$
DELIMITER ;

-- 5.2 评分插入时，累加评分总和与评分人数
DELIMITER $$
CREATE TRIGGER Trigger_Update_Book_Stats
AFTER INSERT ON Rating
FOR EACH ROW
BEGIN
    UPDATE Book_Stats
    SET Rating_Sum = Rating_Sum + NEW.Score,
        Rating_Count = Rating_Count + 1,
        Updated_At = CURRENT_TIMESTAMP
    WHERE Book_ID = NEW.Book_ID;
END$$
DELIMITER ;

-- 5.2.1 评分更新时，若分数改变则修正评分总和（Rating_Count 不变）
DELIMITER $$
CREATE TRIGGER Trigger_Update_Book_Stats_OnRatingUpdate
AFTER UPDATE ON Rating
FOR EACH ROW
BEGIN
    IF OLD.Score <> NEW.Score THEN
        UPDATE Book_Stats
        SET Rating_Sum = Rating_Sum - OLD.Score + NEW.Score,
            Updated_At = CURRENT_TIMESTAMP
        WHERE Book_ID = NEW.Book_ID;
    END IF;
END$$
DELIMITER ;

-- 5.2.2 评分删除时，减去评分值并减少人数计数
DELIMITER $$
CREATE TRIGGER Trigger_Update_Book_Stats_OnRatingDelete
AFTER DELETE ON Rating
FOR EACH ROW
BEGIN
    UPDATE Book_Stats
    SET Rating_Sum = Rating_Sum - OLD.Score,
        Rating_Count = Rating_Count - 1,
        Updated_At = CURRENT_TIMESTAMP
    WHERE Book_ID = OLD.Book_ID;
END$$
DELIMITER ;

-- 5.3 插入收藏后，收藏次数+1
DELIMITER $$
CREATE TRIGGER Trigger_Update_User_Collection
AFTER INSERT ON User_Collection
FOR EACH ROW
BEGIN
    UPDATE Book_Stats
    SET Collection_Count = Collection_Count + 1,
        Updated_At = CURRENT_TIMESTAMP
    WHERE Book_ID = NEW.Book_ID;
END$$
DELIMITER ;

-- 5.3.1 删除收藏后，收藏次数-1
DELIMITER $$
CREATE TRIGGER Trigger_Update_User_Collection_OnDelete
AFTER DELETE ON User_Collection
FOR EACH ROW
BEGIN
    UPDATE Book_Stats
    SET Collection_Count = Collection_Count - 1,
        Updated_At = CURRENT_TIMESTAMP
    WHERE Book_ID = OLD.Book_ID;
END$$
DELIMITER ;

-- 如果业务允许“更新”收藏记录(比如改变 Collection_Type) 并且会影响统计，则可以再写 AFTER UPDATE 触发器
-- 示例(仅当 Book_ID 改变时才会触发统计迁移)。是否需要当 Collection_Type 改变时也做处理，视具体业务而定：
/*
DELIMITER $$
CREATE TRIGGER Trigger_Update_User_Collection_OnUpdate
AFTER UPDATE ON User_Collection
FOR EACH ROW
BEGIN
    IF OLD.Book_ID <> NEW.Book_ID THEN
        -- 先对旧书 -1
        UPDATE Book_Stats
        SET Collection_Count = Collection_Count - 1,
            Updated_At = CURRENT_TIMESTAMP
        WHERE Book_ID = OLD.Book_ID;
        
        -- 再对新书 +1
        UPDATE Book_Stats
        SET Collection_Count = Collection_Count + 1,
            Updated_At = CURRENT_TIMESTAMP
        WHERE Book_ID = NEW.Book_ID;
    END IF;
END$$
DELIMITER ;
*/

-- 5.4 插入浏览记录后，浏览次数 +1
DELIMITER $$
CREATE TRIGGER Trigger_Update_Browse_Count
AFTER INSERT ON Browsing_History
FOR EACH ROW
BEGIN
    UPDATE Book_Stats
    SET View_Count = View_Count + 1,
        Updated_At = CURRENT_TIMESTAMP
    WHERE Book_ID = NEW.Book_ID;
END$$
DELIMITER ;

-- 如果需要在删除浏览记录时 -1，可以加如下触发器：
/*
DELIMITER $$
CREATE TRIGGER Trigger_Update_Browse_Count_OnDelete
AFTER DELETE ON Browsing_History
FOR EACH ROW
BEGIN
    UPDATE Book_Stats
    SET View_Count = View_Count - 1,
        Updated_At = CURRENT_TIMESTAMP
    WHERE Book_ID = OLD.Book_ID;
END$$
DELIMITER ;
*/

/********************************************/
/**       脚本结束                         **/
/********************************************/

```
