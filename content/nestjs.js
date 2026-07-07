(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "nestjs",
  name: "NestJS",
  language: "TypeScript",
  tagline: "Opinionated, **Angular-inspired** Node framework: modules, DI, and decorators with a full request lifecycle (guards, interceptors, pipes, filters).",
  color: "#e0234e",
  readMinutes: 18,

  sections: [
    {
      id: "overview",
      title: "Overview & mental model",
      level: "core",
      body: [
        { type: "p", text: "Nest is a structured layer over Express (or Fastify). Its core idea is **modularity + dependency injection**: you build feature **modules** that expose **controllers** (HTTP) and **providers** (services/logic). Everything is wired with an IoC container." },
        { type: "list", items: [
          "**Controllers** handle routes; **Services (providers)** hold business logic; **Modules** group them.",
          "Heavy use of **decorators** (`@Controller`, `@Injectable`, `@Get`) — enable `experimentalDecorators` (the CLI does this).",
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
        { type: "p", text: "Sign tokens with `JwtService` in your login handler after verifying the password (hash with `bcrypt`)." }
      ]
    },
    {
      id: "swagger",
      title: "OpenAPI / Swagger",
      level: "deep",
      body: [
        { type: "code", lang: "bash", code: "npm i @nestjs/swagger" },
        { type: "code", lang: "ts", code: "const config = new DocumentBuilder().setTitle('API').setVersion('1.0').addBearerAuth().build();\nconst doc = SwaggerModule.createDocument(app, config);\nSwaggerModule.setup('docs', app, doc);\n// decorate DTOs with @ApiProperty() for rich schemas" }
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
    "REQUEST-scoped providers make everything that depends on them request-scoped too (perf hit)."
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
    { q: "How do you resolve a circular dependency between two providers?", a: "Wrap each reference in `forwardRef(() => Other)` — or refactor to remove the cycle." }
  ],

  cheatsheet: [
    { label: "New project", code: "nest new my-app" },
    { label: "Scaffold CRUD", code: "nest g resource users" },
    { label: "Watch mode", code: "npm run start:dev" },
    { label: "Route param", code: "@Param('id') id: string" },
    { label: "Protect route", code: "@UseGuards(AuthGuard('jwt'))" },
    { label: "Global pipe", code: "app.useGlobalPipes(new ValidationPipe())" },
    { label: "Inject repo", code: "@InjectRepository(User) repo: Repository<User>" },
    { label: "Prisma migrate", code: "npx prisma migrate dev" }
  ]
});
