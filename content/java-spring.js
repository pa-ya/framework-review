(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "java-spring",
  name: "Java Spring",
  language: "Java",
  group: "Others",
  navLabel: "Java Spring",
  tagline: "The **IoC/DI container** + auto-configuration that turns Java into a productive backend platform. Ship REST APIs with `spring-boot-starter-web` in minutes.",
  color: "#6db33f",
  readMinutes: 28,
  sections: [
    {
      id: "overview",
      title: "What Spring & Spring Boot Are",
      level: "core",
      body: [
        { type: "p", text: "**Spring Framework** is at heart an *Inversion of Control* (IoC) container. Instead of your code constructing its own collaborators with `new`, you declare components and their dependencies, and the container builds and wires the object graph for you. This *Dependency Injection* (DI) is the single idea everything else is built on: it decouples classes from their concrete collaborators, which makes code testable, swappable, and configurable." },
        { type: "p", text: "**Spring Boot** is an opinionated layer on top of Spring that removes boilerplate. It brings three big things: **starters** (curated, version-aligned dependency bundles), **auto-configuration** (it inspects the classpath and configures sensible beans automatically — see a JDBC driver, get a `DataSource`; see `spring-webmvc`, get an embedded Tomcat), and an **embedded server** so your app is a runnable `java -jar` process rather than a WAR you deploy into a servlet container." },
        { type: "heading", text: "Plain Spring vs Spring Boot" },
        { type: "table", headers: ["Concern", "Plain Spring", "Spring Boot"], rows: [
          ["Configuration", "Manual XML/JavaConfig for every bean", "Auto-configuration from classpath"],
          ["Dependencies", "Pick versions yourself, resolve conflicts", "Starters with a managed BOM"],
          ["Server", "Deploy WAR to external Tomcat", "Embedded server, `java -jar`"],
          ["Getting started", "Days of plumbing", "Minutes via Initializr"]
        ] },
        { type: "heading", text: "The ecosystem" },
        { type: "list", items: [
          "**Spring Web (MVC)** — REST controllers, request mapping, content negotiation.",
          "**Spring Data JPA** — repositories over Hibernate; derived queries, paging, projections.",
          "**Spring Security** — authentication/authorization, filter chain, method security.",
          "**Spring Actuator** — production endpoints: health, metrics, info, thread dumps.",
          "**Spring Boot Test** — slice tests, `MockMvc`, Testcontainers integration."
        ] },
        { type: "heading", text: "When to choose Spring Boot" },
        { type: "p", text: "Reach for it when you want a **mature, strongly-typed, batteries-included** platform: large teams, long-lived enterprise services, complex transactional data, and a hiring pool that already knows it. The tradeoff is a heavier runtime and a steeper learning curve than a minimalist framework. For tiny scripts or ultra-low-latency, low-memory edge functions, lighter stacks may fit better — but for the typical business backend, Spring's ecosystem depth is hard to beat." },
        { type: "callout", variant: "tip", text: "Mental model: you write *components*; Spring owns their *lifecycle* and *wiring*. Stop calling `new` on your services and repositories — let the container do it." }
      ]
    },
    {
      id: "java-for-spring",
      title: "Modern Java You'll Actually Use",
      level: "core",
      body: [
        { type: "p", text: "Spring Boot 3 targets **Java 17+** (Jakarta EE, not the old `javax.*`). You don't need to be a Java guru, but a handful of modern features show up constantly. Here's the tight version." },
        { type: "heading", text: "Records — perfect for DTOs" },
        { type: "p", text: "A `record` is an immutable data carrier: the compiler generates the constructor, accessors, `equals`, `hashCode`, and `toString`. Ideal for request/response DTOs where you want value semantics and zero boilerplate." },
        { type: "code", lang: "java", code: "public record CreateUserRequest(String email, String name) {}\npublic record UserResponse(Long id, String email, String name) {}\n\n// Usage — compact, immutable, self-documenting\nvar req = new CreateUserRequest(\"a@b.com\", \"Ada\");\nString email = req.email(); // generated accessor, no getEmail()" },
        { type: "heading", text: "var, Optional, streams & lambdas" },
        { type: "p", text: "`var` infers local variable types (only locals — not fields or method signatures). `Optional<T>` models \"maybe absent\" without nulls and pairs beautifully with Spring Data's `findById`. Streams + lambdas give you declarative collection processing." },
        { type: "code", lang: "java", code: "// Optional: no null checks, express intent\nreturn userRepository.findById(id)\n    .map(user -> new UserResponse(user.getId(), user.getEmail(), user.getName()))\n    .orElseThrow(() -> new UserNotFoundException(id));\n\n// Streams: transform + filter + collect\nList<String> activeEmails = users.stream()\n    .filter(User::isActive)\n    .map(User::getEmail)\n    .sorted()\n    .toList();" },
        { type: "heading", text: "The annotation model" },
        { type: "p", text: "Annotations like `@Service` or `@GetMapping` are metadata the container reads at startup/runtime (via reflection and, increasingly, ahead-of-time processing). They don't *do* anything by themselves — Spring's infrastructure scans for them and reacts. Understanding \"annotation = a marker Spring interprets\" demystifies most of the framework." },
        { type: "heading", text: "Sealed types & pattern matching" },
        { type: "code", lang: "java", code: "sealed interface PaymentResult permits Approved, Declined {}\nrecord Approved(String authCode) implements PaymentResult {}\nrecord Declined(String reason) implements PaymentResult {}\n\nString describe(PaymentResult r) {\n    return switch (r) {\n        case Approved a -> \"OK: \" + a.authCode();\n        case Declined d -> \"No: \" + d.reason();\n    }; // exhaustive — compiler enforces all permitted cases\n}" },
        { type: "heading", text: "Checked vs unchecked exceptions" },
        { type: "p", text: "**Checked** exceptions (`extends Exception`) must be declared or caught. **Unchecked** (`extends RuntimeException`) propagate freely. Spring strongly favors unchecked exceptions — its data access layer translates SQL errors into `RuntimeException` subclasses, and crucially, `@Transactional` **rolls back on unchecked exceptions by default but not on checked ones**. Prefer `RuntimeException` for your domain errors unless you have a reason not to." },
        { type: "callout", variant: "gotcha", text: "`@Transactional` does NOT roll back on checked exceptions by default. Either throw unchecked, or use `@Transactional(rollbackFor = Exception.class)`." }
      ]
    },
    {
      id: "setup",
      title: "Project Setup: Initializr, Maven & Layout",
      level: "core",
      body: [
        { type: "p", text: "Start at [start.spring.io](https://start.spring.io) (Spring Initializr). Pick **Maven** or **Gradle**, Java 17+, Spring Boot 3.x, add starters (Web, JPA, Validation, Security…), and download a ready project. Maven is the most common in enterprise; Gradle is faster and more flexible. We'll use Maven here." },
        { type: "heading", text: "A real pom.xml" },
        { type: "code", lang: "xml", code: "<project xmlns=\"http://maven.apache.org/POM/4.0.0\">\n  <modelVersion>4.0.0</modelVersion>\n\n  <parent>\n    <groupId>org.springframework.boot</groupId>\n    <artifactId>spring-boot-starter-parent</artifactId>\n    <version>3.3.2</version>\n    <relativePath/>\n  </parent>\n\n  <groupId>com.acme</groupId>\n  <artifactId>users-api</artifactId>\n  <version>0.0.1-SNAPSHOT</version>\n\n  <properties>\n    <java.version>17</java.version>\n  </properties>\n\n  <dependencies>\n    <dependency>\n      <groupId>org.springframework.boot</groupId>\n      <artifactId>spring-boot-starter-web</artifactId>\n    </dependency>\n    <dependency>\n      <groupId>org.springframework.boot</groupId>\n      <artifactId>spring-boot-starter-data-jpa</artifactId>\n    </dependency>\n    <dependency>\n      <groupId>org.springframework.boot</groupId>\n      <artifactId>spring-boot-starter-validation</artifactId>\n    </dependency>\n    <dependency>\n      <groupId>org.postgresql</groupId>\n      <artifactId>postgresql</artifactId>\n      <scope>runtime</scope>\n    </dependency>\n    <dependency>\n      <groupId>org.springframework.boot</groupId>\n      <artifactId>spring-boot-starter-test</artifactId>\n      <scope>test</scope>\n    </dependency>\n  </dependencies>\n\n  <build>\n    <plugins>\n      <plugin>\n        <groupId>org.springframework.boot</groupId>\n        <artifactId>spring-boot-maven-plugin</artifactId>\n      </plugin>\n    </plugins>\n  </build>\n</project>" },
        { type: "callout", variant: "note", text: "Notice starters have **no version** — the `spring-boot-starter-parent` BOM manages every version so they stay compatible. This is one of Boot's biggest quality-of-life wins." },
        { type: "heading", text: "The entry point" },
        { type: "code", lang: "java", code: "@SpringBootApplication // = @Configuration + @EnableAutoConfiguration + @ComponentScan\npublic class UsersApiApplication {\n    public static void main(String[] args) {\n        SpringApplication.run(UsersApiApplication.class, args);\n    }\n}" },
        { type: "p", text: "`@SpringBootApplication` is a meta-annotation bundling three things: it marks a config class, enables auto-configuration, and starts component scanning **from this package downward**. Keep it at the root of your package tree so scanning finds everything." },
        { type: "heading", text: "Configuration file" },
        { type: "code", lang: "yaml", code: "spring:\n  datasource:\n    url: jdbc:postgresql://localhost:5432/users\n    username: app\n    password: secret\n  jpa:\n    hibernate:\n      ddl-auto: validate\n    show-sql: false\nserver:\n  port: 8080" },
        { type: "heading", text: "Run it & the standard layout" },
        { type: "code", lang: "bash", code: "./mvnw spring-boot:run     # dev run with the wrapper (no local Maven needed)\n./mvnw clean package       # build the fat jar" },
        { type: "list", items: [
          "`src/main/java/com/acme/usersapi/` — code, sub-packaged by feature or layer",
          "`src/main/resources/application.yml` — config",
          "`src/main/resources/db/migration/` — Flyway/Liquibase SQL (if used)",
          "`src/test/java/...` — mirrors main for tests"
        ] }
      ]
    },
    {
      id: "di-beans",
      title: "Dependency Injection & Beans — The Core",
      level: "core",
      body: [
        { type: "p", text: "A **bean** is any object the Spring container instantiates, wires, and manages. The **IoC container** (the `ApplicationContext`) reads your component definitions, resolves the dependency graph, and hands each bean the collaborators it declared. You describe *what* you need; Spring decides *how* to build it." },
        { type: "heading", text: "Stereotype annotations" },
        { type: "p", text: "These mark a class as a component to be scanned and registered. They're functionally similar but express intent (and `@Repository` adds exception translation):" },
        { type: "table", headers: ["Annotation", "Intended role"], rows: [
          ["@Component", "Generic Spring-managed bean"],
          ["@Service", "Business logic / service layer"],
          ["@Repository", "Data access; adds DB exception translation"],
          ["@Controller / @RestController", "Web request handlers"]
        ] },
        { type: "heading", text: "Constructor injection (do this)" },
        { type: "code", lang: "java", code: "@Service\npublic class UserService {\n    private final UserRepository userRepository;\n    private final PasswordEncoder passwordEncoder;\n\n    // Single constructor => Spring auto-injects; no @Autowired needed\n    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {\n        this.userRepository = userRepository;\n        this.passwordEncoder = passwordEncoder;\n    }\n\n    public User register(String email, String rawPassword) {\n        var user = new User(email, passwordEncoder.encode(rawPassword));\n        return userRepository.save(user);\n    }\n}" },
        { type: "p", text: "Constructor injection lets you mark dependencies `final` (immutable, guaranteed set), makes required dependencies explicit, and — crucially — lets you construct the class in a unit test with `new UserService(mockRepo, mockEncoder)` **without any Spring at all**." },
        { type: "heading", text: "Field injection (avoid)" },
        { type: "code", lang: "java", code: "@Service\npublic class BadService {\n    @Autowired private UserRepository userRepository; // hard to test, hides deps, not final\n}" },
        { type: "callout", variant: "warn", text: "Field injection can't be `final`, hides the dependency contract, and forces reflection or a running context to test. Prefer constructor injection everywhere." },
        { type: "heading", text: "@Configuration + @Bean for third-party types" },
        { type: "p", text: "When you can't annotate a class (it's from a library), declare it in a `@Configuration` class with `@Bean` factory methods:" },
        { type: "code", lang: "java", code: "@Configuration\npublic class AppConfig {\n    @Bean\n    public PasswordEncoder passwordEncoder() {\n        return new BCryptPasswordEncoder();\n    }\n\n    @Bean\n    public RestClient restClient(RestClient.Builder builder) {\n        return builder.baseUrl(\"https://api.example.com\").build();\n    }\n}" },
        { type: "heading", text: "Scopes, disambiguation & conditions" },
        { type: "list", items: [
          "**Scopes**: `singleton` (default — one instance per container), `prototype` (new each injection), plus web scopes `request`/`session`.",
          "**@Primary** marks the default bean when several candidates match one type.",
          "**@Qualifier(\"name\")** picks a specific bean by name at the injection point.",
          "**@ConditionalOnProperty / @ConditionalOnMissingBean** register a bean only under conditions — the mechanism behind auto-configuration."
        ] },
        { type: "code", lang: "java", code: "public NotificationService(@Qualifier(\"smsSender\") MessageSender sender) { ... }" },
        { type: "heading", text: "The proxy model — why it matters" },
        { type: "p", text: "For features like `@Transactional`, `@Cacheable`, and `@Async`, Spring does **not** hand you your raw object. It wraps your bean in a **proxy** — a generated subclass (CGLIB) or interface proxy that intercepts method calls to add behavior (open a transaction, check the cache) before delegating to your code. This is the foundation of Spring AOP." },
        { type: "callout", variant: "gotcha", text: "Because the proxy only intercepts calls that come *through* it, a method calling another `@Transactional`/`@Cacheable` method **on the same instance** (`this.other()`) bypasses the proxy entirely. Remember this — it explains a whole class of \"why didn't my annotation work?\" bugs (covered in Transactions)." }
      ]
    },
    {
      id: "rest-controllers",
      title: "REST Controllers",
      level: "core",
      body: [
        { type: "p", text: "`@RestController` = `@Controller` + `@ResponseBody`: every handler's return value is serialized (via Jackson) straight to the HTTP response body as JSON. Map URLs with `@RequestMapping` at class level and the HTTP-verb shortcuts (`@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`) on methods." },
        { type: "heading", text: "Binding annotations" },
        { type: "table", headers: ["Annotation", "Binds from", "Example"], rows: [
          ["@PathVariable", "URI template segment", "`/users/{id}`"],
          ["@RequestParam", "Query string", "`?page=2&size=20`"],
          ["@RequestBody", "Deserialized JSON body", "POST payload → DTO"],
          ["@RequestHeader", "HTTP header", "`Authorization`"]
        ] },
        { type: "heading", text: "A full CRUD controller" },
        { type: "code", lang: "java", code: "@RestController\n@RequestMapping(\"/api/users\")\npublic class UserController {\n    private final UserService userService;\n\n    public UserController(UserService userService) {\n        this.userService = userService;\n    }\n\n    @GetMapping\n    public Page<UserResponse> list(@RequestParam(defaultValue = \"0\") int page,\n                                   @RequestParam(defaultValue = \"20\") int size) {\n        return userService.list(PageRequest.of(page, size));\n    }\n\n    @GetMapping(\"/{id}\")\n    public UserResponse getOne(@PathVariable Long id) {\n        return userService.getById(id); // throws if missing -> handled globally\n    }\n\n    @PostMapping\n    public ResponseEntity<UserResponse> create(@Valid @RequestBody CreateUserRequest req) {\n        UserResponse created = userService.create(req);\n        URI location = URI.create(\"/api/users/\" + created.id());\n        return ResponseEntity.created(location).body(created); // 201 + Location header\n    }\n\n    @PutMapping(\"/{id}\")\n    public UserResponse update(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest req) {\n        return userService.update(id, req);\n    }\n\n    @DeleteMapping(\"/{id}\")\n    @ResponseStatus(HttpStatus.NO_CONTENT)\n    public void delete(@PathVariable Long id) {\n        userService.delete(id); // 204, no body\n    }\n}" },
        { type: "heading", text: "ResponseEntity & status codes" },
        { type: "p", text: "Return the DTO directly for a plain 200, or wrap in `ResponseEntity<T>` when you need to control status, headers, or return an empty body. Use `ResponseEntity.created(location)` for 201, `.noContent()` for 204, `.notFound()` for 404. Prefer throwing exceptions for error cases and letting a global handler map them (see Exceptions)." },
        { type: "callout", variant: "tip", text: "Keep controllers thin: bind, validate, delegate to a service, shape the response. No business logic, no repository calls directly in the controller." },
        { type: "heading", text: "Content negotiation" },
        { type: "p", text: "Spring picks the response format from the `Accept` header. With Jackson on the classpath JSON is the default; add `jackson-dataformat-xml` and clients requesting `application/xml` get XML from the same handler. `produces`/`consumes` on the mapping constrain and document the media types." }
      ]
    },
    {
      id: "validation",
      title: "Request Validation",
      level: "core",
      body: [
        { type: "p", text: "Spring integrates **Jakarta Bean Validation** (Hibernate Validator). Add `spring-boot-starter-validation`, annotate your DTO fields with constraints, and put `@Valid` on the `@RequestBody` parameter. A violation short-circuits the handler with a `MethodArgumentNotValidException` you can translate into a clean 400." },
        { type: "heading", text: "Constrain the DTO" },
        { type: "code", lang: "java", code: "public record CreateUserRequest(\n    @NotBlank @Email String email,\n    @NotBlank @Size(min = 2, max = 80) String name,\n    @NotNull @Min(18) Integer age,\n    @Pattern(regexp = \"^[A-Z]{2}$\") String countryCode\n) {}" },
        { type: "code", lang: "java", code: "@PostMapping\npublic ResponseEntity<UserResponse> create(@Valid @RequestBody CreateUserRequest req) {\n    return ResponseEntity.status(201).body(userService.create(req));\n}" },
        { type: "heading", text: "Validating path & query params" },
        { type: "p", text: "For constraints directly on method parameters (not inside a DTO), annotate the controller class with `@Validated`, then constraints on `@PathVariable`/`@RequestParam` are enforced (throwing `ConstraintViolationException`)." },
        { type: "code", lang: "java", code: "@Validated\n@RestController\n@RequestMapping(\"/api/users\")\npublic class UserController {\n    @GetMapping(\"/{id}\")\n    public UserResponse get(@PathVariable @Min(1) Long id) { ... }\n\n    @GetMapping\n    public Page<UserResponse> list(@RequestParam @Max(100) int size) { ... }\n}" },
        { type: "heading", text: "Turning violations into a clean 400" },
        { type: "code", lang: "java", code: "@RestControllerAdvice\npublic class ValidationExceptionHandler {\n    @ExceptionHandler(MethodArgumentNotValidException.class)\n    @ResponseStatus(HttpStatus.BAD_REQUEST)\n    public Map<String, Object> onInvalid(MethodArgumentNotValidException ex) {\n        Map<String, String> fieldErrors = ex.getBindingResult().getFieldErrors().stream()\n            .collect(Collectors.toMap(FieldError::getField,\n                                      FieldError::getDefaultMessage,\n                                      (a, b) -> a));\n        return Map.of(\"error\", \"validation_failed\", \"fields\", fieldErrors);\n    }\n}" },
        { type: "callout", variant: "good", text: "Validate at the edge (the DTO), keep entities clean, and return field-level messages. Clients can highlight exactly which input failed." }
      ]
    },
    {
      id: "data-jpa",
      title: "Spring Data JPA",
      level: "core",
      body: [
        { type: "p", text: "Spring Data JPA sits on top of Hibernate (the JPA provider). You define **entities** (Java classes mapped to tables) and **repository interfaces**; Spring generates the implementation at runtime. You rarely write SQL for CRUD." },
        { type: "heading", text: "Entities & relationships" },
        { type: "code", lang: "java", code: "@Entity\n@Table(name = \"users\")\npublic class User {\n    @Id\n    @GeneratedValue(strategy = GenerationType.IDENTITY)\n    private Long id;\n\n    @Column(nullable = false, unique = true)\n    private String email;\n\n    @Column(nullable = false)\n    private String name;\n\n    // One user has many orders; LAZY = don't load orders until touched\n    @OneToMany(mappedBy = \"user\", cascade = CascadeType.ALL, fetch = FetchType.LAZY)\n    private List<Order> orders = new ArrayList<>();\n\n    protected User() {} // JPA needs a no-arg constructor\n    public User(String email, String name) { this.email = email; this.name = name; }\n    // getters (setters as needed)\n}\n\n@Entity\n@Table(name = \"orders\")\npublic class Order {\n    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)\n    private Long id;\n\n    @ManyToOne(fetch = FetchType.LAZY) // ALWAYS make @ManyToOne lazy\n    @JoinColumn(name = \"user_id\")\n    private User user;\n\n    private BigDecimal total;\n}" },
        { type: "callout", variant: "gotcha", text: "`@ManyToOne` and `@OneToOne` are **EAGER by default** — a surprising performance trap. Set `fetch = FetchType.LAZY` explicitly and load associations on purpose via fetch joins." },
        { type: "heading", text: "Repositories & derived queries" },
        { type: "p", text: "Extend `JpaRepository<Entity, IdType>` to inherit `save`, `findById`, `findAll`, `delete`, paging, and more. Add methods whose *names* describe the query — Spring parses the name and generates JPQL." },
        { type: "code", lang: "java", code: "public interface UserRepository extends JpaRepository<User, Long> {\n    Optional<User> findByEmail(String email);\n    List<User> findByNameContainingIgnoreCase(String fragment);\n    boolean existsByEmail(String email);\n    long countByNameStartingWith(String prefix);\n    Page<User> findByOrders_TotalGreaterThan(BigDecimal min, Pageable pageable);\n}" },
        { type: "heading", text: "@Query — JPQL & native" },
        { type: "code", lang: "java", code: "public interface OrderRepository extends JpaRepository<Order, Long> {\n\n    // JPQL: operates on entities, not tables. JOIN FETCH avoids N+1.\n    @Query(\"select o from Order o join fetch o.user where o.total > :min\")\n    List<Order> findBigOrdersWithUser(@Param(\"min\") BigDecimal min);\n\n    // Native SQL when you need DB-specific features\n    @Query(value = \"SELECT * FROM orders WHERE total > :min\", nativeQuery = true)\n    List<Order> findBigOrdersNative(@Param(\"min\") BigDecimal min);\n\n    @Modifying\n    @Query(\"update Order o set o.total = o.total * :factor where o.user.id = :uid\")\n    int applyDiscount(@Param(\"uid\") Long uid, @Param(\"factor\") BigDecimal factor);\n}" },
        { type: "heading", text: "Paging & projections" },
        { type: "p", text: "`Pageable`/`Page<T>` give you slice-based access with total counts. **Projections** fetch only the columns you need — an interface with getters, or a DTO constructor in JPQL — which is faster and keeps entities out of your API." },
        { type: "code", lang: "java", code: "// Interface projection: Spring returns a proxy exposing just these fields\npublic interface UserSummary {\n    Long getId();\n    String getEmail();\n}\nList<UserSummary> findByNameStartingWith(String prefix);\n\n// DTO projection via constructor expression\n@Query(\"select new com.acme.dto.UserSummaryDto(u.id, u.email) from User u\")\nList<UserSummaryDto> fetchSummaries();" },
        { type: "callout", variant: "tip", text: "For list endpoints, project into DTOs instead of loading full entity graphs. You transfer less data, avoid lazy-loading surprises, and never leak entity internals." }
      ]
    },
    {
      id: "transactions",
      title: "Transactions & @Transactional",
      level: "core",
      body: [
        { type: "p", text: "`@Transactional` declaratively wraps a method in a database transaction: begin on entry, commit on normal return, roll back on a runtime exception. It works via the **proxy** — the container intercepts the call, opens a transaction, then delegates to your code. Put it on **service methods**, where a unit of business work lives, not on controllers or repositories." },
        { type: "code", lang: "java", code: "@Service\npublic class OrderService {\n    private final OrderRepository orders;\n    private final InventoryRepository inventory;\n\n    public OrderService(OrderRepository orders, InventoryRepository inventory) {\n        this.orders = orders; this.inventory = inventory;\n    }\n\n    @Transactional // both writes commit together, or both roll back\n    public Order place(Long productId, int qty) {\n        inventory.decrement(productId, qty);\n        return orders.save(new Order(productId, qty));\n    }\n\n    @Transactional(readOnly = true) // no dirty checking, DB can optimize\n    public List<Order> recent() {\n        return orders.findTop50ByOrderByCreatedAtDesc();\n    }\n}" },
        { type: "heading", text: "Propagation, read-only & rollback rules" },
        { type: "list", items: [
          "**Propagation** controls how nested calls join transactions: `REQUIRED` (default — join existing or start one), `REQUIRES_NEW` (suspend the outer, run in its own), `SUPPORTS`, `MANDATORY`, etc.",
          "**readOnly = true** flags read-only work; Hibernate skips dirty-checking snapshots and drivers/DBs can optimize. Use it on every query-only method.",
          "**Rollback**: rolls back on `RuntimeException`/`Error` by default, **not** on checked exceptions. Override with `rollbackFor` / `noRollbackFor`."
        ] },
        { type: "heading", text: "The self-invocation pitfall" },
        { type: "p", text: "Because `@Transactional` is applied by a proxy, it only triggers when the call arrives **through** that proxy. If one method in a bean calls another `@Transactional` method **on `this`**, the call never leaves the object, the proxy is bypassed, and the annotation is silently ignored." },
        { type: "code", lang: "java", code: "@Service\npublic class ReportService {\n    // WRONG: outer() calls this.generate() directly -> proxy skipped, NO transaction\n    public void outer() {\n        generate(); // internal call, bypasses the proxy\n    }\n    @Transactional\n    public void generate() { /* expected a tx here, but there isn't one */ }\n}" },
        { type: "heading", text: "The fix" },
        { type: "code", lang: "java", code: "// Fix 1 (cleanest): move the transactional method to another bean\n@Service\npublic class ReportService {\n    private final ReportGenerator generator; // injected -> calls go through its proxy\n    public ReportService(ReportGenerator generator) { this.generator = generator; }\n    public void outer() { generator.generate(); }\n}\n\n@Service\npublic class ReportGenerator {\n    @Transactional\n    public void generate() { /* now genuinely transactional */ }\n}\n\n// Fix 2: self-inject the proxy and call through it\n@Service\npublic class ReportService {\n    @Autowired private ReportService self; // the proxy, not `this`\n    public void outer() { self.generate(); }\n    @Transactional public void generate() { ... }\n}" },
        { type: "callout", variant: "warn", text: "Same trap applies to `private` and `final` methods: the proxy can't intercept them, so `@Transactional`/`@Cacheable`/`@Async` on a private or final method does nothing. Keep annotated methods `public` and called from *outside* the bean." }
      ]
    },
    {
      id: "exceptions",
      title: "Exception Handling",
      level: "core",
      body: [
        { type: "p", text: "Don't scatter try/catch across controllers. Centralize with `@RestControllerAdvice` — a class of `@ExceptionHandler` methods that intercept exceptions thrown by any controller and produce a consistent JSON error body." },
        { type: "heading", text: "Custom exceptions" },
        { type: "code", lang: "java", code: "public class UserNotFoundException extends RuntimeException {\n    public UserNotFoundException(Long id) {\n        super(\"User not found: \" + id);\n    }\n}\n\npublic class EmailAlreadyUsedException extends RuntimeException {\n    public EmailAlreadyUsedException(String email) { super(\"Email in use: \" + email); }\n}" },
        { type: "heading", text: "A consistent error body" },
        { type: "code", lang: "java", code: "public record ApiError(String code, String message, Instant timestamp) {\n    public static ApiError of(String code, String message) {\n        return new ApiError(code, message, Instant.now());\n    }\n}\n\n@RestControllerAdvice\npublic class GlobalExceptionHandler {\n\n    @ExceptionHandler(UserNotFoundException.class)\n    @ResponseStatus(HttpStatus.NOT_FOUND)\n    public ApiError notFound(UserNotFoundException ex) {\n        return ApiError.of(\"user_not_found\", ex.getMessage());\n    }\n\n    @ExceptionHandler(EmailAlreadyUsedException.class)\n    @ResponseStatus(HttpStatus.CONFLICT)\n    public ApiError conflict(EmailAlreadyUsedException ex) {\n        return ApiError.of(\"email_conflict\", ex.getMessage());\n    }\n\n    @ExceptionHandler(Exception.class) // safety net -> never leak stack traces\n    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)\n    public ApiError unexpected(Exception ex) {\n        log.error(\"Unhandled\", ex);\n        return ApiError.of(\"internal_error\", \"Something went wrong\");\n    }\n}" },
        { type: "heading", text: "ResponseStatusException — the quick path" },
        { type: "p", text: "For one-off cases you don't need a custom type. Throw a `ResponseStatusException` with a status and reason directly:" },
        { type: "code", lang: "java", code: "throw new ResponseStatusException(HttpStatus.FORBIDDEN, \"Not your resource\");" },
        { type: "callout", variant: "tip", text: "Prefer typed domain exceptions + a `@RestControllerAdvice` for anything reused. It keeps controllers clean and gives every client a predictable error contract." }
      ]
    },
    {
      id: "security",
      title: "Spring Security 6 & JWT",
      level: "core",
      body: [
        { type: "p", text: "Spring Security is a **filter chain** in front of your app. In version 6 you configure it by declaring a `SecurityFilterChain` bean with the **lambda DSL** (the old `WebSecurityConfigurerAdapter` is gone). For APIs you typically go **stateless**: no server session, a JWT on every request." },
        { type: "heading", text: "Password encoding" },
        { type: "p", text: "Never store plaintext. Expose a `PasswordEncoder` bean (`BCryptPasswordEncoder`) and use it to hash on registration and verify on login." },
        { type: "code", lang: "java", code: "@Bean\npublic PasswordEncoder passwordEncoder() {\n    return new BCryptPasswordEncoder();\n}" },
        { type: "heading", text: "The SecurityFilterChain" },
        { type: "code", lang: "java", code: "@Configuration\n@EnableWebSecurity\n@EnableMethodSecurity // enables @PreAuthorize/@PostAuthorize\npublic class SecurityConfig {\n    private final JwtAuthFilter jwtAuthFilter;\n\n    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {\n        this.jwtAuthFilter = jwtAuthFilter;\n    }\n\n    @Bean\n    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {\n        return http\n            .csrf(csrf -> csrf.disable()) // safe for a stateless token API\n            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))\n            .authorizeHttpRequests(auth -> auth\n                .requestMatchers(\"/api/auth/**\", \"/actuator/health\").permitAll()\n                .requestMatchers(HttpMethod.GET, \"/api/products/**\").permitAll()\n                .anyRequest().authenticated())\n            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)\n            .build();\n    }\n}" },
        { type: "heading", text: "A JWT validation filter" },
        { type: "p", text: "The filter runs once per request, extracts the bearer token, validates it, and — if valid — populates the `SecurityContext` so downstream authorization sees an authenticated principal." },
        { type: "code", lang: "java", code: "@Component\npublic class JwtAuthFilter extends OncePerRequestFilter {\n    private final JwtService jwtService;\n\n    public JwtAuthFilter(JwtService jwtService) { this.jwtService = jwtService; }\n\n    @Override\n    protected void doFilterInternal(HttpServletRequest request,\n                                    HttpServletResponse response,\n                                    FilterChain chain) throws ServletException, IOException {\n        String header = request.getHeader(\"Authorization\");\n        if (header != null && header.startsWith(\"Bearer \")) {\n            String token = header.substring(7);\n            if (jwtService.isValid(token)) {\n                String username = jwtService.subject(token);\n                var authorities = jwtService.roles(token).stream()\n                        .map(SimpleGrantedAuthority::new).toList();\n                var auth = new UsernamePasswordAuthenticationToken(username, null, authorities);\n                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));\n                SecurityContextHolder.getContext().setAuthentication(auth);\n            }\n        }\n        chain.doFilter(request, response);\n    }\n}" },
        { type: "heading", text: "Method-level security" },
        { type: "code", lang: "java", code: "@PreAuthorize(\"hasRole('ADMIN')\")\npublic void deleteUser(Long id) { ... }\n\n@PreAuthorize(\"#userId == authentication.name or hasRole('ADMIN')\")\npublic UserResponse profile(String userId) { ... }" },
        { type: "callout", variant: "warn", text: "Disabling CSRF is fine for a stateless, token-only API but dangerous for anything using cookies/sessions. Know which mode you're in before you turn it off." }
      ]
    },
    {
      id: "config-profiles",
      title: "Configuration & Profiles",
      level: "core",
      body: [
        { type: "p", text: "Externalize configuration so the same jar runs in dev, staging, and prod with different settings. Spring reads from `application.yml`, profile-specific files, environment variables, and command-line args — in a defined precedence order (env vars and CLI override files)." },
        { type: "heading", text: "@Value for single properties" },
        { type: "code", lang: "java", code: "@Service\npublic class MailService {\n    @Value(\"\${app.mail.from}\")\n    private String fromAddress;\n\n    @Value(\"\${app.mail.retries:3}\") // :3 = default if property absent\n    private int retries;\n}" },
        { type: "callout", variant: "note", text: "In `@Value` the `\${...}` placeholder is resolved from configuration. Provide a default after a colon so startup doesn't fail when a property is missing." },
        { type: "heading", text: "@ConfigurationProperties — type-safe binding" },
        { type: "p", text: "For a group of related settings, bind them into a typed object. Cleaner than a dozen `@Value` fields, validated, and discoverable." },
        { type: "code", lang: "java", code: "@ConfigurationProperties(prefix = \"app.mail\")\n@Validated\npublic record MailProperties(\n    @NotBlank String from,\n    @Min(1) int retries,\n    String host\n) {}\n\n@Configuration\n@EnableConfigurationProperties(MailProperties.class)\npublic class MailConfig {\n    @Bean\n    public MailService mailService(MailProperties props) {\n        return new MailService(props.from(), props.retries());\n    }\n}" },
        { type: "code", lang: "yaml", code: "# application.yml\napp:\n  mail:\n    from: no-reply@acme.com\n    retries: 5\n    host: smtp.acme.com" },
        { type: "heading", text: "Profiles" },
        { type: "p", text: "A **profile** is a named set of config/beans. Put environment-specific values in `application-{profile}.yml` and activate with `spring.profiles.active`. Guard beans with `@Profile`." },
        { type: "code", lang: "yaml", code: "# application-dev.yml\nspring:\n  jpa:\n    show-sql: true\n  datasource:\n    url: jdbc:h2:mem:devdb" },
        { type: "code", lang: "java", code: "@Bean\n@Profile(\"dev\")\npublic CommandLineRunner seedData(UserRepository repo) {\n    return args -> repo.save(new User(\"dev@acme.com\", \"Dev\"));\n}" },
        { type: "code", lang: "bash", code: "# Activate a profile at runtime (env var overrides the file)\nSPRING_PROFILES_ACTIVE=prod java -jar users-api.jar\n# Override any single property via env var (relaxed binding)\nSPRING_DATASOURCE_PASSWORD=secret java -jar users-api.jar" },
        { type: "callout", variant: "tip", text: "Never commit secrets. Keep placeholders in yml and inject real values via environment variables in each environment." }
      ]
    },
    {
      id: "testing",
      title: "Testing",
      level: "deep",
      body: [
        { type: "p", text: "Spring Boot gives you a spectrum: fast **unit tests** with plain Mockito, focused **slice tests** that load only part of the context, and full **`@SpringBootTest`** integration tests. Use the lightest tool that covers what you're testing." },
        { type: "table", headers: ["Annotation", "Loads", "Use for"], rows: [
          ["(none) + Mockito", "Nothing Spring", "Pure service logic"],
          ["@WebMvcTest", "Web layer + MockMvc", "Controller request/response"],
          ["@DataJpaTest", "JPA + in-memory/TC DB", "Repositories & queries"],
          ["@SpringBootTest", "Full context", "End-to-end integration"]
        ] },
        { type: "heading", text: "Unit test with Mockito (no Spring)" },
        { type: "code", lang: "java", code: "@ExtendWith(MockitoExtension.class)\nclass UserServiceTest {\n    @Mock UserRepository repo;\n    @InjectMocks UserService service; // constructor injection makes this trivial\n\n    @Test\n    void createsUser() {\n        when(repo.existsByEmail(\"a@b.com\")).thenReturn(false);\n        when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));\n\n        var result = service.create(new CreateUserRequest(\"a@b.com\", \"Ada\", 30, \"US\"));\n\n        assertThat(result.email()).isEqualTo(\"a@b.com\");\n        verify(repo).save(any(User.class));\n    }\n}" },
        { type: "heading", text: "Controller slice with MockMvc + @MockBean" },
        { type: "code", lang: "java", code: "@WebMvcTest(UserController.class)\nclass UserControllerTest {\n    @Autowired MockMvc mvc;\n    @MockBean UserService userService; // replaces the real bean in the context\n\n    @Test\n    void returns404WhenMissing() throws Exception {\n        when(userService.getById(99L)).thenThrow(new UserNotFoundException(99L));\n        mvc.perform(get(\"/api/users/99\"))\n           .andExpect(status().isNotFound())\n           .andExpect(jsonPath(\"$.code\").value(\"user_not_found\"));\n    }\n\n    @Test\n    void rejectsInvalidBody() throws Exception {\n        mvc.perform(post(\"/api/users\").contentType(MediaType.APPLICATION_JSON)\n               .content(\"{\\\"email\\\":\\\"bad\\\"}\"))\n           .andExpect(status().isBadRequest());\n    }\n}" },
        { type: "heading", text: "Real database with Testcontainers" },
        { type: "p", text: "Instead of an in-memory H2 that behaves differently from prod, spin up the **real** Postgres in Docker for the test's lifetime. This catches native SQL, dialect, and constraint issues H2 would hide." },
        { type: "code", lang: "java", code: "@DataJpaTest\n@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)\n@Testcontainers\nclass UserRepositoryTest {\n    @Container\n    static PostgreSQLContainer<?> db = new PostgreSQLContainer<>(\"postgres:16\");\n\n    @DynamicPropertySource\n    static void props(DynamicPropertyRegistry r) {\n        r.add(\"spring.datasource.url\", db::getJdbcUrl);\n        r.add(\"spring.datasource.username\", db::getUsername);\n        r.add(\"spring.datasource.password\", db::getPassword);\n    }\n\n    @Autowired UserRepository repo;\n\n    @Test\n    void findsByEmail() {\n        repo.save(new User(\"x@y.com\", \"X\"));\n        assertThat(repo.findByEmail(\"x@y.com\")).isPresent();\n    }\n}" },
        { type: "callout", variant: "good", text: "Test pyramid: many fast unit tests, a solid layer of slice tests, a few full integration tests with Testcontainers for the paths that really matter." }
      ]
    },
    {
      id: "structure",
      title: "Project Structure & Layering",
      level: "deep",
      body: [
        { type: "p", text: "The canonical Spring architecture is layered: **controller → service → repository**. Requests flow down; each layer has one job. Controllers speak HTTP, services hold business logic and transactions, repositories talk to the database." },
        { type: "list", items: [
          "**Controller** — bind & validate input, delegate, shape the HTTP response. No business rules.",
          "**Service** — orchestrate use cases, enforce rules, own `@Transactional` boundaries.",
          "**Repository** — persistence only; derived queries and `@Query`."
        ] },
        { type: "heading", text: "Package-by-feature vs package-by-layer" },
        { type: "p", text: "**Package-by-layer** groups by technical role (`controller/`, `service/`, `repository/`). Simple, but a single feature is smeared across packages. **Package-by-feature** groups by domain (`user/`, `order/`, each containing its controller+service+repository). It scales better, keeps related code together, and makes modularization/visibility easier. Prefer package-by-feature for anything non-trivial." },
        { type: "code", lang: "text", code: "com.acme.usersapi\n├── user\n│   ├── UserController.java\n│   ├── UserService.java\n│   ├── UserRepository.java\n│   ├── User.java            (entity — package-private if possible)\n│   └── dto\n│       ├── CreateUserRequest.java\n│       └── UserResponse.java\n├── order\n│   └── ...\n└── config\n    └── SecurityConfig.java" },
        { type: "heading", text: "DTO ↔ entity mapping — keep entities out of the API" },
        { type: "p", text: "Never serialize JPA entities straight to JSON: you leak your schema, risk lazy-loading exceptions during serialization, and couple your API to your tables. Map to DTOs at the boundary. **MapStruct** generates the mapping code at compile time (fast, no reflection)." },
        { type: "code", lang: "java", code: "@Mapper(componentModel = \"spring\")\npublic interface UserMapper {\n    UserResponse toResponse(User user);\n    List<UserResponse> toResponses(List<User> users);\n\n    @Mapping(target = \"id\", ignore = true)\n    @Mapping(target = \"orders\", ignore = true)\n    User toEntity(CreateUserRequest req);\n}\n\n// Injected like any bean\n@Service\npublic class UserService {\n    private final UserRepository repo;\n    private final UserMapper mapper;\n    public UserService(UserRepository repo, UserMapper mapper) {\n        this.repo = repo; this.mapper = mapper;\n    }\n    public UserResponse getById(Long id) {\n        return repo.findById(id).map(mapper::toResponse)\n            .orElseThrow(() -> new UserNotFoundException(id));\n    }\n}" },
        { type: "callout", variant: "tip", text: "Entities live behind the service layer. The web layer only ever sees DTOs. This single rule prevents a huge share of Spring API design mistakes." }
      ]
    },
    {
      id: "deployment",
      title: "Building & Deploying",
      level: "deep",
      body: [
        { type: "p", text: "Spring Boot packages your whole app — code, dependencies, and an embedded server — into a single **executable fat JAR**. No external Tomcat, no WAR deployment. Build it, run it with `java -jar`, done." },
        { type: "code", lang: "bash", code: "./mvnw clean package            # produces target/users-api-0.0.1-SNAPSHOT.jar\njava -jar target/users-api-0.0.1-SNAPSHOT.jar\n# override config at launch\njava -jar app.jar --server.port=9090 --spring.profiles.active=prod" },
        { type: "heading", text: "Docker: buildpacks vs a Dockerfile" },
        { type: "p", text: "The plugin can build an optimized OCI image with **no Dockerfile** using Cloud Native Buildpacks:" },
        { type: "code", lang: "bash", code: "./mvnw spring-boot:build-image -Dspring-boot.build-image.imageName=acme/users-api:1.0" },
        { type: "p", text: "Or write a **layered** Dockerfile so Docker caches dependencies separately from your fast-changing code (rebuilds only re-copy the app layer):" },
        { type: "code", lang: "text", code: "FROM eclipse-temurin:17-jre AS runtime\nWORKDIR /app\nCOPY target/*.jar app.jar\nEXPOSE 8080\nENTRYPOINT [\"java\", \"-jar\", \"app.jar\"]" },
        { type: "heading", text: "Actuator: health & metrics" },
        { type: "p", text: "Add `spring-boot-starter-actuator` for production endpoints: `/actuator/health` (liveness/readiness for k8s), `/actuator/metrics`, `/actuator/info`, `/actuator/prometheus` (with Micrometer). Expose only what you need." },
        { type: "code", lang: "yaml", code: "management:\n  endpoints:\n    web:\n      exposure:\n        include: health,info,metrics,prometheus\n  endpoint:\n    health:\n      probes:\n        enabled: true   # /health/liveness and /health/readiness" },
        { type: "heading", text: "JVM memory basics" },
        { type: "list", items: [
          "**Heap** holds your objects; cap it with `-Xmx` (e.g. `-Xmx512m`). In containers the JVM 17 respects cgroup limits automatically.",
          "`-XX:MaxRAMPercentage=75.0` sizes the heap as a share of the container's memory — better than a fixed `-Xmx` in orchestrated environments.",
          "Watch for `OutOfMemoryError` (leaks, unbounded caches) and long GC pauses under load; expose metrics via Actuator/Micrometer to catch them early."
        ] },
        { type: "callout", variant: "note", text: "Buildpacks (`build-image`) already set sensible container-aware JVM flags and layer the jar for cache efficiency — a great default if you don't need a custom base image." }
      ]
    },
    {
      id: "headaches",
      title: "Common headaches & how to handle them",
      level: "deep",
      body: [
        { type: "p", text: "The bugs that bite every Spring backend team. Learn the shape of each and the fix becomes reflexive." },
        { type: "heading", text: "1. The N+1 query problem" },
        { type: "p", text: "Loading a list of entities then touching a lazy association per element fires one query for the list plus one per row — N+1 round trips. Deadly on large lists." },
        { type: "code", lang: "java", code: "// WRONG: 1 query for orders, then 1 per order to load its user = N+1\nList<Order> orders = orderRepository.findAll();\norders.forEach(o -> log.info(o.getUser().getName())); // lazy hit each iteration\n\n// RIGHT (a): JOIN FETCH loads users in the same query\n@Query(\"select o from Order o join fetch o.user\")\nList<Order> findAllWithUser();\n\n// RIGHT (b): @EntityGraph declares what to fetch eagerly for this call\n@EntityGraph(attributePaths = \"user\")\nList<Order> findAll();" },
        { type: "heading", text: "2. LazyInitializationException" },
        { type: "p", text: "Accessing a lazy association **after** the transaction/persistence context closed (e.g. during JSON serialization in the controller) throws `LazyInitializationException` — \"could not initialize proxy, no Session\"." },
        { type: "list", items: [
          "**Best**: fetch what you need inside the transaction via `JOIN FETCH`/`@EntityGraph`, then map to a DTO before returning.",
          "**Also good**: do the mapping inside a `@Transactional` service method so the session is still open.",
          "**Avoid** `spring.jpa.open-in-view` (on by default) as a crutch — it keeps the session open across the request and hides real N+1/perf problems."
        ] },
        { type: "heading", text: "3. @Transactional self-invocation silently ignored" },
        { type: "p", text: "Calling a `@Transactional` method from another method of the **same bean** bypasses the proxy, so no transaction starts. Fix: move it to another bean, or self-inject the proxy (full detail in the Transactions section). Same applies to `private`/`final` annotated methods." },
        { type: "heading", text: "4. Field injection makes tests painful" },
        { type: "code", lang: "java", code: "// WRONG: can't construct in a test without reflection/Spring\n@Autowired private UserRepository repo;\n\n// RIGHT: constructor injection -> new Service(mockRepo) in a plain unit test\nprivate final UserRepository repo;\npublic UserService(UserRepository repo) { this.repo = repo; }" },
        { type: "heading", text: "5. equals/hashCode on JPA entities" },
        { type: "p", text: "Using the DB-generated `id` in `equals`/`hashCode` breaks `Set` semantics: a new entity's id is `null` before persist and changes after, so an entity added to a `HashSet` becomes unfindable. Don't autogenerate from all fields either." },
        { type: "code", lang: "java", code: "// RIGHT: stable business key, or a UUID assigned in the constructor\n@Override public boolean equals(Object o) {\n    if (this == o) return true;\n    if (!(o instanceof User other)) return false;\n    return email != null && email.equals(other.email); // immutable natural key\n}\n@Override public int hashCode() { return getClass().hashCode(); } // constant, Set-safe" },
        { type: "heading", text: "6. Circular bean dependencies" },
        { type: "p", text: "Bean A needs B and B needs A via constructors → the container can't build either and startup fails. This usually signals a design smell. Fix by extracting the shared logic into a third bean, or (last resort) breaking the cycle with `@Lazy` on one injection point. Avoid setter injection just to hide the cycle." },
        { type: "heading", text: "7. Forgetting @Transactional(readOnly = true)" },
        { type: "p", text: "Read-only query methods without `readOnly = true` still run Hibernate dirty-checking and hold write-oriented resources. Marking them read-only lets Hibernate skip snapshots and the DB/driver optimize. Cheap win on every query service method." },
        { type: "heading", text: "8. Optional misuse" },
        { type: "list", items: [
          "Don't use `Optional` for fields or method parameters — it's designed for return types (\"maybe no result\").",
          "Don't call `.get()` without checking; use `.orElseThrow(...)`, `.map(...)`, `.orElse(...)`.",
          "`Optional<T>` from `findById` is a gift: chain a `.map` to a DTO and `.orElseThrow` a domain exception in one expression."
        ] },
        { type: "callout", variant: "good", text: "Almost all of these trace back to two ideas: understand the proxy model (transactions/AOP), and keep the persistence context in mind (lazy loading, N+1). Master those two and the headaches mostly disappear." }
      ]
    }
  ],
  packages: [
    { name: "spring-boot-starter-web", why: "REST/MVC + JSON (Jackson) + embedded Tomcat" },
    { name: "spring-boot-starter-data-jpa", why: "Spring Data JPA over Hibernate: repositories, paging" },
    { name: "spring-boot-starter-security", why: "Auth/authorization, filter chain, method security" },
    { name: "spring-boot-starter-validation", why: "Jakarta Bean Validation (Hibernate Validator)" },
    { name: "spring-boot-starter-actuator", why: "Production endpoints: health, metrics, info, Prometheus" },
    { name: "spring-boot-devtools", why: "Dev-time auto-restart and live reload" },
    { name: "postgresql", why: "PostgreSQL JDBC driver (runtime scope)" },
    { name: "org.projectlombok:lombok", why: "Generates getters/builders/constructors to cut boilerplate" },
    { name: "org.mapstruct:mapstruct", why: "Compile-time DTO <-> entity mapping, no reflection" },
    { name: "org.testcontainers:postgresql", why: "Real Postgres in Docker for integration tests" },
    { name: "io.jsonwebtoken:jjwt", why: "Create and verify JWTs for stateless auth" }
  ],
  gotchas: [
    "@ManyToOne/@OneToOne are EAGER by default — set fetch = LAZY to avoid silent extra queries.",
    "@Transactional on a method called via this.method() (same bean) is ignored — the proxy is bypassed.",
    "@Transactional/@Async/@Cacheable on private or final methods do nothing — proxies can't intercept them.",
    "@Transactional rolls back on RuntimeException but NOT checked exceptions unless you set rollbackFor.",
    "Serializing JPA entities directly can throw LazyInitializationException — map to DTOs first.",
    "open-in-view is on by default and masks N+1 problems — fetch eagerly on purpose instead.",
    "Field @Autowired can't be final and makes unit tests need reflection — use constructor injection.",
    "Using a generated id in entity equals/hashCode breaks HashSet membership before/after persist.",
    "Beans are singletons by default — never store per-request mutable state in a @Service field.",
    "Component scanning starts at @SpringBootApplication's package — beans outside it aren't found."
  ],
  flashcards: [
    { q: "What is Inversion of Control / Dependency Injection in Spring?", a: "You declare components and their dependencies; the container (`ApplicationContext`) builds and wires the object graph instead of your code calling `new`. Decouples classes, enabling testing and swapping." },
    { q: "Why prefer constructor injection over field @Autowired?", a: "Dependencies can be `final` and are explicit; you can `new` the class in a plain unit test with mocks — no Spring, no reflection needed." },
    { q: "Why does @Transactional not work when called from the same bean?", a: "It's applied by a proxy that only intercepts calls arriving through it. `this.method()` is an internal call that bypasses the proxy, so no transaction starts. Move the method to another bean or self-inject the proxy." },
    { q: "What is the N+1 query problem and how do you fix it?", a: "One query for a list plus one per row to load a lazy association. Fix with `JOIN FETCH` in a `@Query` or `@EntityGraph(attributePaths=...)` to load associations in one query." },
    { q: "What causes LazyInitializationException?", a: "Accessing a lazy association after the persistence context/session has closed (e.g. during controller serialization). Fix: fetch eagerly with a fetch join and map to a DTO inside the transaction." },
    { q: "What does @RestControllerAdvice do?", a: "Declares a global exception-handling class whose `@ExceptionHandler` methods catch exceptions from any controller and return a consistent JSON error body with a mapped status." },
    { q: "What do you get from extending JpaRepository<T, ID>?", a: "CRUD (`save`, `findById`, `findAll`, `delete`), paging/sorting, and derived query methods generated from method names — plus `@Query` for custom JPQL/native SQL." },
    { q: "How do Spring profiles work?", a: "A profile is a named set of config/beans. Put values in `application-{profile}.yml`, activate via `spring.profiles.active`, and guard beans with `@Profile(\"name\")`." },
    { q: "How do you configure security in Spring Security 6?", a: "Declare a `SecurityFilterChain` bean using the lambda DSL on `HttpSecurity` (the old `WebSecurityConfigurerAdapter` is removed). Add custom filters with `addFilterBefore`." },
    { q: "@Value vs @ConfigurationProperties?", a: "`@Value(\"\${prop}\")` injects one property (default after a colon). `@ConfigurationProperties(prefix=...)` binds a whole group into a type-safe, validatable object — preferred for related settings." }
  ],
  cheatsheet: [
    { label: "New project", code: "curl https://start.spring.io/starter.zip -d dependencies=web,data-jpa -o app.zip" },
    { label: "Dev run", code: "./mvnw spring-boot:run" },
    { label: "GET endpoint", code: "@GetMapping(\"/{id}\")\nUserResponse get(@PathVariable Long id) { return service.getById(id); }" },
    { label: "Repository method", code: "Optional<User> findByEmail(String email);" },
    { label: "Custom @Query", code: "@Query(\"select o from Order o join fetch o.user where o.total > :min\")\nList<Order> big(@Param(\"min\") BigDecimal min);" },
    { label: "Transaction", code: "@Transactional(readOnly = true)\nList<Order> recent() { return orders.findRecent(); }" },
    { label: "@Value (escaped)", code: "@Value(\"\${app.mail.from}\")\nprivate String from;" },
    { label: "Build jar", code: "./mvnw clean package" },
    { label: "Run jar", code: "java -jar target/users-api-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod" },
    { label: "Docker image", code: "./mvnw spring-boot:build-image -Dspring-boot.build-image.imageName=acme/users-api:1.0" }
  ]
});
