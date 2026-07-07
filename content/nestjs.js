(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "nestjs",
  name: "NestJS",
  language: "TypeScript",
  tagline: "Opinionated, **Angular-inspired** Node framework: modules, DI, and decorators with a full request lifecycle (guards, interceptors, pipes, filters).",
  color: "#e0234e",
  readMinutes: 21,
  group: "TypeScript",

  sections: [
    {
      id: "overview",
      title: "Overview & mental model",
      level: "core",
      body: [
        { type: "p", text: "Nest is a structured layer over Express (or Fastify). Its core idea is **modularity + dependency injection**: you build feature **modules** that expose **controllers** (HTTP) and **providers** (services/logic). Everything is wired with an IoC container." },
        { type: "list", items: [
          "**Controllers** handle routes; **Services (providers)** hold business logic; **Modules** group them.",
          "Heavy use of **decorators** (`@Controller`, `@Injectable`, `@Get`) — needs `experimentalDecorators` **and** `emitDecoratorMetadata` in tsconfig (the CLI sets both; the latter is what powers constructor-based DI and `class-validator`).",
          "Same code runs on **Express** or **Fastify** adapters.",
          "**Reach for it when:** you want structure, testability and enterprise conventions out of the box."
        ] }
      ]
    },
    {
      id: "setup",
      title: "Project setup",
      level: "core",
      body: [
        { type: "code", lang: "bash", code: "npm i -g @nestjs/cli\nnest new my-app          # scaffolds project + testing + tsconfig\ncd my-app && npm run start:dev   # watch mode\n\n# generators (schematics) — the real productivity boost:\nnest g module users\nnest g controller users\nnest g service users\nnest g resource users    # CRUD controller+service+DTOs+module in one shot" },
        { type: "callout", variant: "tip", text: "`nest g resource` scaffolds a full REST (or GraphQL) CRUD resource with DTOs — the fastest way to start a feature." }
      ]
    },
    {
      id: "building-blocks",
      title: "Controllers, providers & modules",
      level: "core",
      body: [
        { type: "code", lang: "ts", code: "// users.service.ts\nimport { Injectable } from '@nestjs/common';\n\n@Injectable()\nexport class UsersService {\n  private users = [{ id: 1, name: 'Ada' }];\n  findAll() { return this.users; }\n  findOne(id: number) { return this.users.find(u => u.id === id); }\n}" },
        { type: "code", lang: "ts", code: "// users.controller.ts\nimport { Controller, Get, Param, Post, Body } from '@nestjs/common';\nimport { UsersService } from './users.service';\n\n@Controller('users')                 // route prefix /users\nexport class UsersController {\n  constructor(private readonly users: UsersService) {}   // DI via constructor\n\n  @Get()\n  findAll() { return this.users.findAll(); }\n\n  @Get(':id')\n  findOne(@Param('id') id: string) { return this.users.findOne(+id); }\n\n  @Post()\n  create(@Body() dto: CreateUserDto) { return dto; }\n}" },
        { type: "code", lang: "ts", code: "// users.module.ts\nimport { Module } from '@nestjs/common';\nimport { UsersController } from './users.controller';\nimport { UsersService } from './users.service';\n\n@Module({\n  controllers: [UsersController],\n  providers: [UsersService],\n  exports: [UsersService],   // make it injectable in other modules\n})\nexport class UsersModule {}" },
        { type: "callout", variant: "gotcha", text: "A provider is only injectable where it's **provided or exported+imported**. \"Nest can't resolve dependencies\" almost always means you forgot to add it to a module's `providers` or `exports`." }
      ]
    },
    {
      id: "params",
      title: "Params, query, body & the param decorators",
      level: "core",
      body: [
        { type: "table", headers: ["Decorator", "Reads"], rows: [
          ["`@Param('id')`", "route param `/users/:id`"],
          ["`@Query('q')`", "query string `?q=`"],
          ["`@Body()`", "request body (full or a field)"],
          ["`@Headers()`, `@Req()`, `@Res()`", "headers / raw request / response"],
          ["`@HttpCode(204)`", "override status code"]
        ] },
        { type: "callout", variant: "gotcha", text: "If you inject `@Res()` you take over the response and Nest **stops** auto-serializing the return value. Prefer returning objects; use `@Res({ passthrough: true })` if you only need to set a header/cookie." }
      ]
    },
    {
      id: "validation",
      title: "DTOs, Pipes & validation",
      level: "core",
      body: [
        { type: "p", text: "**Pipes** transform/validate incoming data. The standard combo is `ValidationPipe` + `class-validator` decorators on **DTO** classes." },
        { type: "code", lang: "bash", code: "npm i class-validator class-transformer" },
        { type: "code", lang: "ts", code: "// create-user.dto.ts\nimport { IsEmail, IsInt, Min, Length } from 'class-validator';\n\nexport class CreateUserDto {\n  @IsEmail() email: string;\n  @Length(1, 80) name: string;\n  @IsInt() @Min(0) age: number;\n}" },
        { type: "code", lang: "ts", code: "// main.ts — enable globally\napp.useGlobalPipes(new ValidationPipe({\n  whitelist: true,           // strip properties not in the DTO\n  forbidNonWhitelisted: true,// 400 if extra props present\n  transform: true,           // convert payloads to DTO instances + coerce types\n}));" },
        { type: "callout", variant: "tip", text: "`transform: true` also coerces route params — `@Param('id') id: number` becomes a real number. Without it, params are always strings." },
        { type: "p", text: "Built-in pipes for one-off parsing: `@Param('id', ParseIntPipe)`, `ParseUUIDPipe`, `ParseBoolPipe`, `DefaultValuePipe`." }
      ]
    },
    {
      id: "lifecycle",
      title: "The request lifecycle (signature feature)",
      level: "core",
      body: [
        { type: "p", text: "This is what makes Nest *Nest*. A request flows through these stages, each pluggable:" },
        { type: "code", lang: "text", code: "Request\n  -> Middleware\n  -> Guards          (can I proceed? auth/roles)\n  -> Interceptors    (before)\n  -> Pipes           (validate/transform args)\n  -> Route Handler\n  -> Interceptors    (after — transform response)\n  -> Exception Filters (on throw)\nResponse" },
        { type: "table", headers: ["Concern", "Use"], rows: [
          ["Auth / permissions", "**Guard**"],
          ["Transform/wrap responses, logging, caching, timeouts", "**Interceptor**"],
          ["Validate / coerce input", "**Pipe**"],
          ["Catch & shape errors", "**Exception Filter**"],
          ["Raw req/res access, cross-cutting setup", "**Middleware**"]
        ] }
      ]
    },
    {
      id: "guards",
      title: "Guards (auth & roles)",
      level: "core",
      body: [
        { type: "p", text: "A guard returns `true`/`false` (or throws) to allow/deny a route. Combine with custom decorators + metadata for role checks." },
        { type: "code", lang: "ts", code: "@Injectable()\nexport class AuthGuard implements CanActivate {\n  canActivate(ctx: ExecutionContext): boolean {\n    const req = ctx.switchToHttp().getRequest();\n    return Boolean(req.headers.authorization);  // verify token here\n  }\n}\n\n// apply: @UseGuards(AuthGuard) on a method, controller, or globally\n@UseGuards(AuthGuard)\n@Get('secret')\nsecret() { return 'ok'; }" },
        { type: "code", lang: "ts", code: "// Roles via metadata + Reflector\nexport const Roles = (...roles: string[]) => SetMetadata('roles', roles);\n\n@Injectable()\nexport class RolesGuard implements CanActivate {\n  constructor(private reflector: Reflector) {}\n  canActivate(ctx: ExecutionContext) {\n    const roles = this.reflector.get<string[]>('roles', ctx.getHandler());\n    if (!roles) return true;\n    const { user } = ctx.switchToHttp().getRequest();\n    return roles.some(r => user?.roles?.includes(r));\n  }\n}" }
      ]
    },
    {
      id: "interceptors",
      title: "Interceptors & Exception Filters",
      level: "core",
      body: [
        { type: "p", text: "**Interceptors** wrap the handler with RxJS — transform the response, add logging/timing/caching." },
        { type: "code", lang: "ts", code: "@Injectable()\nexport class WrapInterceptor implements NestInterceptor {\n  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {\n    return next.handle().pipe(map(data => ({ data, ok: true })));\n  }\n}" },
        { type: "p", text: "**Exception filters** catch thrown errors and shape the response." },
        { type: "code", lang: "ts", code: "@Catch(HttpException)\nexport class HttpErrorFilter implements ExceptionFilter {\n  catch(exc: HttpException, host: ArgumentsHost) {\n    const res = host.switchToHttp().getResponse();\n    const status = exc.getStatus();\n    res.status(status).json({ error: exc.message, status });\n  }\n}\n\n// throw built-in exceptions anywhere:\nthrow new NotFoundException('User not found');\nthrow new BadRequestException('Invalid');" },
        { type: "callout", variant: "tip", text: "Register any of these globally in `main.ts` (`app.useGlobal...`) or with `APP_GUARD`/`APP_INTERCEPTOR`/`APP_FILTER` provider tokens (which allows DI into them)." }
      ]
    },
    {
      id: "config",
      title: "Configuration & env",
      level: "core",
      body: [
        { type: "code", lang: "bash", code: "npm i @nestjs/config" },
        { type: "code", lang: "ts", code: "// app.module.ts\n@Module({\n  imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' })],\n})\nexport class AppModule {}\n\n// use it (inject ConfigService)\nconstructor(private config: ConfigService) {}\nthis.config.get<string>('DATABASE_URL');" }
      ]
    },
    {
      id: "typeorm",
      title: "ORM option A — TypeORM",
      level: "core",
      body: [
        { type: "p", text: "TypeORM is the classic Nest ORM: decorator-based **entities** + **repositories**." },
        { type: "code", lang: "bash", code: "npm i @nestjs/typeorm typeorm pg" },
        { type: "code", lang: "ts", code: "// user.entity.ts\n@Entity()\nexport class User {\n  @PrimaryGeneratedColumn() id: number;\n  @Column({ unique: true }) email: string;\n  @Column() name: string;\n  @OneToMany(() => Post, p => p.author) posts: Post[];\n}" },
        { type: "code", lang: "ts", code: "// module wiring\n@Module({\n  imports: [\n    TypeOrmModule.forRoot({ type: 'postgres', url: process.env.DATABASE_URL,\n      autoLoadEntities: true, synchronize: false }),\n    TypeOrmModule.forFeature([User]),\n  ],\n})\nexport class AppModule {}\n\n// inject the repository\nconstructor(@InjectRepository(User) private repo: Repository<User>) {}\nawait this.repo.find();\nawait this.repo.save(this.repo.create(dto));\nawait this.repo.findOne({ where: { id }, relations: { posts: true } });" },
        { type: "callout", variant: "warn", text: "Never use `synchronize: true` in production — it auto-alters your schema and can drop columns/data. Use migrations (`typeorm migration:generate`)." }
      ]
    },
    {
      id: "prisma",
      title: "ORM option B — Prisma",
      level: "core",
      body: [
        { type: "p", text: "Prisma is increasingly the default for new Nest apps: a typed schema, generated client, great DX. Wrap `PrismaClient` in an injectable service." },
        { type: "code", lang: "bash", code: "npm i prisma -D && npm i @prisma/client\nnpx prisma init" },
        { type: "code", lang: "text", code: "// schema.prisma\nmodel User {\n  id    Int    @id @default(autoincrement())\n  email String @unique\n  name  String\n  posts Post[]\n}" },
        { type: "code", lang: "ts", code: "// prisma.service.ts\n@Injectable()\nexport class PrismaService extends PrismaClient implements OnModuleInit {\n  async onModuleInit() { await this.$connect(); }\n}\n\n// usage\nconstructor(private prisma: PrismaService) {}\nawait this.prisma.user.findMany({ include: { posts: true } });\nawait this.prisma.user.create({ data: dto });" },
        { type: "code", lang: "bash", code: "npx prisma migrate dev --name init   # create + apply migration\nnpx prisma studio                    # GUI data browser" }
      ]
    },
    {
      id: "auth",
      title: "Auth — Passport + JWT",
      level: "core",
      body: [
        { type: "code", lang: "bash", code: "npm i @nestjs/passport passport @nestjs/jwt passport-jwt\nnpm i -D @types/passport-jwt" },
        { type: "code", lang: "ts", code: "// jwt.strategy.ts\n@Injectable()\nexport class JwtStrategy extends PassportStrategy(Strategy) {\n  constructor() {\n    super({\n      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),\n      secretOrKey: process.env.JWT_SECRET,\n    });\n  }\n  validate(payload: any) { return { userId: payload.sub, email: payload.email }; }\n}\n\n// protect routes with the passport guard\n@UseGuards(AuthGuard('jwt'))\n@Get('profile')\nprofile(@Req() req) { return req.user; }" },
        { type: "p", text: "Wire up `JwtModule` and issue a token in your login handler after verifying the password:" },
        { type: "code", lang: "ts", code: "// auth.module.ts\n@Module({\n  imports: [\n    JwtModule.register({\n      secret: process.env.JWT_SECRET,\n      signOptions: { expiresIn: '30m' },\n    }),\n  ],\n  providers: [AuthService, JwtStrategy],\n})\nexport class AuthModule {}\n\n// auth.service.ts — issue a token after verifying the password\nasync login(user: { id: number; email: string }) {\n  const payload = { sub: user.id, email: user.email };\n  return { access_token: await this.jwt.signAsync(payload) };\n}" }
      ]
    },
    {
      id: "swagger",
      title: "OpenAPI / Swagger",
      level: "deep",
      body: [
        { type: "code", lang: "bash", code: "npm i @nestjs/swagger" },
        { type: "code", lang: "ts", code: "// main.ts — build the OpenAPI spec and mount Swagger UI\nimport { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';\n\nconst config = new DocumentBuilder()\n  .setTitle('API')\n  .setVersion('1.0')\n  .addBearerAuth()                 // adds an \"Authorize\" button for JWT\n  .build();\nconst document = SwaggerModule.createDocument(app, config);\nSwaggerModule.setup('docs', app, document);   // interactive UI at GET /docs" },
        { type: "code", lang: "ts", code: "// create-user.dto.ts — decorate DTOs so schemas + examples render\nimport { ApiProperty } from '@nestjs/swagger';\n\nexport class CreateUserDto {\n  @ApiProperty({ example: 'ada@example.com' })\n  email: string;\n\n  @ApiProperty({ example: 'Ada', minLength: 1 })\n  name: string;\n}" },
        { type: "callout", variant: "tip", text: "Add the `@nestjs/swagger` CLI plugin in `nest-cli.json` (`\"plugins\": [\"@nestjs/swagger\"]`) and it infers `@ApiProperty()` from your types automatically — no manual annotation needed." }
      ]
    },
    {
      id: "advanced-di",
      title: "Custom providers & dynamic modules",
      level: "deep",
      body: [
        { type: "p", text: "Providers aren't just classes. You can register values, factories, and aliases with custom tokens." },
        { type: "code", lang: "ts", code: "providers: [\n  { provide: 'CONFIG', useValue: { retries: 3 } },              // value\n  { provide: Logger, useClass: JsonLogger },                     // class\n  { provide: 'ASYNC', useFactory: async () => await connect(),   // factory\n    inject: [ConfigService] },\n]\n// inject a token: constructor(@Inject('CONFIG') private cfg) {}" },
        { type: "p", text: "**Dynamic modules** (`forRoot`/`forRootAsync`) let a module take configuration — the pattern behind `ConfigModule`, `TypeOrmModule`, etc." },
        { type: "callout", variant: "gotcha", text: "**Circular dependencies** between providers/modules need `forwardRef(() => Other)` on both sides. Better: refactor to remove the cycle." }
      ]
    },
    {
      id: "testing",
      title: "Testing",
      level: "deep",
      body: [
        { type: "p", text: "Nest ships with Jest. Build a testing module and override providers with mocks." },
        { type: "code", lang: "ts", code: "const moduleRef = await Test.createTestingModule({\n  controllers: [UsersController],\n  providers: [{ provide: UsersService, useValue: { findAll: () => [] } }],\n}).compile();\n\nconst controller = moduleRef.get(UsersController);\nexpect(controller.findAll()).toEqual([]);\n// e2e: use supertest against app.getHttpServer()" }
      ]
    },
    {
      id: "misc",
      title: "Lifecycle hooks & other features",
      level: "deep",
      body: [
        { type: "list", items: [
          "**Lifecycle hooks:** `OnModuleInit`, `OnApplicationBootstrap`, `OnModuleDestroy` for setup/teardown.",
          "**Provider scope:** default is singleton; `Scope.REQUEST` creates per-request instances (slower — avoid unless needed).",
          "**Microservices** (`@nestjs/microservices`): TCP/Redis/NATS/Kafka transports with `@MessagePattern`.",
          "**Scheduling** (`@nestjs/schedule`): `@Cron`, `@Interval` decorators.",
          "**Caching** (`@nestjs/cache-manager`), **rate limiting** (`@nestjs/throttler`)."
        ] },
        { type: "link", url: "https://docs.nestjs.com/fundamentals/injection-scopes", text: "Nest docs — injection scopes (when REQUEST scope bites you)" }
      ]
    },
    {
      id: "headaches",
      title: "Common headaches & how to handle them",
      level: "deep",
      body: [
        { type: "p", text: "Nest's DI and lifecycle are powerful but produce a handful of famously confusing errors. Here are the ones you'll actually hit, and how to fix them." },

        { type: "heading", text: "\"Nest can't resolve dependencies of X (?)\"" },
        { type: "p", text: "The `(?)` marks the exact constructor argument Nest couldn't provide. The **module encapsulation rule**: a provider is private to its module unless you `exports` it, and you can only inject it elsewhere if you `imports` the module that exports it. So this error means one of: it isn't in any `providers`, it's provided but not `exports`ed, or the consuming module never `imports` the owner." },
        { type: "code", lang: "text", code: "Nest can't resolve dependencies of the OrdersService (?).\nPlease make sure that the argument UsersService at index [0] is\navailable in the OrdersModule context." },
        { type: "code", lang: "ts", code: "// users.module.ts — the OWNER must leak the provider\n@Module({\n  providers: [UsersService],\n  exports: [UsersService],      // <-- without this it stays private\n})\nexport class UsersModule {}\n\n// orders.module.ts — the CONSUMER must import the owner\n@Module({\n  imports: [UsersModule],       // <-- brings in whatever UsersModule exports\n  providers: [OrdersService],   // can now inject UsersService\n})\nexport class OrdersModule {}" },
        { type: "callout", variant: "gotcha", text: "Re-`providers`ing the same class in two modules gives you **two separate instances** (two singletons), not a shared one. To share state, provide it once and `exports` it — don't copy it into `providers` everywhere." },

        { type: "heading", text: "Circular dependencies" },
        { type: "p", text: "When A needs B and B needs A, Nest can't decide which to construct first — you get an error or a silently `undefined` injected dependency. The escape hatch is `forwardRef()` on **both** sides; the real fix is to break the cycle (extract the shared logic into a third provider/module)." },
        { type: "code", lang: "ts", code: "// a.service.ts\n@Injectable()\nexport class AService {\n  constructor(@Inject(forwardRef(() => BService)) private b: BService) {}\n}\n\n// b.service.ts\n@Injectable()\nexport class BService {\n  constructor(@Inject(forwardRef(() => AService)) private a: AService) {}\n}\n\n// module-level cycles need forwardRef in imports on both modules:\n@Module({ imports: [forwardRef(() => BModule)] })\nexport class AModule {}" },
        { type: "callout", variant: "warn", text: "`forwardRef()` is a code smell, not a solution. If A and B call each other, extract the shared piece into a `CommonModule` both depend on — the cycle disappears and testing gets easier." },

        { type: "heading", text: "Injection scopes bubble up" },
        { type: "p", text: "Providers are **singletons** by default (one instance for the app's lifetime). Marking one `Scope.REQUEST` makes it per-request — but the cost is contagious: any provider that injects a request-scoped provider becomes request-scoped too, and so does the controller above it. The whole chain is re-instantiated on every request." },
        { type: "code", lang: "ts", code: "@Injectable({ scope: Scope.REQUEST })\nexport class RequestContext { /* holds per-request data */ }\n\n// OrdersService is now EFFECTIVELY request-scoped via bubbling,\n// even though it isn't annotated — and so is any controller that injects it.\n@Injectable()\nexport class OrdersService {\n  constructor(private ctx: RequestContext) {}\n}" },
        { type: "callout", variant: "tip", text: "Use `Scope.REQUEST` sparingly. For per-request data prefer `AsyncLocalStorage` (via `nestjs-cls`) or just pass the request object — you keep singleton performance. Note: request-scoped providers also can't be injected into other request-scoped-incompatible spots like a `Scope.DEFAULT` cron handler cleanly." },

        { type: "heading", text: "Validation & serialization must be wired up" },
        { type: "p", text: "`ValidationPipe` and `@Exclude()` do **nothing** until you register them. Validation needs the pipe registered globally *and* `class-validator`/`class-transformer` installed; hiding fields needs `ClassSerializerInterceptor`." },
        { type: "code", lang: "ts", code: "// Option A — main.ts (simple, but not DI-aware)\napp.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));\n\n// Option B — app.module.ts (DI-friendly, testable, overridable per module)\nimport { APP_PIPE, APP_INTERCEPTOR } from '@nestjs/core';\n@Module({\n  providers: [\n    { provide: APP_PIPE, useClass: ValidationPipe },\n    // needed for @Exclude()/@Expose() to take effect on responses:\n    { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },\n  ],\n})\nexport class AppModule {}" },
        { type: "code", lang: "ts", code: "// user.entity.ts — @Exclude only works when ClassSerializerInterceptor runs\nimport { Exclude } from 'class-transformer';\nexport class User {\n  id: number;\n  email: string;\n  @Exclude() password: string;   // stripped from JSON responses\n}" },
        { type: "callout", variant: "gotcha", text: "`ClassSerializerInterceptor` only transforms **class instances**. If you return a plain object (or a raw TypeORM/Prisma result that isn't the decorated class), `@Exclude()` is ignored and the password leaks. Return `new User(...)` / `plainToInstance(User, row)`." },

        { type: "heading", text: "Async config & ordering" },
        { type: "p", text: "`ConfigModule.forRoot({ isGlobal: true })` makes `ConfigService` available everywhere without re-importing. When another module needs config values **at setup time** (like a DB URL), use `forRootAsync` with `useFactory` + `inject` so the factory runs after `ConfigService` exists." },
        { type: "code", lang: "ts", code: "@Module({\n  imports: [\n    ConfigModule.forRoot({ isGlobal: true }),   // load .env once, app-wide\n    // forRootAsync: the factory runs AFTER ConfigService is ready\n    TypeOrmModule.forRootAsync({\n      inject: [ConfigService],\n      useFactory: (config: ConfigService) => ({\n        type: 'postgres',\n        url: config.get<string>('DATABASE_URL'),\n        autoLoadEntities: true,\n        synchronize: false,\n      }),\n    }),\n  ],\n})\nexport class AppModule {}" },
        { type: "callout", variant: "warn", text: "Don't read `process.env` (or `ConfigService`) at module **import** time or in field initializers — it may run before `.env` is loaded. Read config inside `useFactory`, a constructor, or `onModuleInit`, never at file top-level." },

        { type: "heading", text: "ORM registration & the N+1 trap" },
        { type: "p", text: "TypeORM needs each entity registered with `TypeOrmModule.forFeature([...])` in the module that injects its repository — forget it and you get another \"can't resolve dependencies\" for the repository token. Both ORMs also make it trivially easy to fire an N+1 query." },
        { type: "code", lang: "ts", code: "// N+1: 1 query for users, then 1 MORE per user for their posts\nconst users = await this.repo.find();\nfor (const u of users) {\n  const posts = await u.posts;   // lazy relation -> a query each iteration\n}\n\n// Fix: eager-load in a single joined query\nawait this.repo.find({ relations: { posts: true } });          // TypeORM\nawait this.prisma.user.findMany({ include: { posts: true } }); // Prisma" },
        { type: "callout", variant: "tip", text: "Register repositories per-feature: `TypeOrmModule.forFeature([User])` in `UsersModule`. The repository is only injectable in modules that ran `forFeature` for that entity." },

        { type: "heading", text: "Which layer catches what? (execution order)" },
        { type: "p", text: "Guards, interceptors, pipes and filters look similar but run at fixed points. Picking the wrong one is a common source of \"my code never runs\" bugs — e.g. a guard can't see the validated/transformed DTO because **pipes run after guards**." },
        { type: "table", headers: ["Order", "Stage", "Job", "Sees validated body?"], rows: [
          ["1", "Middleware", "Raw req/res, framework-level setup", "no"],
          ["2", "Guards", "Allow/deny (auth, roles) — return bool or throw", "no"],
          ["3", "Interceptors (pre)", "Wrap handler: start timers, logging, caching", "no"],
          ["4", "Pipes", "Validate & transform handler arguments", "produces it"],
          ["5", "Route handler", "Your controller method runs", "yes"],
          ["6", "Interceptors (post)", "Map/wrap the response, timeouts", "n/a"],
          ["7", "Exception filters", "Catch anything thrown above & shape the error", "n/a"]
        ] },
        { type: "callout", variant: "note", text: "Because pipes run **after** guards, do authorization on the raw request in a guard, not on a validated DTO. And because filters sit outermost, a thrown `ForbiddenException` from a guard is still caught and formatted by your global exception filter." }
      ]
    }
  ],

  packages: [
    { name: "@nestjs/config", why: "typed env config" },
    { name: "@nestjs/typeorm + typeorm", why: "TypeORM integration" },
    { name: "prisma + @prisma/client", why: "Prisma ORM (modern default)" },
    { name: "class-validator", why: "DTO validation decorators" },
    { name: "class-transformer", why: "payload <-> class instances" },
    { name: "@nestjs/passport + passport-jwt", why: "auth strategies" },
    { name: "@nestjs/jwt", why: "sign/verify JWTs" },
    { name: "@nestjs/swagger", why: "OpenAPI docs" },
    { name: "@nestjs/throttler", why: "rate limiting" },
    { name: "@nestjs/schedule", why: "cron jobs" }
  ],

  gotchas: [
    "\"Nest can't resolve dependencies of X\" = the provider isn't in `providers`, or not `exported` from the module you imported.",
    "Injecting `@Res()` disables auto-serialization; use `@Res({ passthrough: true })` if you only need to tweak headers/cookies.",
    "`ValidationPipe` does nothing without `transform: true` for type coercion, and `whitelist: true` to strip unknown props.",
    "TypeORM `synchronize: true` in prod can silently drop columns — always use migrations.",
    "Circular deps require `forwardRef()` on both sides — usually a sign to restructure.",
    "REQUEST-scoped providers make everything that depends on them request-scoped too (perf hit).",
    "The `(?)` in a resolve error points at the exact unprovided constructor arg — check the OWNER `exports` it and the CONSUMER `imports` that module.",
    "`@Exclude()` silently leaks fields unless `ClassSerializerInterceptor` runs AND you return a real class instance (not a plain object / raw ORM row).",
    "Don't read `ConfigService`/`process.env` at module import or field-init time — use `forRootAsync` `useFactory` or `onModuleInit` so `.env` is loaded first."
  ],

  flashcards: [
    { q: "What are the three core building blocks of a Nest feature?", a: "**Module** (groups things), **Controller** (handles routes), **Provider/Service** (business logic, injected via DI)." },
    { q: "Order of the request lifecycle stages?", a: "Middleware → Guards → Interceptors(before) → Pipes → Handler → Interceptors(after) → Exception Filters." },
    { q: "Which building block handles authorization?", a: "A **Guard** (`canActivate` returns true/false or throws)." },
    { q: "Which handles transforming/wrapping the response or logging/caching?", a: "An **Interceptor** (wraps the handler with an RxJS stream)." },
    { q: "Which validates/coerces incoming arguments?", a: "A **Pipe** (e.g. `ValidationPipe`, `ParseIntPipe`)." },
    { q: "What two options make `ValidationPipe` strict + type-correct?", a: "`whitelist: true` (strip unknown props) and `transform: true` (coerce to DTO types)." },
    { q: "How do you make a provider available to another module?", a: "Add it to `exports` of its module, and `imports` that module where needed." },
    { q: "Why avoid TypeORM `synchronize: true` in production?", a: "It auto-alters the schema on boot and can drop columns/data — use migrations instead." },
    { q: "How do you resolve a circular dependency between two providers?", a: "Wrap each reference in `forwardRef(() => Other)` — or refactor to remove the cycle." },
    { q: "Why can a Guard not read your validated DTO?", a: "Pipes (which validate/transform) run **after** guards. Do auth on the raw request in the guard; the transformed body only exists by the time the handler runs." },
    { q: "Why does marking one provider `Scope.REQUEST` slow down a whole controller?", a: "Scope **bubbles up**: anything that injects a request-scoped provider becomes request-scoped too, so the entire chain (up to the controller) is re-instantiated on every request." }
  ],

  cheatsheet: [
    { label: "New project", code: "nest new my-app" },
    { label: "Scaffold CRUD", code: "nest g resource users" },
    { label: "Watch mode", code: "npm run start:dev" },
    { label: "Route param", code: "@Param('id') id: string" },
    { label: "Protect route", code: "@UseGuards(AuthGuard('jwt'))" },
    { label: "Global pipe", code: "app.useGlobalPipes(new ValidationPipe())" },
    { label: "Inject repo", code: "@InjectRepository(User) repo: Repository<User>" },
    { label: "Prisma migrate", code: "npx prisma migrate dev" },
    { label: "Export a provider", code: "@Module({ providers: [X], exports: [X] })" },
    { label: "Break a DI cycle", code: "@Inject(forwardRef(() => Other))" }
  ]
});
