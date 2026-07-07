(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "cpp-qt",
  name: "Qt",
  language: "C++ · Qt",
  tagline: "The cross-platform C++ framework — **signals & slots**, a rich object model, Widgets **and** QML for building native GUIs, plus batteries-included core, network and concurrency modules.",
  color: "#41CD52",
  group: "C++",
  readMinutes: 42,

  sections: [
    {
      id: "overview",
      title: "Overview & when to use",
      level: "core",
      body: [
        { type: "p", text: "Qt is a mature, cross-platform C++ framework: one codebase runs on Windows, macOS, Linux, Android, iOS and embedded. It is far more than a GUI toolkit — `QtCore` gives you strings, containers, files, threads, JSON and an event loop, so many Qt programs use very little of the standard library." },
        { type: "p", text: "The defining feature is the **object model** built on `QObject`: a meta-object system that adds **signals & slots** (type-safe callbacks), runtime introspection, properties and parent-child memory management on top of plain C++." },
        { type: "list", items: [
          "**Two GUI stacks:** **Qt Widgets** (classic, C++-first, desktop-native controls) and **Qt Quick / QML** (a declarative language for fluid, animated, touch-friendly UIs).",
          "**Reach for it when:** you want a single native C++ desktop/embedded app across OSes, need a deep widget set, or want a hardware-accelerated animated UI (QML).",
          "**Strengths:** stability, documentation, tooling (Qt Creator, Designer), a huge module set, and long-term-support releases.",
          "**Mental model:** you compose a tree of `QObject`s, wire them together with `connect()`, and let the **event loop** drive everything."
        ] },
        { type: "table", headers: ["Choose", "When"], rows: [
          ["**Qt Widgets**", "Desktop tools, dense forms, native look, C++-only teams, existing Widgets code."],
          ["**Qt Quick (QML)**", "Animated/touch UIs, embedded HMIs, designer-driven UI, custom-look apps."],
          ["**Both**", "QML front-end with a C++ engine, or Widgets host embedding a `QQuickWidget`."]
        ] },
        { type: "heading", text: "Modules" },
        { type: "p", text: "Qt is split into modules. The essentials ship with every install; add-ons are opt-in. Key ones: `Core`, `Gui`, `Widgets`, `Qml`/`Quick`, `Network`, `Concurrent`, `Sql`, `Test`, plus add-ons like `Multimedia`, `WebEngine`, `Charts`, `Bluetooth`, `SerialPort`." },
        { type: "heading", text: "Licensing (read this before shipping)" },
        { type: "list", items: [
          "Qt is **dual-licensed**: open-source (**LGPLv3** / **GPL**) or **commercial**.",
          "**LGPLv3** lets you keep your app closed-source *if* you dynamically link Qt and let users relink a modified Qt — practical for most apps that use `.dll`/`.so` Qt libraries.",
          "Some modules are **GPL-only** for open-source users (e.g. Qt Charts, Data Visualization, Virtual Keyboard, Wayland Compositor) — using them under open source forces your app to GPL.",
          "**Commercial** license removes LGPL/GPL obligations (static linking, no relinking clause) and is required for many embedded/proprietary scenarios."
        ] },
        { type: "callout", variant: "note", text: "This guide targets **Qt 6** (current series is 6.11, March 2026). The **LTS** releases are **6.2, 6.5, 6.8 and 6.11** — 6.9 and 6.10 are regular (non-LTS) releases, so prefer an LTS for long-lived projects. Qt 6 requires a **C++17** compiler and uses **CMake** as the recommended build system." }
      ]
    },
    {
      id: "setup",
      title: "Install, build & toolchain",
      level: "core",
      body: [
        { type: "p", text: "There are several ways to get Qt 6." },
        { type: "list", items: [
          "**Official online installer** — the GUI installer from qt.io; pick modules/versions, includes **Qt Creator** IDE. Needs a (free) Qt account.",
          "**aqtinstall** (`aqt`) — a scriptable, account-free CLI installer, great for CI.",
          "**Distro / package manager** — `apt install qt6-base-dev`, Homebrew `brew install qt`, vcpkg `vcpkg install qtbase`, or Conan.",
        ] },
        { type: "code", lang: "bash", code: "# scriptable install (no Qt account) via aqt\npip install aqtinstall\naqt install-qt linux desktop 6.9.0 linux_gcc_64 -m qtcharts qtquick3d\n\n# or Debian/Ubuntu system packages\nsudo apt install qt6-base-dev qt6-declarative-dev cmake ninja-build\n\n# or macOS\nbrew install qt cmake ninja" },
        { type: "heading", text: "Modern build: CMake" },
        { type: "p", text: "CMake is the recommended build system for Qt 6. `find_package(Qt6 ...)` locates Qt; `qt_standard_project_setup()` turns on the code generators (AUTOMOC/AUTOUIC/AUTORCC); `qt_add_executable()` wraps `add_executable()` with Qt-specific finalization." },
        { type: "code", lang: "cmake", code: "cmake_minimum_required(VERSION 3.16)\nproject(MyApp VERSION 1.0 LANGUAGES CXX)\n\nset(CMAKE_CXX_STANDARD 17)\nset(CMAKE_CXX_STANDARD_REQUIRED ON)\n\n# find the modules you use (Core is implicit)\nfind_package(Qt6 REQUIRED COMPONENTS Widgets Network)\n\nqt_standard_project_setup()          # enables AUTOMOC/AUTOUIC/AUTORCC\n\nqt_add_executable(MyApp\n    main.cpp\n    mainwindow.cpp mainwindow.h\n    mainwindow.ui                    # uic compiles this\n    resources.qrc                    # rcc embeds this\n)\n\ntarget_link_libraries(MyApp PRIVATE Qt6::Widgets Qt6::Network)" },
        { type: "code", lang: "bash", code: "# configure + build out-of-source\ncmake -S . -B build -G Ninja -DCMAKE_PREFIX_PATH=/path/to/Qt/6.9.0/gcc_64\ncmake --build build\n./build/MyApp" },
        { type: "callout", variant: "tip", text: "`CMAKE_PREFIX_PATH` (or the `Qt6_DIR` cache var) tells CMake where Qt lives. Qt Creator sets this automatically when you pick a **Kit**." },
        { type: "heading", text: "Legacy build: qmake" },
        { type: "p", text: "Older projects use **qmake** with a `.pro` file. It still works in Qt 6 but is in maintenance mode — new projects should use CMake." },
        { type: "code", lang: "bash", code: "# app.pro (legacy)\n#   QT += widgets network\n#   CONFIG += c++17\n#   SOURCES += main.cpp mainwindow.cpp\n#   HEADERS += mainwindow.h\n#   FORMS   += mainwindow.ui\nqmake && make" },
        { type: "heading", text: "The code generators (MOC / uic / rcc)" },
        { type: "p", text: "Qt adds capabilities C++ lacks by running source generators *before* the compiler. CMake's AUTO* features run them for you." },
        { type: "table", headers: ["Tool", "Input", "Produces", "Why"], rows: [
          ["**moc** (Meta-Object Compiler)", "headers with `Q_OBJECT`", "`moc_*.cpp`", "Implements signals/slots, properties, introspection."],
          ["**uic** (UI Compiler)", "`.ui` (Qt Designer)", "`ui_*.h`", "Turns a designed form into C++ that builds the widgets."],
          ["**rcc** (Resource Compiler)", "`.qrc`", "compiled-in bytes", "Embeds files (icons, QML, translations) into the binary."],
          ["**qmltyperegistrar / qmlcachegen**", "QML + C++ types", "registration + cache", "Registers C++ types for QML and precompiles QML."]
        ] },
        { type: "callout", variant: "note", text: "**Qt Creator** is the first-party IDE: integrated Designer, QML editor, debugger, profiler and CMake/qmake support. Qt also works fine in VS Code / CLion / Visual Studio via CMake." }
      ]
    },
    {
      id: "object-model",
      title: "The QObject model & memory",
      level: "core",
      body: [
        { type: "p", text: "`QObject` is the base class for almost everything with identity in Qt. Deriving from it and adding the `Q_OBJECT` macro opts a class into the meta-object system: signals, slots, properties, `tr()`, and `qobject_cast`." },
        { type: "code", lang: "cpp", code: "#include <QObject>\n\nclass Worker : public QObject {\n    Q_OBJECT                       // MUST be present for signals/slots/properties\npublic:\n    explicit Worker(QObject *parent = nullptr) : QObject(parent) {}\n\nsignals:\n    void progress(int percent);    // declared, never defined — moc implements it\n\npublic slots:\n    void start();                  // an ordinary member function you can also connect to\n};" },
        { type: "callout", variant: "gotcha", text: "`Q_OBJECT` **requires moc to run on that header**. If you get `undefined reference to vtable` or missing signal symbols, moc did not process the class — usually because `Q_OBJECT` is in a `.cpp`, the class isn't in a header CMake sees, or you forgot to re-run CMake after adding it." },
        { type: "heading", text: "Object trees & ownership" },
        { type: "p", text: "Every `QObject` can have a **parent** and many **children**. When a parent is destroyed, it deletes all its children automatically. This parent-child tree is Qt's core memory-management strategy — you allocate widgets with `new`, hand them a parent, and never manually `delete` them." },
        { type: "code", lang: "cpp", code: "auto *window = new QWidget;              // no parent -> you own it\nauto *layout = new QVBoxLayout(window);  // parented to window\nauto *button = new QPushButton(\"OK\");\nlayout->addWidget(button);               // reparents button under window\n// deleting `window` deletes layout + button too. No leaks, no manual delete." },
        { type: "callout", variant: "tip", text: "Rule of thumb: if a `QObject` has a parent, the parent owns it — do **not** put it in a `unique_ptr` or `delete` it yourself. For top-level objects with no parent, use a smart pointer or `deleteLater()`." },
        { type: "heading", text: "QObject is not copyable" },
        { type: "p", text: "`QObject` has its copy constructor and assignment **disabled** — identity, parentage and connections can't be meaningfully copied. Pass `QObject`s by **pointer or reference**, never by value. (Qt's *value* types like `QString` are a different story — see below.)" },
        { type: "code", lang: "cpp", code: "void take(QObject obj);      // COMPILE ERROR: QObject is non-copyable\nvoid take(QObject *obj);     // OK - pass by pointer\nvoid take(QObject &obj);     // OK - pass by reference" },
        { type: "callout", variant: "warn", text: "A `QObject` should be used only in the thread that created it (its **thread affinity**). Creating/using widgets off the GUI thread is undefined behaviour — see the concurrency section." }
      ]
    },
    {
      id: "signals-slots",
      title: "Signals & slots (the signature feature)",
      level: "core",
      body: [
        { type: "p", text: "Signals & slots are Qt's type-safe observer mechanism. An object **emits a signal** when something happens; any number of **slots** (ordinary functions, member functions or lambdas) connected to it are called. The sender knows nothing about the receivers — loose coupling by design." },
        { type: "heading", text: "The modern connect() syntax (pointer-to-member)" },
        { type: "p", text: "Prefer the **function-pointer** overload: it is checked at **compile time**, supports lambdas, and allows implicit argument conversions. The old string-based `SIGNAL()/SLOT()` macros are resolved at runtime and only fail with a console warning." },
        { type: "code", lang: "cpp", code: "// GOOD - compile-time checked, refactor-safe\nconnect(button, &QPushButton::clicked,\n        this,   &MyWindow::onClicked);\n\n// Connect to a lambda (great for small handlers, and to capture context)\nconnect(button, &QPushButton::clicked, this, [this]{\n    statusBar()->showMessage(\"Clicked!\");\n});\n\n// Connect a signal straight to another signal (relaying)\nconnect(worker, &Worker::finished, this, &MyWindow::allDone);\n\n// LEGACY - runtime string matching, avoid in new code\nconnect(button, SIGNAL(clicked()), this, SLOT(onClicked()));" },
        { type: "callout", variant: "gotcha", text: "When connecting to a lambda, pass a **context `QObject`** (the 3rd arg) so the connection is auto-removed if that object dies. `connect(src, &Src::sig, [captured]{...})` with no context can call into destroyed objects." },
        { type: "heading", text: "Emitting" },
        { type: "code", lang: "cpp", code: "void Worker::start() {\n    for (int i = 0; i <= 100; i += 10) {\n        doChunk();\n        emit progress(i);   // `emit` is just a hint macro (expands to nothing)\n    }\n}" },
        { type: "heading", text: "Connection types & threads" },
        { type: "p", text: "The 5th `connect()` argument controls *how* the slot is invoked. The default, `Qt::AutoConnection`, decides at emit time based on the threads involved." },
        { type: "table", headers: ["Type", "Behaviour"], rows: [
          ["`Qt::AutoConnection` (default)", "Direct if sender & receiver are in the same thread, else Queued."],
          ["`Qt::DirectConnection`", "Slot runs **immediately** in the emitting thread (like a function call)."],
          ["`Qt::QueuedConnection`", "Signal is posted as an event; slot runs later in the **receiver's** thread event loop. Args are copied."],
          ["`Qt::BlockingQueuedConnection`", "Queued, but the emitter **blocks** until the slot returns. Never use when sender==receiver thread (deadlock)."],
          ["`Qt::UniqueConnection` (flag)", "OR-in to refuse duplicate connections."],
          ["`Qt::SingleShotConnection` (flag)", "Auto-disconnect after the first emission (Qt 6.x)."]
        ] },
        { type: "callout", variant: "good", text: "Queued connections are the **safe, idiomatic way to communicate across threads**: a worker on another thread emits a signal, and your GUI slot runs on the GUI thread automatically. Arguments must be copyable and, for custom types, registered with `qRegisterMetaType<T>()`." },
        { type: "p", text: "`connect()` returns a `QMetaObject::Connection`; keep it to `disconnect()` later, or ignore it (connections auto-drop when either object is destroyed)." }
      ]
    },
    {
      id: "core-types",
      title: "Core value types & implicit sharing",
      level: "core",
      body: [
        { type: "p", text: "Qt ships its own value types. Unlike `QObject`s, these are **copyable value classes** that use **implicit sharing** (copy-on-write): copying is cheap (shares a data block + refcount); a deep copy happens only on the first write. Pass them by `const&` for input, return by value freely." },
        { type: "heading", text: "QString" },
        { type: "p", text: "`QString` holds Unicode text (UTF-16 internally). It is not `std::string`: it is Unicode-aware, implicitly shared, and has a huge API. Use `QStringLiteral` for compile-time literals to avoid a runtime allocation." },
        { type: "code", lang: "cpp", code: "QString name = QStringLiteral(\"Ada\");\nQString greet = QString(\"Hello, %1! You are %2.\").arg(name).arg(42);\n\nbool ok;\nint n = QString(\"123\").toInt(&ok);          // parse\nQString s = QString::number(3.14, 'f', 2);   // format -> \"3.14\"\nQStringList parts = greet.split(' ');\n\n// conversions to/from std / bytes\nstd::string std = name.toStdString();\nQString back  = QString::fromStdString(std);\nQByteArray utf8 = name.toUtf8();             // for files/network/C APIs" },
        { type: "callout", variant: "gotcha", text: "Don't implicitly mix `QString` and `const char*`/`std::string`. Use `toUtf8()`/`fromUtf8()` explicitly at boundaries. A raw `\"literal\"` passed where a `QString` is expected does an implicit (Latin-1/UTF-8) conversion that surprises people with non-ASCII text." },
        { type: "heading", text: "QByteArray & QVariant" },
        { type: "list", items: [
          "**`QByteArray`** — raw bytes; the type for binary data, network payloads, file contents, hashing (`QCryptographicHash`).",
          "**`QVariant`** — a type-erased union that can hold almost any Qt/registered type; the currency of properties, models and settings. Use `.value<T>()` / `.toInt()` / `.canConvert<T>()`."
        ] },
        { type: "heading", text: "Containers (Qt 6)" },
        { type: "p", text: "In Qt 6, `QVector` is an alias for **`QList`** — they are the same contiguous, implicitly-shared array. You may prefer STL containers too; Qt APIs mostly take Qt containers." },
        { type: "table", headers: ["Container", "Use"], rows: [
          ["`QList<T>` / `QVector<T>`", "Dynamic contiguous array (unified in Qt 6)."],
          ["`QStringList`", "`QList<QString>` with helpers like `join()`, `filter()`."],
          ["`QMap<K,V>`", "Sorted (tree) associative container."],
          ["`QHash<K,V>`", "Unsorted hash map (faster lookup)."],
          ["`QSet<T>`", "Hash-based set."]
        ] },
        { type: "code", lang: "cpp", code: "QList<int> xs{1, 2, 3};\nxs.append(4);\nfor (int x : xs) use(x);\n\nQHash<QString, int> ages;\nages[\"Ada\"] = 36;\nif (ages.contains(\"Ada\")) qDebug() << ages.value(\"Ada\");\n\n// qDebug() is Qt's stream logger; knows how to print Qt types\nqDebug() << \"list=\" << xs << \"map=\" << ages;" },
        { type: "callout", variant: "warn", text: "Implicit sharing means calling a **non-const** method (or `operator[]`) can trigger a deep copy (a *detach*). Iterating with a mutable iterator, or `for (auto &x : list)`, detaches. This is safe but can be a hidden cost in hot loops — use `const` access (`std::as_const`; the old `qAsConst` is deprecated since 6.6) when you only read." }
      ]
    },
    {
      id: "meta-object",
      title: "The meta-object system: properties, enums, introspection",
      level: "core",
      body: [
        { type: "p", text: "moc generates a `QMetaObject` for every `Q_OBJECT` class, giving runtime reflection: the class name, its signals/slots/properties/enums, and the ability to invoke methods and get/set properties by name. This powers QML bindings, the property editor in Designer, animations and serialization." },
        { type: "heading", text: "Q_PROPERTY" },
        { type: "code", lang: "cpp", code: "class Battery : public QObject {\n    Q_OBJECT\n    Q_PROPERTY(int level READ level WRITE setLevel NOTIFY levelChanged)\npublic:\n    int level() const { return m_level; }\n    void setLevel(int v) {\n        if (v == m_level) return;\n        m_level = v;\n        emit levelChanged(v);      // NOTIFY drives QML bindings & Qt property system\n    }\nsignals:\n    void levelChanged(int);\nprivate:\n    int m_level = 0;\n};" },
        { type: "callout", variant: "tip", text: "A property with `READ`/`WRITE`/`NOTIFY` is directly bindable from QML and animatable with `QPropertyAnimation`. The `NOTIFY` signal is what lets bindings update — always emit it on change." },
        { type: "heading", text: "Q_ENUM & introspection" },
        { type: "code", lang: "cpp", code: "class Light : public QObject {\n    Q_OBJECT\npublic:\n    enum State { Off, On, Blinking };\n    Q_ENUM(State)                 // registers the enum for meta-system + QML + qDebug\n};\n\n// introspection & dynamic invoke\nconst QMetaObject *mo = obj->metaObject();\nqDebug() << mo->className();\nQMetaObject::invokeMethod(obj, \"start\", Qt::QueuedConnection);\nobj->setProperty(\"level\", 80);            // set by name via QVariant\nQVariant v = obj->property(\"level\");" },
        { type: "heading", text: "qobject_cast" },
        { type: "p", text: "`qobject_cast<T*>` is a Qt-aware `dynamic_cast` that uses the meta-object — faster, and works across DLL boundaries where `dynamic_cast` can fail. It returns `nullptr` on mismatch." },
        { type: "code", lang: "cpp", code: "if (auto *btn = qobject_cast<QPushButton*>(sender())) {\n    btn->setText(\"Clicked\");   // sender() gives the emitting object inside a slot\n}" }
      ]
    },
    {
      id: "widgets",
      title: "Qt Widgets: windows, controls & layouts",
      level: "core",
      body: [
        { type: "p", text: "A Widgets app starts with one **`QApplication`** (owns the event loop) and shows one or more top-level `QWidget`s. Widgets nest to form the UI tree; you almost never position them by pixel — you use **layouts**." },
        { type: "code", lang: "cpp", code: "#include <QApplication>\n#include <QPushButton>\n\nint main(int argc, char **argv) {\n    QApplication app(argc, argv);      // exactly one; parses -style etc.\n    QPushButton button(\"Quit\");\n    QObject::connect(&button, &QPushButton::clicked, &app, &QApplication::quit);\n    button.show();\n    return app.exec();                 // enter the event loop; returns on quit\n}" },
        { type: "heading", text: "A main window" },
        { type: "p", text: "`QMainWindow` provides a menu bar, toolbars, dock widgets, a status bar and a central widget — the standard desktop shell." },
        { type: "code", lang: "cpp", code: "class MainWindow : public QMainWindow {\n    Q_OBJECT\npublic:\n    MainWindow() {\n        auto *central = new QWidget(this);\n        auto *layout  = new QVBoxLayout(central);\n        auto *edit    = new QLineEdit;\n        auto *list    = new QListWidget;\n        auto *add     = new QPushButton(\"Add\");\n        layout->addWidget(edit);\n        layout->addWidget(list);\n        layout->addWidget(add);\n        setCentralWidget(central);\n        statusBar()->showMessage(\"Ready\");\n\n        connect(add, &QPushButton::clicked, this, [=]{\n            if (!edit->text().isEmpty()) {\n                list->addItem(edit->text());\n                edit->clear();\n            }\n        });\n    }\n};" },
        { type: "heading", text: "Common widgets" },
        { type: "table", headers: ["Widget", "Purpose"], rows: [
          ["`QLabel`, `QPushButton`, `QCheckBox`, `QRadioButton`", "Static text & buttons."],
          ["`QLineEdit`, `QTextEdit`, `QPlainTextEdit`", "Single-line / rich / plain text input."],
          ["`QComboBox`, `QSpinBox`, `QSlider`, `QDateEdit`", "Value selectors."],
          ["`QListWidget`, `QTableWidget`, `QTreeWidget`", "Convenience item views (data baked in)."],
          ["`QListView`, `QTableView`, `QTreeView`", "Model-driven views (see Model/View)."],
          ["`QTabWidget`, `QStackedWidget`, `QSplitter`, `QScrollArea`", "Containers."],
          ["`QDialog`, `QMessageBox`, `QFileDialog`", "Dialogs (modal via `exec()`)."]
        ] },
        { type: "heading", text: "Layouts" },
        { type: "p", text: "Layouts automatically size and position child widgets and handle window resizing, DPI and translation length changes. Nest them to build any UI." },
        { type: "list", items: [
          "**`QHBoxLayout`** — a horizontal row.",
          "**`QVBoxLayout`** — a vertical column.",
          "**`QGridLayout`** — a grid with row/column spans.",
          "**`QFormLayout`** — label + field rows for forms.",
          "Use `addStretch()`, `setSpacing()`, `setContentsMargins()`, and `setSizePolicy()` on widgets to control growth."
        ] },
        { type: "heading", text: "Qt Designer & .ui files" },
        { type: "p", text: "Design forms visually in **Qt Designer** (standalone or inside Qt Creator). It saves an XML `.ui` file; **uic** compiles it to a `ui_*.h` header exposing a `Ui::Form` struct you populate with `setupUi(this)`." },
        { type: "code", lang: "cpp", code: "#include \"ui_mainwindow.h\"\n\nclass MainWindow : public QMainWindow {\n    Q_OBJECT\npublic:\n    MainWindow() { ui.setupUi(this); }   // builds all designed widgets\nprivate slots:\n    void on_addButton_clicked();          // auto-connected by objectName\nprivate:\n    Ui::MainWindow ui;\n};" },
        { type: "callout", variant: "tip", text: "Qt supports **stylesheets** (a CSS-like syntax) via `widget->setStyleSheet(\"QPushButton { border-radius: 6px; }\")` for custom theming without subclassing." }
      ]
    },
    {
      id: "actions",
      title: "Actions, menus, toolbars & dialogs",
      level: "core",
      body: [
        { type: "p", text: "This is the glue that turns widgets into an actual application. The key abstraction is **`QAction`**: one object representing a user command (its text, icon, shortcut and enabled state). You create the action once and add it to a **menu**, a **toolbar** and a keyboard **shortcut** — all three fire the same `triggered()` signal, so there's a single place to handle \"Save\", \"Open\", etc." },
        { type: "code", lang: "cpp", code: "// one QAction feeds menu + toolbar + shortcut\nauto *openAct = new QAction(QIcon(\":/icons/open.svg\"), tr(\"&Open...\"), this);\nopenAct->setShortcut(QKeySequence::Open);        // portable Ctrl+O / ⌘O\nopenAct->setStatusTip(tr(\"Open a file\"));\nconnect(openAct, &QAction::triggered, this, &MainWindow::openFile);\n\n// build the menu bar (QMainWindow gives you menuBar()/addToolBar())\nQMenu *fileMenu = menuBar()->addMenu(tr(\"&File\"));\nfileMenu->addAction(openAct);\nfileMenu->addSeparator();\nfileMenu->addAction(tr(\"E&xit\"), QKeySequence::Quit, this, &QWidget::close);\n\nQToolBar *bar = addToolBar(tr(\"Main\"));\nbar->addAction(openAct);                          // same action, same handler" },
        { type: "list", items: [
          "**`&` in text** marks the keyboard mnemonic (`&File` → Alt+F). Use **`QKeySequence::StandardKey`** (`Open`, `Save`, `Copy`, `Quit`...) so shortcuts match each OS's convention.",
          "**Checkable / grouped:** `action->setCheckable(true)` makes a toggle; put mutually-exclusive toggles in a **`QActionGroup`** (like radio buttons — e.g. view modes).",
          "**Enable/disable** an action (`setEnabled(false)`) and every menu item, toolbar button and shortcut updates together — the single-source-of-truth payoff.",
          "**Context menus:** override `contextMenuEvent`, or set `setContextMenuPolicy(Qt::ActionsContextMenu)` so a widget's actions appear on right-click."
        ] },
        { type: "heading", text: "Standard dialogs" },
        { type: "p", text: "Qt ships ready-made dialogs with **static convenience functions** — no subclassing needed. They return the user's choice directly (modal dialogs block via their own event loop until dismissed)." },
        { type: "code", lang: "cpp", code: "#include <QFileDialog>\n#include <QMessageBox>\n#include <QInputDialog>\n\n// pick a file to open\nQString path = QFileDialog::getOpenFileName(this, tr(\"Open\"), QDir::homePath(),\n                                            tr(\"Text files (*.txt);;All files (*)\"));\nif (path.isEmpty()) return;   // user cancelled\n\n// ask a yes/no question\nauto btn = QMessageBox::question(this, tr(\"Quit\"), tr(\"Save before closing?\"),\n                                 QMessageBox::Save | QMessageBox::Discard | QMessageBox::Cancel);\nif (btn == QMessageBox::Save) save();\n\n// prompt for a value\nbool ok;\nQString name = QInputDialog::getText(this, tr(\"Name\"), tr(\"Your name:\"),\n                                     QLineEdit::Normal, {}, &ok);" },
        { type: "callout", variant: "tip", text: "For a **custom** dialog, subclass `QDialog`, add a `QDialogButtonBox` (it lays out OK/Cancel in the platform's order), and connect its `accepted()`/`rejected()` to `accept()`/`reject()`. Show it modally with `exec()` (blocks, returns a result) or modelessly with `show()`." }
      ]
    },
    {
      id: "events",
      title: "The event loop & event system",
      level: "core",
      body: [
        { type: "p", text: "`app.exec()` starts the **event loop**: it pulls native and posted events (mouse, key, paint, timer, queued signals) off a queue and dispatches each to the target object's `event()` method, which routes to handlers like `mousePressEvent()` or `paintEvent()`." },
        { type: "callout", variant: "note", text: "**Signals/slots vs events:** signals are for *your* application-level notifications (\"clicked\", \"finished\"). Events are lower-level input/system messages. Many widgets translate events into signals for you — a `QPushButton` turns a mouse-release event into a `clicked()` signal." },
        { type: "heading", text: "Overriding handlers" },
        { type: "code", lang: "cpp", code: "class Canvas : public QWidget {\nprotected:\n    void paintEvent(QPaintEvent *) override {\n        QPainter p(this);\n        p.fillRect(rect(), Qt::white);\n        p.drawText(rect(), Qt::AlignCenter, \"Hello\");\n    }\n    void mousePressEvent(QMouseEvent *e) override {\n        qDebug() << \"click at\" << e->position();\n        update();                 // schedule a repaint (do NOT call paintEvent directly)\n    }\n};" },
        { type: "callout", variant: "warn", text: "Never call `paintEvent()` yourself and never paint outside it. Call `update()` (async, coalesced) or `repaint()` (sync) to request redraws." },
        { type: "heading", text: "Event filters" },
        { type: "p", text: "Install an **event filter** to intercept events destined for another object without subclassing it — handy for global shortcuts, watching focus, or vetoing input. Return `true` to consume the event." },
        { type: "code", lang: "cpp", code: "bool Watcher::eventFilter(QObject *obj, QEvent *e) {\n    if (e->type() == QEvent::KeyPress) {\n        auto *k = static_cast<QKeyEvent*>(e);\n        if (k->key() == Qt::Key_Escape) { close(); return true; } // consumed\n    }\n    return QObject::eventFilter(obj, e);   // pass through\n}\n// install: someWidget->installEventFilter(watcherObject);" },
        { type: "callout", variant: "tip", text: "The event loop is also how Qt does **async without threads**: timers, network replies and file watchers all deliver their results as events/signals on the same thread — no callback hell, no blocking." }
      ]
    },
    {
      id: "painting",
      title: "Custom painting, Graphics View & animation",
      level: "core",
      body: [
        { type: "p", text: "When no widget does what you need, you **draw it yourself** with **`QPainter`** — Qt's 2D vector painting API. You paint inside `paintEvent()`, using a **pen** (outlines), a **brush** (fills) and a coordinate system you can translate/rotate/scale. The same `QPainter` code targets any **paint device**: a widget, a `QImage`/`QPixmap` (off-screen), an SVG, or a `QPdfWriter` — so \"draw to screen\" and \"export to PDF\" share one code path." },
        { type: "code", lang: "cpp", code: "void Chart::paintEvent(QPaintEvent *) {\n    QPainter p(this);\n    p.setRenderHint(QPainter::Antialiasing);          // smooth edges\n    p.fillRect(rect(), Qt::white);\n\n    p.setPen(QPen(Qt::darkBlue, 2));                  // outline\n    p.setBrush(QColor(80, 140, 255, 120));            // semi-transparent fill\n    p.drawRoundedRect(QRectF(20, 20, 160, 90), 8, 8);\n\n    p.translate(width() / 2.0, height() / 2.0);       // move the origin\n    p.rotate(15);                                     // then rotate everything\n    p.drawText(0, 0, tr(\"Hello\"));\n\n    QPainterPath path;                                // arbitrary shapes/curves\n    path.moveTo(0, 0); path.cubicTo(40, -60, 120, 60, 160, 0);\n    p.strokePath(path, QPen(Qt::red, 3));\n}   // painter auto-ends when it goes out of scope" },
        { type: "callout", variant: "gotcha", text: "Rules of painting: only paint inside `paintEvent()` (or onto an off-screen `QImage`); never call `paintEvent()` yourself — call **`update()`** to request a repaint. Heavy drawing? Render once into a `QPixmap` and blit it, rather than recomputing every frame." },
        { type: "heading", text: "Graphics View: many interactive items" },
        { type: "p", text: "For **hundreds/thousands of movable, selectable 2D objects** (diagram editors, node graphs, games, CAD), don't hand-paint — use the **Graphics View** framework: a `QGraphicsScene` holds `QGraphicsItem`s (rect, ellipse, pixmap, text, or your own), and one or more `QGraphicsView`s display and let the user zoom/pan/drag them. The scene handles hit-testing, selection and z-order for you." },
        { type: "code", lang: "cpp", code: "auto *scene = new QGraphicsScene(this);\nauto *rect = scene->addRect(0, 0, 80, 40, QPen(Qt::black), QBrush(Qt::yellow));\nrect->setFlag(QGraphicsItem::ItemIsMovable);      // user can drag it\nrect->setFlag(QGraphicsItem::ItemIsSelectable);\nscene->addText(\"node\")->setPos(10, 10);\n\nauto *view = new QGraphicsView(scene);\nview->setRenderHint(QPainter::Antialiasing);\nview->setDragMode(QGraphicsView::RubberBandDrag); // marquee-select" },
        { type: "heading", text: "The animation framework" },
        { type: "p", text: "**`QPropertyAnimation`** smoothly interpolates any `Q_PROPERTY` over time — position, size, opacity, color — driven by the event loop. Compose them with `QSequentialAnimationGroup` / `QParallelAnimationGroup`, and shape the motion with an **easing curve**." },
        { type: "code", lang: "cpp", code: "auto *anim = new QPropertyAnimation(button, \"geometry\");\nanim->setDuration(400);\nanim->setStartValue(QRect(0, 0, 100, 30));\nanim->setEndValue(QRect(200, 0, 100, 30));\nanim->setEasingCurve(QEasingCurve::OutBack);\nanim->start(QAbstractAnimation::DeleteWhenStopped);\n\n// fade a widget via a graphics effect + animated 'opacity' property\nauto *fx = new QGraphicsOpacityEffect(panel);\npanel->setGraphicsEffect(fx);\nauto *fade = new QPropertyAnimation(fx, \"opacity\");\nfade->setDuration(250); fade->setStartValue(0.0); fade->setEndValue(1.0);\nfade->start(QAbstractAnimation::DeleteWhenStopped);" },
        { type: "callout", variant: "note", text: "This is *why* `Q_PROPERTY` matters beyond QML: because the meta-object exposes properties by name, the animation system can drive them generically. Anything you make a bindable property becomes animatable for free. For richer motion-heavy UIs, QML's declarative animations (next section) are usually easier." }
      ]
    },
    {
      id: "model-view",
      title: "Model/View architecture",
      level: "core",
      body: [
        { type: "p", text: "For any non-trivial data, Qt separates **model** (the data), **view** (`QListView`/`QTableView`/`QTreeView`, the presentation) and **delegate** (how each item is drawn/edited). One model can feed many views; views update automatically when the model changes." },
        { type: "heading", text: "Quick start with QStandardItemModel" },
        { type: "p", text: "For modest, in-memory data, `QStandardItemModel` (or the `QListWidget`/`QTableWidget` convenience views) avoids writing a model." },
        { type: "code", lang: "cpp", code: "auto *model = new QStandardItemModel(0, 2, this);\nmodel->setHorizontalHeaderLabels({\"Name\", \"Age\"});\nmodel->appendRow({ new QStandardItem(\"Ada\"), new QStandardItem(\"36\") });\n\nauto *view = new QTableView;\nview->setModel(model);" },
        { type: "heading", text: "Custom model: QAbstractItemModel / QAbstractListModel" },
        { type: "p", text: "For real data, subclass `QAbstractListModel` (lists) or `QAbstractTableModel`/`QAbstractItemModel` (tables/trees). You implement a few virtuals; views ask the model for data via **roles** (`Qt::DisplayRole`, `Qt::DecorationRole`, custom roles for QML)." },
        { type: "code", lang: "cpp", code: "class TaskModel : public QAbstractListModel {\n    Q_OBJECT\n    QList<Task> m_tasks;\npublic:\n    int rowCount(const QModelIndex& = {}) const override { return m_tasks.size(); }\n\n    QVariant data(const QModelIndex &idx, int role) const override {\n        if (!idx.isValid()) return {};\n        const Task &t = m_tasks[idx.row()];\n        if (role == Qt::DisplayRole) return t.title;\n        if (role == Qt::CheckStateRole)\n            return t.done ? Qt::Checked : Qt::Unchecked;\n        return {};\n    }\n\n    void addTask(const Task &t) {\n        beginInsertRows({}, m_tasks.size(), m_tasks.size());  // notify views\n        m_tasks.append(t);\n        endInsertRows();\n    }\n};" },
        { type: "callout", variant: "gotcha", text: "Views only refresh if the model **announces** changes: wrap mutations in `beginInsertRows/endInsertRows`, `beginRemoveRows/endRemoveRows`, or emit `dataChanged(topLeft, bottomRight, roles)`. Forgetting these is the #1 model bug — the data changes but the view doesn't." },
        { type: "heading", text: "Proxy models & delegates" },
        { type: "list", items: [
          "**`QSortFilterProxyModel`** — sits between model and view to sort and filter without touching the source model. Set a filter regex/role, or override `filterAcceptsRow()`.",
          "**Delegates** (`QStyledItemDelegate`) — customize rendering and provide editors; override `paint()` and `createEditor()`.",
          "**`QModelIndex`** — a transient handle to a cell; never store it, re-fetch via `model->index(row, col)`."
        ] },
        { type: "code", lang: "cpp", code: "auto *proxy = new QSortFilterProxyModel(this);\nproxy->setSourceModel(taskModel);\nproxy->setFilterCaseSensitivity(Qt::CaseInsensitive);\nview->setModel(proxy);\nview->setSortingEnabled(true);\nproxy->setFilterFixedString(searchBox->text());   // live filtering" },
        { type: "link", url: "https://doc.qt.io/qt-6/model-view-programming.html", text: "Qt docs — Model/View Programming (roles, trees, drag & drop, editing)" }
      ]
    },
    {
      id: "networking-io",
      title: "Async I/O, timers, networking & processes",
      level: "core",
      body: [
        { type: "p", text: "Qt's async model is **event-loop based, not thread based**: you kick off an operation and connect a signal for its result. Nothing blocks the GUI." },
        { type: "heading", text: "QTimer" },
        { type: "code", lang: "cpp", code: "auto *timer = new QTimer(this);\nconnect(timer, &QTimer::timeout, this, &Clock::tick);\ntimer->start(1000);                 // fire every second on this thread\n\nQTimer::singleShot(500, this, [this]{ doLater(); });  // one-shot" },
        { type: "heading", text: "QNetworkAccessManager (HTTP)" },
        { type: "p", text: "`QNetworkAccessManager` from `QtNetwork` performs **asynchronous** HTTP(S). `get()`/`post()` return a `QNetworkReply` immediately; connect its `finished` signal for the response. Reuse one manager for the app." },
        { type: "code", lang: "cpp", code: "#include <QNetworkAccessManager>\n#include <QNetworkReply>\n\nauto *nam = new QNetworkAccessManager(this);\n\n// GET\nQNetworkRequest req(QUrl(\"https://api.example.com/items\"));\nQNetworkReply *reply = nam->get(req);\nconnect(reply, &QNetworkReply::finished, this, [reply, this]{\n    if (reply->error() == QNetworkReply::NoError) {\n        QByteArray body = reply->readAll();\n        handleJson(body);\n    }\n    reply->deleteLater();           // you own the reply; free it\n});\n\n// POST JSON\nQNetworkRequest post(QUrl(\"https://api.example.com/items\"));\npost.setHeader(QNetworkRequest::ContentTypeHeader, \"application/json\");\nnam->post(post, QByteArray(\"{\\\"name\\\":\\\"Ada\\\"}\"));" },
        { type: "callout", variant: "gotcha", text: "You own the `QNetworkReply` — always `reply->deleteLater()` when done, or you leak. And never blockingly `while(!reply->isFinished())`-spin: that stalls the event loop the reply needs to finish." },
        { type: "heading", text: "QProcess" },
        { type: "code", lang: "cpp", code: "auto *proc = new QProcess(this);\nconnect(proc, &QProcess::readyReadStandardOutput, this, [proc]{\n    qDebug() << proc->readAllStandardOutput();\n});\nconnect(proc, &QProcess::finished, this, [](int code, QProcess::ExitStatus){\n    qDebug() << \"exited\" << code;\n});\nproc->start(\"git\", {\"status\", \"--short\"});   // async; also startDetached()" },
        { type: "callout", variant: "note", text: "Other async sources follow the same pattern: `QFileSystemWatcher`, `QTcpSocket`/`QUdpSocket`, `QWebSocket` (add-on), and `QtConcurrent` futures. Connect a signal, keep the GUI responsive." }
      ]
    },
    {
      id: "files-json-settings",
      title: "Files, streams, JSON, resources & settings",
      level: "core",
      body: [
        { type: "heading", text: "QFile & streams" },
        { type: "p", text: "`QFile` is a `QIODevice`. Wrap it in **`QTextStream`** for encoded text or **`QDataStream`** for portable binary serialization of Qt types." },
        { type: "code", lang: "cpp", code: "QFile f(\"notes.txt\");\nif (f.open(QIODevice::WriteOnly | QIODevice::Text)) {\n    QTextStream out(&f);\n    out.setEncoding(QStringConverter::Utf8);\n    out << \"line 1\\n\" << \"count = \" << 42 << '\\n';\n}   // RAII: file closes when f goes out of scope\n\n// portable binary (versioned, endian-safe) for Qt types\nQFile bin(\"data.bin\");\nbin.open(QIODevice::WriteOnly);\nQDataStream ds(&bin);\nds << QString(\"hi\") << QList<int>{1,2,3};" },
        { type: "heading", text: "JSON" },
        { type: "code", lang: "cpp", code: "#include <QJsonDocument>\n#include <QJsonObject>\n\n// parse\nQJsonDocument doc = QJsonDocument::fromJson(bytes);\nQJsonObject root = doc.object();\nQString name = root[\"name\"].toString();\nint age = root[\"age\"].toInt();\n\n// build\nQJsonObject obj{ {\"name\", \"Ada\"}, {\"age\", 36} };\nQByteArray out = QJsonDocument(obj).toJson(QJsonDocument::Compact);" },
        { type: "heading", text: "Resources (.qrc)" },
        { type: "p", text: "Bundle assets (icons, `.qml`, translations, JSON) *into the binary* with a resource file, referenced by the `:/` prefix — no loose files to ship or lose." },
        { type: "code", lang: "xml", code: "<!-- resources.qrc -->\n<RCC>\n  <qresource prefix=\"/\">\n    <file>icons/open.svg</file>\n    <file>ui/main.qml</file>\n  </qresource>\n</RCC>\n<!-- use as:  QIcon(\":/icons/open.svg\")  -->" },
        { type: "heading", text: "QSettings" },
        { type: "p", text: "`QSettings` stores app preferences in the platform-native store (registry on Windows, plist on macOS, INI on Linux) with no path handling on your part." },
        { type: "code", lang: "cpp", code: "QCoreApplication::setOrganizationName(\"Acme\");\nQCoreApplication::setApplicationName(\"MyApp\");\n\nQSettings s;\ns.setValue(\"window/geometry\", saveGeometry());\ns.setValue(\"user/theme\", \"dark\");\n// ...next launch:\nrestoreGeometry(s.value(\"window/geometry\").toByteArray());\nQString theme = s.value(\"user/theme\", \"light\").toString();  // with default" },
        { type: "callout", variant: "tip", text: "Set the **organization and application name** early in `main()` — `QSettings`, `QStandardPaths` (for config/cache/data dirs) and crash-report paths all key off them." }
      ]
    },
    {
      id: "concurrency",
      title: "Concurrency & threads",
      level: "core",
      body: [
        { type: "p", text: "Qt has several concurrency tools. Because a `QObject` has **thread affinity** and **GUI must stay on the main thread**, the idiomatic patterns differ from raw `std::thread`." },
        { type: "callout", variant: "warn", text: "**Golden rule:** never touch `QWidget`s or any GUI object from a non-GUI thread. Do work on a worker thread, then hand results back to the GUI thread via a **queued signal** (the default `connect` across threads does this automatically)." },
        { type: "heading", text: "QThread — the worker-object pattern (preferred)" },
        { type: "p", text: "Don't subclass `QThread` and put logic in `run()` (a common anti-pattern). Instead: create a `QObject` worker, **move it to a thread**, and drive it with signals. Its slots then execute on that thread's event loop." },
        { type: "code", lang: "cpp", code: "class Worker : public QObject {\n    Q_OBJECT\npublic slots:\n    void process() {\n        for (int i = 0; i <= 100; ++i) { heavyStep(i); emit progress(i); }\n        emit done();\n    }\nsignals:\n    void progress(int);\n    void done();\n};\n\n// wiring (on the GUI thread)\nauto *thread = new QThread(this);\nauto *worker = new Worker;\nworker->moveToThread(thread);                 // change affinity\n\nconnect(thread, &QThread::started, worker, &Worker::process);\nconnect(worker, &Worker::progress, this, &MyWindow::setProgress); // queued -> GUI safe\nconnect(worker, &Worker::done, thread, &QThread::quit);\nconnect(thread, &QThread::finished, worker, &QObject::deleteLater);\nconnect(thread, &QThread::finished, thread, &QObject::deleteLater);\nthread->start();" },
        { type: "callout", variant: "gotcha", text: "After `moveToThread`, the worker's **slots** run on the new thread, but any object it `new`s inside a slot also lives there. Do **not** create the worker with a parent (moveToThread refuses parented objects), and never call worker methods directly from the GUI thread — go through signals." },
        { type: "heading", text: "QtConcurrent — fire-and-forget parallelism" },
        { type: "p", text: "For stateless \"run this function in the background\" or data-parallel map/filter/reduce, `QtConcurrent` is far simpler than managing threads. It returns a `QFuture<T>`; watch it with `QFutureWatcher` for a `finished` signal." },
        { type: "code", lang: "cpp", code: "#include <QtConcurrent>\n\nQFuture<int> future = QtConcurrent::run([]{ return expensive(); });\n\nauto *watcher = new QFutureWatcher<int>(this);\nconnect(watcher, &QFutureWatcher<int>::finished, this, [watcher]{\n    use(watcher->result());        // back on the GUI thread\n});\nwatcher->setFuture(future);\n\n// data-parallel map across all cores\nQFuture<QImage> thumbs = QtConcurrent::mapped(images, makeThumbnail);" },
        { type: "heading", text: "QThreadPool & QRunnable" },
        { type: "p", text: "For many short tasks, submit `QRunnable`s to the global `QThreadPool` — it reuses a pool of threads sized to the CPU." },
        { type: "code", lang: "cpp", code: "class Job : public QRunnable {\n    void run() override { doChunk(); }   // no signals unless it's also a QObject\n};\nQThreadPool::globalInstance()->start(new Job);  // pool owns & deletes it" },
        { type: "table", headers: ["Tool", "Best for"], rows: [
          ["`QtConcurrent::run` / `mapped`", "Stateless background functions, data-parallel loops."],
          ["`QThread` + worker object", "A long-lived worker with its own event loop, timers, sockets, signals."],
          ["`QThreadPool` + `QRunnable`", "Lots of short independent tasks."],
          ["`QMutex`/`QReadWriteLock`/`QSemaphore`", "Low-level guarding of shared state (prefer message-passing via signals)."]
        ] }
      ]
    },
    {
      id: "qml",
      title: "Qt Quick / QML & C++ integration",
      level: "core",
      body: [
        { type: "p", text: "**QML** is a declarative language (JSON-like structure + JavaScript expressions) for building fluid, animated UIs, rendered on the GPU by the **Qt Quick** scene graph. It's the modern choice for touch, embedded HMIs and custom-look apps; Widgets remains the choice for dense classic desktop tools." },
        { type: "heading", text: "QML basics: items, properties, bindings" },
        { type: "code", lang: "qml", code: "import QtQuick\nimport QtQuick.Controls\n\nApplicationWindow {\n    width: 320; height: 200; visible: true\n    title: \"Counter\"\n\n    property int count: 0            // a custom property\n\n    Column {\n        anchors.centerIn: parent\n        spacing: 12\n        Label { text: \"Count: \" + count }   // property BINDING: auto-updates\n        Button {\n            text: \"Increment\"\n            onClicked: count++            // signal handler\n        }\n    }\n}" },
        { type: "callout", variant: "tip", text: "The superpower of QML is **property bindings**: `text: \"Count: \" + count` re-evaluates automatically whenever `count` changes. You describe relationships, not update code." },
        { type: "heading", text: "Exposing C++ to QML (modern way)" },
        { type: "p", text: "The Qt 6 recommended approach registers types declaratively with the **`QML_ELEMENT`** macro plus CMake's `qt_add_qml_module` — no manual `qmlRegisterType` calls. Any `Q_PROPERTY` (with `NOTIFY`), signal, slot or `Q_INVOKABLE` method becomes usable from QML." },
        { type: "code", lang: "cpp", code: "#include <QObject>\n#include <QtQml/qqmlregistration.h>\n\nclass Backend : public QObject {\n    Q_OBJECT\n    QML_ELEMENT                     // register for QML (needs qt_add_qml_module)\n    Q_PROPERTY(QString user READ user WRITE setUser NOTIFY userChanged)\npublic:\n    QString user() const { return m_user; }\n    void setUser(const QString &u) { if (u!=m_user){ m_user=u; emit userChanged(); } }\n\n    Q_INVOKABLE void login(const QString &pw);   // callable directly from QML\nsignals:\n    void userChanged();\n    void loginFailed(const QString &reason);\nprivate:\n    QString m_user;\n};" },
        { type: "code", lang: "qml", code: "import QtQuick\nimport MyApp                          // the module your CMake declared\n\nBackend { id: backend }\nButton {\n    onClicked: backend.login(pwField.text)   // call the Q_INVOKABLE\n}\nConnections {\n    target: backend\n    function onLoginFailed(reason) { errorLabel.text = reason }  // handle a C++ signal\n}" },
        { type: "code", lang: "cpp", code: "// main.cpp: load QML from the engine\n#include <QGuiApplication>\n#include <QQmlApplicationEngine>\n\nint main(int argc, char **argv) {\n    QGuiApplication app(argc, argv);\n    QQmlApplicationEngine engine;\n    engine.loadFromModule(\"MyApp\", \"Main\");   // Main.qml in the module\n    return app.exec();\n}" },
        { type: "callout", variant: "note", text: "The older bridge — `engine.rootContext()->setContextProperty(\"backend\", &obj)` and `qmlRegisterType<Backend>(\"MyApp\", 1, 0, \"Backend\")` — still works, but `QML_ELEMENT` + `qt_add_qml_module` is now preferred (better tooling, type checking, and QML compilation)." },
        { type: "link", url: "https://doc.qt.io/qt-6/qtqml-cppintegration-overview.html", text: "Qt docs — QML & C++ integration overview" }
      ]
    },
    {
      id: "qml-depth",
      title: "QML in depth: layout, lists, states & animation",
      level: "core",
      body: [
        { type: "p", text: "The previous section covered the C++ bridge; this is the QML you actually write. Four things carry most real UIs: **positioning** items, showing **lists** from a model, describing **states**, and **animating** between them." },
        { type: "heading", text: "Positioning: anchors, positioners & Layouts" },
        { type: "p", text: "QML has three ways to place items, used together:" },
        { type: "list", items: [
          "**Anchors** — glue an item's edges to another's: `anchors.fill: parent`, `anchors.centerIn: parent`, `anchors.top: header.bottom`. Best for relative positioning and margins.",
          "**Positioners** — `Row`, `Column`, `Grid`, `Flow` auto-arrange their children in sequence with `spacing`. Simple and cheap; children don't resize.",
          "**Qt Quick Layouts** — `RowLayout`, `ColumnLayout`, `GridLayout` (from `import QtQuick.Layouts`) *resize* children via attached props like `Layout.fillWidth: true`, `Layout.preferredHeight`, `Layout.columnSpan`. This is the analog of Widgets' `QHBoxLayout`."
        ] },
        { type: "code", lang: "qml", code: "import QtQuick\nimport QtQuick.Controls\nimport QtQuick.Layouts\n\nColumnLayout {\n    anchors.fill: parent\n    spacing: 8\n    Label { text: \"Title\"; Layout.alignment: Qt.AlignHCenter }\n    RowLayout {\n        Layout.fillWidth: true                 // stretch to parent width\n        TextField { Layout.fillWidth: true }   // grows to fill the row\n        Button { text: \"Go\" }                  // stays natural size\n    }\n}" },
        { type: "heading", text: "Lists: ListView + model + delegate" },
        { type: "p", text: "QML's Model/View mirror of the C++ one: a **`ListView`** binds to a `model` (a number, a JS array, a `ListModel`, or a C++ `QAbstractListModel`) and stamps out one **`delegate`** per item. Inside the delegate, model roles are available by name (`name`, `age`, or `modelData` for simple lists)." },
        { type: "code", lang: "qml", code: "ListView {\n    anchors.fill: parent\n    clip: true\n    model: ListModel {\n        ListElement { name: \"Ada\";  role: \"Eng\" }\n        ListElement { name: \"Linus\"; role: \"Kernel\" }\n    }\n    delegate: ItemDelegate {\n        width: ListView.view.width\n        text: name + \" — \" + role      // role names from the model\n        onClicked: console.log(\"tapped\", index)  // 'index' is provided\n    }\n    ScrollBar.vertical: ScrollBar {}\n}" },
        { type: "callout", variant: "tip", text: "**`Repeater`** stamps a fixed set of items into a positioner (great for a handful of buttons); **`ListView`**/`GridView` virtualize (only visible delegates exist) for long/scrolling data. Feed a C++ `QAbstractListModel` straight into `model:` and expose fields as roles for the best of both worlds." },
        { type: "heading", text: "States & transitions" },
        { type: "p", text: "Rather than imperatively toggling properties, declare named **`State`s** (each a set of `PropertyChanges`) and let **`Transition`s** animate the moves between them. The UI becomes a description of *what each state looks like*, not step-by-step mutation code." },
        { type: "code", lang: "qml", code: "Rectangle {\n    id: card; width: 200; height: 120; color: \"#334\"\n    states: State {\n        name: \"expanded\"; when: mouse.containsMouse\n        PropertyChanges { card.height: 240; card.color: \"#4557aa\" }\n    }\n    transitions: Transition {\n        NumberAnimation { properties: \"height\"; duration: 200; easing.type: Easing.OutCubic }\n        ColorAnimation { duration: 200 }\n    }\n    MouseArea { id: mouse; anchors.fill: parent; hoverEnabled: true }\n}" },
        { type: "heading", text: "Animations directly" },
        { type: "list", items: [
          "**`NumberAnimation` / `ColorAnimation` / `PropertyAnimation`** animate a property over a duration + easing.",
          "**`Behavior on x { NumberAnimation { duration: 150 } }`** — auto-animate *every* change to property `x`, wherever it comes from.",
          "**`SequentialAnimation` / `ParallelAnimation`** compose steps; **`PauseAnimation`** inserts delays; `loops: Animation.Infinite` repeats.",
          "**`Component.onCompleted`** runs JS on load; QML also lets you define your own `signal foo()` and handle it as `onFoo`."
        ] },
        { type: "callout", variant: "note", text: "Because QML runs on the GPU scene graph, these animations are cheap and buttery. This declarative state+transition model is the main reason to pick Qt Quick over Widgets for animated, touch or embedded UIs." }
      ]
    },
    {
      id: "smart-pointers",
      title: "Smart pointers & memory patterns",
      level: "deep",
      body: [
        { type: "p", text: "Qt predates modern C++ smart pointers and has its own, but they interoperate. Knowing which to use where prevents both leaks and double-frees." },
        { type: "table", headers: ["Pointer", "Use"], rows: [
          ["**Parent-child** (`new` + parent)", "The default for any parented `QObject`/widget — the parent deletes it. Don't wrap these in smart pointers."],
          ["`QScopedPointer<T>`", "RAII single-owner (like `unique_ptr`) for a non-parented object in a scope."],
          ["`QSharedPointer<T>` / `QWeakPointer<T>`", "Reference-counted shared ownership (like `shared_ptr`/`weak_ptr`)."],
          ["`QPointer<T>`", "A **guarded** pointer to a `QObject` that auto-nulls when the object is destroyed — great for 'maybe-dead' references."],
          ["`std::unique_ptr`/`shared_ptr`", "Fine for non-`QObject` data; also usable for top-level `QObject`s you fully own."]
        ] },
        { type: "code", lang: "cpp", code: "QPointer<QWidget> dialog = new MyDialog;\n// ...later, safely:\nif (dialog) dialog->raise();     // becomes null automatically if it was deleted\n\n// deleteLater: safe deletion from within a slot / across the event loop\nconnect(reply, &QNetworkReply::finished, reply, &QObject::deleteLater);" },
        { type: "callout", variant: "gotcha", text: "Never `delete` a `QObject` from inside one of its own slots that's mid-emit — use `deleteLater()`, which schedules deletion when control returns to the event loop. And never give a smart-pointer *and* a parent to the same object: two owners = crash." }
      ]
    },
    {
      id: "i18n",
      title: "Internationalization (tr / lupdate / Linguist)",
      level: "deep",
      body: [
        { type: "p", text: "Wrap user-visible strings in **`tr()`** (a `QObject` method). Tooling extracts them, translators fill in `.ts` files with **Qt Linguist**, and `lrelease` compiles compact `.qm` files loaded at runtime." },
        { type: "code", lang: "cpp", code: "label->setText(tr(\"Open file\"));\nstatusBar()->showMessage(tr(\"%n file(s) loaded\", \"\", count));  // plural-aware\n\n// load a translation in main()\nQTranslator tr;\nif (tr.load(QLocale(), \"myapp\", \"_\", \":/i18n\"))\n    app.installTranslator(&tr);" },
        { type: "code", lang: "bash", code: "lupdate src/ -ts translations/myapp_fr.ts   # extract strings\nlinguist translations/myapp_fr.ts           # translate (GUI)\nlrelease translations/myapp_fr.ts           # compile to .qm" },
        { type: "callout", variant: "tip", text: "Use `%1`, `%2` placeholders with `.arg()` instead of string concatenation — word order differs across languages. Give ambiguous strings a **disambiguation/context** argument to `tr()`." }
      ]
    },
    {
      id: "testing",
      title: "Unit testing with QtTest",
      level: "deep",
      body: [
        { type: "p", text: "`QtTest` is Qt's lightweight testing framework: a test is a `QObject` whose **private slots** are test functions. `QVERIFY`/`QCOMPARE` assert, and it supports **data-driven** tests and GUI event simulation." },
        { type: "code", lang: "cpp", code: "#include <QtTest>\n\nclass TestString : public QObject {\n    Q_OBJECT\nprivate slots:\n    void toUpper() {\n        QCOMPARE(QString(\"hello\").toUpper(), QString(\"HELLO\"));\n        QVERIFY(QString().isEmpty());\n    }\n    void concat_data() {                     // data-driven\n        QTest::addColumn<QString>(\"a\");\n        QTest::addColumn<QString>(\"b\");\n        QTest::addColumn<QString>(\"out\");\n        QTest::newRow(\"basic\") << \"a\" << \"b\" << \"ab\";\n    }\n    void concat() {\n        QFETCH(QString, a); QFETCH(QString, b); QFETCH(QString, out);\n        QCOMPARE(a + b, out);\n    }\n};\nQTEST_MAIN(TestString)          // generates main()\n#include \"test_string.moc\"" },
        { type: "code", lang: "cmake", code: "enable_testing()\nfind_package(Qt6 REQUIRED COMPONENTS Test)\nqt_add_executable(test_string test_string.cpp)\ntarget_link_libraries(test_string PRIVATE Qt6::Test)\nadd_test(NAME test_string COMMAND test_string)   # run via ctest" },
        { type: "callout", variant: "note", text: "`QSignalSpy` records emissions so you can assert a signal fired with expected arguments — essential for testing signal/slot logic and async code (with `QTRY_COMPARE`, which retries until the event loop delivers the result)." }
      ]
    },
    {
      id: "database",
      title: "Databases with Qt SQL",
      level: "deep",
      body: [
        { type: "p", text: "`QtSql` provides a driver-based API (SQLite, PostgreSQL, MySQL, ODBC) plus model classes that plug straight into views." },
        { type: "code", lang: "cpp", code: "#include <QSqlDatabase>\n#include <QSqlQuery>\n\nQSqlDatabase db = QSqlDatabase::addDatabase(\"QSQLITE\");\ndb.setDatabaseName(\"app.db\");\nif (!db.open()) qWarning() << db.lastError().text();\n\nQSqlQuery q;\nq.prepare(\"INSERT INTO users (name, age) VALUES (?, ?)\");\nq.addBindValue(\"Ada\");\nq.addBindValue(36);\nq.exec();                          // parameterized -> no SQL injection\n\nq.exec(\"SELECT name, age FROM users\");\nwhile (q.next())\n    qDebug() << q.value(0).toString() << q.value(1).toInt();" },
        { type: "callout", variant: "tip", text: "`QSqlTableModel` / `QSqlQueryModel` are ready-made Model/View models — point a `QTableView` at one to browse/edit a table with no custom model code." }
      ]
    },
    {
      id: "deployment",
      title: "Deployment & packaging",
      level: "deep",
      body: [
        { type: "p", text: "Qt apps need their Qt libraries (and platform plugins like `qwindows`/`cocoa`/`xcb`) alongside the binary. Qt ships per-platform deploy tools that scan your executable and copy exactly what it uses." },
        { type: "table", headers: ["Platform", "Tool", "Notes"], rows: [
          ["Windows", "**windeployqt**", "Copies DLLs + plugins next to the `.exe`; add `--qmldir` for QML apps."],
          ["macOS", "**macdeployqt**", "Bundles frameworks into `.app`; can also build a `.dmg`."],
          ["Linux", "**linuxdeployqt** / **linuxdeploy** + AppImage", "Produces a relocatable AppImage; or ship a `.deb`/`.rpm`/Flatpak."]
        ] },
        { type: "code", lang: "bash", code: "# Windows\nwindeployqt --qmldir src build/MyApp.exe\n\n# macOS (also make a dmg)\nmacdeployqt MyApp.app -dmg\n\n# CMake also has a deployment API:\n#   qt_generate_deploy_app_script(...) + install(SCRIPT ...)" },
        { type: "callout", variant: "gotcha", text: "The most common runtime failure: **\"could not find the Qt platform plugin\"**. It means the `platforms/` plugin dir wasn't deployed next to the binary — that's exactly what `windeployqt`/`macdeployqt` fix. Static builds avoid this but usually require a commercial license or building Qt yourself." },
        { type: "link", url: "https://doc.qt.io/qt-6/deployment.html", text: "Qt docs — Deploying Qt Applications" }
      ]
    },
    {
      id: "headaches",
      title: "Common headaches & how to handle them",
      level: "deep",
      body: [
        { type: "p", text: "Almost every hard-to-debug Qt bug traces back to one of five things: who owns an object, why a `connect()` silently did nothing, which *thread* an object lives in, a frozen UI, or the moc/build pipeline. Here is each trap and the exact fix." },

        { type: "heading", text: "1. Double-free from mixing ownership models" },
        { type: "p", text: "A parented `QObject` is deleted by its parent. If you *also* `delete` it, `unique_ptr`-wrap it, or stack-allocate it under a heap parent, you get a **double free** — a crash on shutdown that's maddening to trace because the object looks fine until the parent tears down." },
        { type: "code", lang: "cpp", code: "// WRONG — two owners: the parent AND the unique_ptr both try to delete\nstd::unique_ptr<QPushButton> btn(new QPushButton(\"OK\", parentWidget));\n\n// WRONG — stack object given a heap parent; parent will delete a stack address\nQPushButton local(\"OK\");\nlayout->addWidget(&local);          // parent now thinks it owns &local -> crash\n\n// RIGHT — parented QObjects are raw new, no manual delete, no smart pointer\nauto *btn = new QPushButton(\"OK\", parentWidget);   // parent deletes it\n\n// RIGHT — a top-level object with NO parent: pick exactly one owner\nauto win = std::make_unique<QWidget>();            // unique_ptr owns it (no parent)" },
        { type: "callout", variant: "gotcha", text: "**Fix:** decide ownership *once*. If a `QObject` has a parent, use raw `new` and never `delete`/wrap it. If it has no parent, give it a single owner (a smart pointer, or `deleteLater()` for objects tied to the event loop). Use `QPointer<T>` for a *non-owning* \"might already be dead\" reference — it auto-nulls when the object is destroyed. Never delete a widget you passed to a layout — the layout reparents it, so the window owns it." },

        { type: "heading", text: "2. connect() that silently does nothing" },
        { type: "p", text: "The legacy string-based `SIGNAL()/SLOT()` macros are resolved by name **at runtime**. A typo, a wrong argument list, or a missing `Q_OBJECT` makes the connection fail — but the program keeps running; the only clue is a `QObject::connect: No such slot...` line buried in the console. Nothing calls your slot and you have no compile error." },
        { type: "code", lang: "cpp", code: "// SILENT FAILURE — string typo ('clickd'), only a runtime console warning\nconnect(button, SIGNAL(clickd()), this, SLOT(onClick()));\n\n// COMPILE ERROR instead (good!) — the pointer-to-member overload is type-checked\nconnect(button, &QPushButton::clicked, this, &MyWindow::onClick);\n\n// Verify at runtime if you ever must: connect() returns a truthy Connection\nauto c = connect(src, &Src::sig, dst, &Dst::slot);\nQ_ASSERT(c);      // false -> the connection did not take" },
        { type: "callout", variant: "gotcha", text: "**Fix:** always use the **function-pointer** `connect()` — `connect(src, &Src::sig, dst, &Dst::slot)` — so typos and signature mismatches are compile errors. If a signal/slot still doesn't fire, check the class has `Q_OBJECT` in a header moc processes (and that you re-ran the build after adding it). For overloaded signals, use `qOverload<int>(&Klass::sig)` to disambiguate. `connect()` returns a `QMetaObject::Connection` that is falsy on failure — assert it while debugging." },

        { type: "heading", text: "3. Thread affinity: touching a QObject from the wrong thread" },
        { type: "p", text: "Every `QObject` \"lives in\" the thread that created it (its **thread affinity**). Calling a widget's methods — or any `QObject` — from a worker thread is undefined behaviour: it may work, corrupt state, or crash randomly. `moveToThread` changes affinity, but only *before* you start using the object cross-thread, and it refuses objects that have a parent." },
        { type: "code", lang: "cpp", code: "// WRONG — worker thread pokes the GUI directly = UB / random crashes\nstd::thread([label]{ label->setText(\"done\"); }).detach();\n\n// RIGHT — worker object moved to a thread; results come back via a QUEUED signal\nauto *thread = new QThread;\nauto *worker = new Worker;            // NO parent (moveToThread refuses parented objects)\nworker->moveToThread(thread);\nconnect(worker, &Worker::result, this, &MyWindow::showResult); // auto-queued to GUI thread\nconnect(thread, &QThread::started, worker, &Worker::run);\nthread->start();\n\n// Or marshal a one-off call onto the GUI thread from anywhere:\nQMetaObject::invokeMethod(label, [label]{ label->setText(\"done\"); }, Qt::QueuedConnection);" },
        { type: "callout", variant: "gotcha", text: "**Fix:** never call GUI/widget methods off the main thread. Communicate cross-thread with **queued signal/slot connections** (the default `Qt::AutoConnection` becomes queued automatically when sender and receiver live in different threads) or `QMetaObject::invokeMethod(obj, fn, Qt::QueuedConnection)`. Use the **worker-object + `moveToThread`** pattern, not a `QThread` subclass, and don't give the worker a parent. Custom types passed through a queued connection must be registered with `qRegisterMetaType<T>()`." },

        { type: "heading", text: "4. A frozen UI: blocking the event loop" },
        { type: "p", text: "The GUI is driven by a single event loop on the main thread. Any long-running work *inside a slot* — a big computation, a synchronous network/file call, `sleep`, or a busy `while` — blocks that loop, so paint, input and timer events stop: the window greys out and the OS shows \"Not Responding.\" Pumping events by hand (`processEvents()` in a loop) is a tempting hack that invites re-entrancy bugs." },
        { type: "code", lang: "cpp", code: "// WRONG — the slot blocks the GUI thread for seconds; UI freezes\nvoid MainWindow::onCompute() {\n    auto result = crunchNumbers();     // 5s of CPU on the GUI thread\n    resultLabel->setText(result);\n}\n\n// RIGHT — offload to a pool thread, get the result back on the GUI thread\nvoid MainWindow::onCompute() {\n    auto *watcher = new QFutureWatcher<QString>(this);\n    connect(watcher, &QFutureWatcher<QString>::finished, this, [this, watcher]{\n        resultLabel->setText(watcher->result());   // back on the GUI thread\n        watcher->deleteLater();\n    });\n    watcher->setFuture(QtConcurrent::run([]{ return crunchNumbers(); }));\n}" },
        { type: "callout", variant: "gotcha", text: "**Fix:** keep slots short. Offload heavy work with `QtConcurrent::run` + `QFutureWatcher`, a `QThreadPool`/`QRunnable`, or a worker object on a `QThread`, and deliver results back with a signal. For I/O, prefer Qt's **async** APIs (`QNetworkAccessManager`, `QProcess`, sockets) that already return via signals — don't busy-wait on them. Avoid `QCoreApplication::processEvents()` as a way to \"unfreeze\" — it re-enters the event loop and causes subtle recursion/lifetime bugs." },

        { type: "heading", text: "5. The moc/build pipeline: vtable & missing-symbol errors" },
        { type: "p", text: "`Q_OBJECT` is a promise that **moc** will generate the class's meta-object (signals, slots, properties). If moc doesn't run on that class, you get link errors like `undefined reference to vtable for Foo` or `undefined reference to Foo::mySignal(int)` — the declarations exist but their generated bodies don't." },
        { type: "code", lang: "cpp", code: "// Foo.h — Q_OBJECT MUST live in a header that moc scans\nclass Foo : public QObject {\n    Q_OBJECT                       // moc reads THIS header and emits moc_Foo.cpp\npublic:\n    explicit Foo(QObject *parent = nullptr);\nsignals:\n    void changed(int);             // body generated by moc — never write it yourself\n};" },
        { type: "code", lang: "cmake", code: "# CMake: turn moc on so Q_OBJECT classes are processed automatically\nset(CMAKE_AUTOMOC ON)              # or qt_standard_project_setup()\nqt_add_executable(app main.cpp foo.h foo.cpp)  # list the HEADER too" },
        { type: "callout", variant: "gotcha", text: "**Fix:** put every `Q_OBJECT` class in a **header** (not a `.cpp`), enable **`CMAKE_AUTOMOC`** (or `qt_standard_project_setup()`), and make sure the header is reachable from a target. After adding `Q_OBJECT` to an existing class, **re-run CMake configure** so AUTOMOC picks it up — a stale build is the usual cause of a sudden vtable error. If `Q_OBJECT` is genuinely inside a `.cpp` file, add `#include \"file.moc\"` at the end so moc's output is compiled in." }
      ]
    }
  ],

  packages: [
    { name: "Qt Core (Qt6::Core)", why: "QObject, strings, containers, files, event loop — always linked" },
    { name: "Qt Gui (Qt6::Gui)", why: "Low-level GUI: painting, images, OpenGL/RHI, events" },
    { name: "Qt Widgets (Qt6::Widgets)", why: "Classic desktop widget set + layouts + Designer forms" },
    { name: "Qt Quick / Qml (Qt6::Quick, Qt6::Qml)", why: "Declarative QML UI + C++ integration engine" },
    { name: "Qt Network (Qt6::Network)", why: "Async HTTP(S), TCP/UDP sockets, TLS" },
    { name: "Qt Concurrent (Qt6::Concurrent)", why: "High-level parallel run/map/filter/reduce over QFuture" },
    { name: "Qt Sql (Qt6::Sql)", why: "SQL databases + model classes for views" },
    { name: "Qt Test (Qt6::Test)", why: "Unit testing (QTEST_MAIN, QSignalSpy, data-driven tests)" },
    { name: "CMake + Ninja", why: "Recommended Qt 6 build system & fast generator" },
    { name: "Qt Creator", why: "First-party IDE: Designer, QML editor, debugger, profiler" },
    { name: "vcpkg / Conan", why: "C++ package managers that can provide Qt + third-party deps" },
    { name: "aqtinstall (aqt)", why: "Account-free scriptable Qt installer for CI" }
  ],

  gotchas: [
    "A class using signals/slots/properties **must** have `Q_OBJECT` in a **header** that moc processes — otherwise 'undefined reference to vtable' or missing signal symbols. Re-run CMake after adding it.",
    "`QObject` is **non-copyable** — pass by pointer/reference. Its *value* types (`QString`, `QList`) are copyable and copy-on-write.",
    "Parent-child ownership deletes children automatically — do **not** also put a parented `QObject` in a smart pointer or `delete` it. Two owners = crash.",
    "Never touch GUI objects from a worker thread. Communicate results back with a **queued signal** to the GUI thread.",
    "Don't subclass `QThread`/override `run()` for typical work — use the **worker-object + moveToThread** pattern instead.",
    "Views won't update unless the model announces changes (`beginInsertRows`/`endInsertRows`, `emit dataChanged`).",
    "Always `deleteLater()` a `QNetworkReply` when finished, and never busy-wait on it — that stalls the event loop it needs.",
    "Blocking the GUI thread (a long loop, `sleep`, sync I/O) freezes the UI — offload to `QtConcurrent`/a worker thread.",
    "Mixing `QString` with `const char*`/`std::string` implicitly can mangle non-ASCII text — convert explicitly with `toUtf8()`/`fromUtf8()`.",
    "Deployment: ship the **platform plugin** (`platforms/`) via `windeployqt`/`macdeployqt` or you get 'could not find the Qt platform plugin'.",
    "For lambda connections that touch other objects, pass a **context QObject** so the connection dies with it.",
    "Static linking of open-source Qt triggers LGPL/GPL relinking obligations — check licensing before you ship.",
    "**Silent connect() failures:** the string-based `SIGNAL()/SLOT()` macros only warn at runtime on a typo/signature mismatch — use the compile-checked `connect(src, &Src::sig, dst, &Dst::slot)` form. `connect()` returns a falsy `Connection` when it fails.",
    "**Ownership double-free:** never give the same `QObject` both a parent and a smart pointer, and never `delete` (or stack-allocate) a widget you handed to a layout — the layout reparents it. Use `QPointer<T>` for a non-owning \"maybe-dead\" reference.",
    "After adding `Q_OBJECT` to a class, **re-run CMake configure** — a stale AUTOMOC build causes a sudden `undefined reference to vtable` error even though the code is correct."
  ],

  flashcards: [
    { q: "What does the `Q_OBJECT` macro enable, and what runs on it?", a: "Signals, slots, properties, `tr()` and runtime introspection. **moc** (the Meta-Object Compiler) processes the header to generate the implementation. It must be in a header moc sees." },
    { q: "How does Qt manage memory for GUI objects without smart pointers?", a: "The **parent-child object tree**: `new` a `QObject` with a parent; when the parent is destroyed it deletes all children. You rarely call `delete` yourself." },
    { q: "Why prefer the pointer-to-member `connect()` over `SIGNAL()/SLOT()`?", a: "It is **compile-time type-checked**, refactor-safe, allows lambdas and implicit argument conversion. The string macros only fail at runtime with a console warning." },
    { q: "What connection type is used by default across threads, and why does it matter?", a: "`Qt::AutoConnection` becomes a **queued** connection when sender and receiver are in different threads, so the slot safely runs in the receiver's thread event loop (arguments are copied)." },
    { q: "What is implicit sharing (copy-on-write) in Qt value types?", a: "Copying (e.g. a `QString` or `QList`) is cheap — it shares one data block via refcount. A deep copy (**detach**) happens only on the first modification." },
    { q: "What's the recommended way to run a long task off the GUI thread?", a: "For simple functions use `QtConcurrent::run` + `QFutureWatcher`; for a stateful worker use a `QObject` + `moveToThread(thread)` driven by signals — **not** subclassing `QThread`." },
    { q: "In Model/View, why might a view not reflect data changes?", a: "The model didn't **notify**: mutations must be wrapped in `beginInsertRows`/`endInsertRows` (etc.) or emit `dataChanged()`." },
    { q: "How do you expose a C++ class to QML in modern Qt 6?", a: "Derive from `QObject`, add `QML_ELEMENT`, expose data via `Q_PROPERTY` (with `NOTIFY`), methods via `Q_INVOKABLE`/slots, and declare the module with CMake's `qt_add_qml_module`." },
    { q: "What is the safe way to delete a QObject from inside its own slot?", a: "`deleteLater()` — it schedules destruction for when control returns to the event loop, avoiding deletion of an object mid-signal." },
    { q: "What does `qobject_cast<T*>` offer over `dynamic_cast`?", a: "It uses the meta-object system: faster, works across DLL boundaries, returns `nullptr` on mismatch — but only for `QObject`-derived types." },
    { q: "What's the difference between signals/slots and the event system?", a: "**Events** are low-level input/system messages dispatched via `event()`/handlers; **signals** are higher-level application notifications. Widgets often translate events into signals (a mouse-release becomes `clicked()`)." },
    { q: "Which Qt license lets you keep proprietary source, and what's the catch?", a: "**LGPLv3** — allowed if you **dynamically link** Qt and let users relink a modified Qt. Static linking or GPL-only modules impose stronger obligations; the **commercial** license removes them." },
    { q: "What is a QAction and why use one instead of wiring a button directly?", a: "A `QAction` is one object for a user command (text, icon, shortcut, enabled state). Add it to a **menu, a toolbar and a shortcut** at once — all fire `triggered()`, and enabling/disabling the action updates all three together." },
    { q: "What are the rules of custom painting with QPainter?", a: "Paint only inside `paintEvent()` (or onto an off-screen `QImage`/`QPixmap`); never call `paintEvent()` directly — call `update()` to request a repaint. The same painter code targets widgets, images, SVG or PDF." },
    { q: "When do you use Graphics View instead of hand-painting?", a: "For many interactive 2D objects (diagram/CAD/games): a `QGraphicsScene` holds `QGraphicsItem`s shown by a `QGraphicsView`, handling selection, z-order, hit-testing, zoom/pan for you." },
    { q: "In QML, what are the three ways to position items?", a: "**Anchors** (glue edges: `anchors.fill/centerIn`), **positioners** (`Row`/`Column`/`Grid` auto-arrange), and **Qt Quick Layouts** (`RowLayout`/`ColumnLayout` that *resize* children via `Layout.fillWidth` etc.)." },
    { q: "How does a QML ListView render data?", a: "It binds a `model` (number, JS array, `ListModel`, or a C++ `QAbstractListModel`) and stamps one `delegate` per item; model **roles** are available by name inside the delegate (plus `index`/`modelData`). It virtualizes long lists." },
    { q: "How does QML animate between UI configurations?", a: "Declare named **`State`s** (each a set of `PropertyChanges`) and **`Transition`s** that animate the moves. Or use `Behavior on prop { NumberAnimation{} }` to auto-animate every change to a property." },
    { q: "Why does a slot never fire even though the code compiles and runs?", a: "Almost always a **thread-affinity** or **connection** issue: a string-based `SIGNAL()/SLOT()` typo (fails silently at runtime), a missing `Q_OBJECT`/stale moc build, or the receiver lives in another thread with no event loop running. Use the function-pointer `connect()` (compile-checked) and check `connect()`'s return value." },
    { q: "You call `label->setText()` from a std::thread and the app crashes randomly — why, and what's the fix?", a: "GUI objects have **thread affinity** to the main thread; touching them from another thread is undefined behaviour. Marshal the call back with a **queued** signal/slot or `QMetaObject::invokeMethod(label, fn, Qt::QueuedConnection)`; do heavy work on a worker moved via `moveToThread`." }
  ],

  cheatsheet: [
    { label: "Find Qt (CMake)", code: "find_package(Qt6 REQUIRED COMPONENTS Widgets)" },
    { label: "Link a module", code: "target_link_libraries(app PRIVATE Qt6::Widgets)" },
    { label: "Executable + AUTO*", code: "qt_standard_project_setup(); qt_add_executable(app main.cpp)" },
    { label: "Connect signal", code: "connect(btn, &QPushButton::clicked, this, &W::onClick);" },
    { label: "Connect lambda (+ctx)", code: "connect(src, &Src::sig, this, [this]{ ... });" },
    { label: "Emit", code: "emit progress(value);" },
    { label: "Property", code: "Q_PROPERTY(int x READ x WRITE setX NOTIFY xChanged)" },
    { label: "Move to thread", code: "worker->moveToThread(thread); thread->start();" },
    { label: "Action + shortcut", code: "act->setShortcut(QKeySequence::Open); menu->addAction(act);" },
    { label: "Open-file dialog", code: "QFileDialog::getOpenFileName(this, tr(\"Open\"));" },
    { label: "Paint", code: "void paintEvent(QPaintEvent*){ QPainter p(this); p.drawRect(r); }" },
    { label: "Animate property", code: "new QPropertyAnimation(obj, \"geometry\");" },
    { label: "QML fill parent", code: "anchors.fill: parent" },
    { label: "QML list", code: "ListView { model: m; delegate: ItemDelegate {} }" },
    { label: "Background run", code: "QtConcurrent::run([]{ return work(); });" },
    { label: "Async HTTP GET", code: "auto *r = nam->get(QNetworkRequest(url));" },
    { label: "Safe delete", code: "obj->deleteLater();" },
    { label: "Deploy (Windows)", code: "windeployqt --qmldir src app.exe" },
    { label: "Invoke on GUI thread", code: "QMetaObject::invokeMethod(w, fn, Qt::QueuedConnection);" },
    { label: "Guarded pointer", code: "QPointer<QWidget> p = dlg; if (p) p->raise();" }
  ]
});
