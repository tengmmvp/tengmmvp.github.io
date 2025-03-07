---
title: "微读(WeRead)图书平台数据库创建脚本"
date: 2025-03-06
author: "WeRead Team"
tags: ["Web", "Mysql"]
---

下面给出一个后端操作的具体流程，以 Java Spring Boot 为例，说明如何使用后端来区分“account”字段（既可能为邮箱也可能为用户名）的处理流程：

---

### 1. 定义数据传输对象（DTO）

- **目的**：用于接收前端传来的 JSON 数据，字段只包含 `account` 和 `password`。

```java
public class LoginRequestDTO {
    private String account;   // 兼容邮箱或用户名
    private String password;

    // Getter 和 Setter 方法
}
```

---

### 2. 编写 Controller 接口

- **步骤**：
  - 接收前端传来的 JSON 数据，并封装为 LoginRequestDTO 对象。
  - 根据 `account` 字段内容判断用户输入的是邮箱还是用户名（一般采用简单规则：如果包含 "@" 则判断为邮箱）。

```java
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO loginRequest) {
        String account = loginRequest.getAccount();
        String password = loginRequest.getPassword();

        // 判断 account 是否为邮箱格式
        boolean isEmail = account.contains("@");

        // 根据判断结果查询用户信息
        User user = isEmail 
            ? userService.findByEmail(account) 
            : userService.findByUsername(account);

        // 检查用户是否存在
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("用户不存在");
        }

        // 验证密码（根据实际加密方式调用相应方法）
        if (!passwordMatches(password, user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("密码错误");
        }

        // 登录成功后生成 Token（或其他会话机制）
        String token = generateToken(user);

        // 返回结果
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", "登录成功");
        result.put("token", token);
        result.put("userId", user.getId());
        result.put("username", user.getUsername());
        result.put("email", user.getEmail());

        return ResponseEntity.ok(result);
    }

    // 示例密码验证逻辑
    private boolean passwordMatches(String rawPassword, String encodedPassword) {
        // 如使用 BCryptPasswordEncoder：return encoder.matches(rawPassword, encodedPassword);
        return rawPassword.equals(encodedPassword);
    }

    // 示例 Token 生成方法
    private String generateToken(User user) {
        // 根据业务需要生成 Token，例如 JWT
        return "your-jwt-token";
    }
}
```

---

### 3. Service 层与 Repository 层

- **Service 层**：提供两个查询用户的方法，根据邮箱或用户名查询。
  
```java
@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    public User findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username);
    }
}
```

- **Repository 层**：假设使用 Spring Data JPA，实现查询接口。
  
```java
public interface UserRepository extends JpaRepository<User, Long> {
    User findByEmail(String email);
    User findByUsername(String username);
}
```

---

### 4. 操作流程总结

1. **前端提交请求**  
   前端将数据以 JSON 格式发送到 `/api/auth/login`，内容类似：
   ```json
   {
     "account": "reader@example.com",  // 或 "reader123"
     "password": "your-password"
   }
   ```

2. **DTO 接收数据**  
   后端 Controller 接收到 JSON 数据后，自动映射到 `LoginRequestDTO` 对象。

3. **判断账号类型**  
   Controller 中通过简单判断（如判断是否包含 “@”）确定 `account` 字段是邮箱还是用户名。

4. **查询用户**  
   根据判断结果，调用相应的 Service 方法（`findByEmail` 或 `findByUsername`）查询数据库中的用户信息。

5. **验证用户与密码**  
   - 如果用户不存在，返回“用户不存在”的错误提示。  
   - 如果用户存在，则验证密码是否正确（需要与密码加密/解密逻辑配合）。

6. **生成 Token 并返回**  
   登录成功后，生成 Token（例如 JWT），将 Token 和用户信息返回给前端。

---

通过以上步骤，就实现了后端根据 `account` 字段内容来区分登录时用户是使用邮箱还是用户名，从而使前端只需要传递一个字段，后端灵活处理。
