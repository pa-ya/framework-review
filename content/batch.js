(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "batch",
  name: "Batch (Windows)",
  language: "Batch",
  group: "Shell scripting",
  navLabel: "Batch",
  color: "#0078D6",
  readMinutes: 26,
  tagline: "The **scripting language of `cmd.exe`** — `.bat`/`.cmd` files that glue together Windows console commands. Quirky, backslash-heavy, and full of sharp edges (delayed expansion, `%%` in loops, `set` spacing), but it still runs *everywhere* on Windows with zero install. This deck takes you from `@echo off` to `for /F` parsing, subroutines, error handling, and knowing exactly when to walk away and use **PowerShell** instead.",

  sections: [
    {
      id: "overview",
      title: "Overview & the mental model",
      level: "core",
      body: [
        { type: "p", text: "**Batch** is the scripting language interpreted by **`cmd.exe`**, the classic Windows Command Prompt (a descendant of DOS's `COMMAND.COM`). A *batch file* is just a plain-text file of commands — the same commands you'd type at the prompt — that `cmd.exe` reads and runs top-to-bottom. There is no separate runtime to install: `cmd.exe` ships in every Windows since forever, which is exactly why batch endures." },
        { type: "p", text: "The mental model is **line-oriented and imperative**: each line is a command, executed in order, and control flow (`if`, `for`, `goto`) jumps around those lines. Unlike a real programming language there are no true functions with local scope, no data structures beyond strings, and no arrays — everything is a **string** stored in an *environment variable*. Batch is a macro-expansion layer over the console: the shell substitutes `%VAR%` into text, then runs the resulting command." },
        { type: "callout", variant: "note", text: "**`.bat` vs `.cmd`** — both are batch scripts and behave almost identically. `.bat` dates to DOS; `.cmd` was introduced with Windows NT. The one real difference: some internal commands (notably `set` and `path`) reset `%ERRORLEVEL%` to 0 on success in a `.cmd`, but *not* in a `.bat`. Prefer **`.cmd`** on modern Windows — it has saner errorlevel behaviour. Both are run by the same `cmd.exe`." },
        { type: "heading", text: "How to run a batch file" },
        { type: "list", items: [
          "**Double-click** it in Explorer — opens a console window, runs, and (unless you `pause`) the window slams shut the instant it finishes.",
          "**From an open prompt**: type the name (`script.bat`) or `.\\script.bat`. The current directory and `%PATH%` are searched.",
          "**`cmd /c script.bat`** — run it in a new `cmd` and *close* when done. **`cmd /k script.bat`** — run it and *keep* the window open afterwards (great for debugging a double-click script).",
          "**Win+R (Run box)** — type the full path, or `cmd /k \"C:\\tools\\script.bat\"` to see the output.",
          "**As Administrator** — right-click, \"Run as administrator\" (or launch an elevated `cmd` first). Many system commands need this."
        ] },
        { type: "code", lang: "batch", code: "@echo off\nrem hello.cmd - the classic first script\necho Hello from cmd.exe on %COMPUTERNAME%!\necho The time is %TIME% and this script lives in \"%~dp0\"\npause" },
        { type: "heading", text: "Batch vs PowerShell — say it plainly" },
        { type: "callout", variant: "warn", text: "**For anything non-trivial today, prefer PowerShell.** PowerShell has real variables, objects, arrays, error handling (`try/catch`), functions, and a coherent standard library — everything batch lacks. Batch remains worth knowing because it's *universal* (no execution-policy hurdle, runs on every Windows, needed for installers, legacy tooling, `npm`/CI scripts on Windows, and quick one-off automation). Learn batch to read and maintain what exists and to write small glue scripts; reach for **PowerShell** the moment you need data structures, JSON, HTTP, or anything you'd call \"a program.\"" },
        { type: "callout", variant: "tip", text: "Batch is **case-insensitive** for commands, filenames, and (mostly) variable names: `ECHO`, `echo`, and `Echo` are the same, and `%PATH%` == `%path%`. String *comparisons* you write are case-sensitive by default though — use the `/i` flag on `if` and `find`/`findstr` to ignore case." }
      ]
    },
    {
      id: "console-basics",
      title: "The console basics",
      level: "core",
      body: [
        { type: "p", text: "A handful of commands and symbols show up in nearly every script. Master these first — they control echoing, output, screen, and how you chain commands together." },
        { type: "code", lang: "batch", code: "@echo off\nrem  ^ @echo off silences the \"echo the command before running it\" behaviour.\nrem    The leading @ on THIS line hides the `echo off` command itself.\n\ntitle My Build Script          rem set the console window title\ncolor 0A                       rem black background (0), bright green text (A)\ncls                            rem clear the screen\n\necho Building the project...   rem print a line of text\necho.                          rem print a BLANK line (the dot is required!)\necho Done.\n\npause                          rem \"Press any key to continue . . .\" and wait" },
        { type: "table", headers: ["Command", "Does"], rows: [
          ["`@echo off`", "stop printing each command before it runs; the `@` hides this line too"],
          ["`echo text`", "print `text`; `echo on`/`echo off` toggle command echoing"],
          ["`echo.`", "print a **blank line** (no space between `echo` and `.`)"],
          ["`echo(`", "alternative blank line that's safe even when the text could be `on`/`off`"],
          ["`pause`", "print \"Press any key to continue . . .\" and wait for a keypress"],
          ["`cls`", "clear the screen"],
          ["`title text`", "set the console window title bar"],
          ["`color 0A`", "set colours: first hex digit = background, second = foreground"],
          ["`chcp 65001`", "switch the console **code page** to UTF-8 (for non-ASCII output)"],
          ["`exit`", "close the whole `cmd.exe` (and the window, if it owns one)"],
          ["`exit /b`", "leave only the **current script** (or subroutine), keeping `cmd` alive"]
        ] },
        { type: "heading", text: "Comments: rem and ::" },
        { type: "code", lang: "batch", code: "rem This is a comment. `rem` is a real command, so it's a bit slow in tight loops.\n:: This is the OTHER comment style — a label that starts with a colon.\n::  It's faster than rem but has two traps:\n::  1) it BREAKS inside a for/if block (see the gotcha) — use rem there instead.\n::  2) `::` on the same line after a command doesn't work; comments must be their own line.\necho Running   rem  <-- an inline rem AFTER a command also works but is unusual" },
        { type: "callout", variant: "gotcha", text: "`::` comments are actually invalid labels that `cmd` skips. Inside a **parenthesised block** (an `if (...)` or `for (...)` body) a `::` line can cause a syntax error (\"The syntax of the command is incorrect\") because the parser mishandles it. **Rule:** use `rem` for comments inside `(...)` blocks; `::` is fine at the top level." },
        { type: "heading", text: "Chaining commands: & && || ^" },
        { type: "code", lang: "batch", code: "cmd1 & cmd2       rem run cmd1 THEN cmd2, unconditionally (like ; in bash)\ncmd1 && cmd2      rem run cmd2 only if cmd1 SUCCEEDED (errorlevel 0)\ncmd1 || cmd2      rem run cmd2 only if cmd1 FAILED (errorlevel != 0)\n\nrem  ^ at end of line = continue the command onto the next line (line continuation)\ncopy \"C:\\src\\file.txt\" ^\n     \"C:\\dst\\file.txt\"\n\nrem  practical: build, and only test if the build succeeded, else report\nbuild.exe && echo BUILD OK || echo BUILD FAILED" },
        { type: "callout", variant: "tip", text: "`&`, `|`, `<`, `>`, `^`, `%`, and `\"` are **special** to `cmd`. To print one literally with `echo`, escape it with a caret: `echo Tom ^& Jerry` prints `Tom & Jerry`. A literal percent in a script needs to be **doubled**: `echo 100%%` prints `100%`. (On the interactive command line a single `%` is fine — the doubling rule is a *script* thing.)" }
      ]
    },
    {
      id: "filesystem",
      title: "Navigation & filesystem commands",
      level: "core",
      body: [
        { type: "p", text: "Batch scripting is mostly *moving and manipulating files*. These are the console commands you'll lean on constantly. Note Windows uses **backslashes** `\\` in paths (though most commands accept `/` too), and paths with spaces **must be quoted**." },
        { type: "code", lang: "batch", code: "cd /d \"C:\\Program Files\\MyApp\"   rem change dir; /d also switches DRIVE (C: -> D:)\ncd                                rem with no args, PRINTS the current directory\ndir                               rem list files (verbose, with sizes/dates)\ndir /b                            rem /b = bare: names only, one per line (scriptable!)\ndir /s /b *.log                   rem /s = recurse subfolders; find every .log\ndir /a:d /b                       rem /a:d = only directories;  /a:h = hidden, etc.\n\npushd \"\\\\server\\share\\folder\"     rem cd there AND remember where we were (maps a drive for UNC)\npopd                              rem return to the pushd'd-from directory" },
        { type: "table", headers: ["Command", "Purpose", "Key flags"], rows: [
          ["`cd` / `chdir`", "change / show current directory", "`/d` also change drive"],
          ["`dir`", "list directory contents", "`/b` bare, `/s` recurse, `/a` attributes, `/o` order"],
          ["`pushd` / `popd`", "cd with a directory stack (auto-maps UNC paths)", "—"],
          ["`copy`", "copy a file (single file, simple)", "`/y` overwrite w/o prompt"],
          ["`xcopy`", "copy files **and trees** (legacy)", "`/s` subdirs, `/e` incl empty, `/i` assume dir"],
          ["`robocopy`", "**robust** copy/mirror — the good one", "`/mir` mirror, `/e`, `/z` resumable, `/mt` multithread"],
          ["`move`", "move / rename files and folders", "`/y` overwrite w/o prompt"],
          ["`del` / `erase`", "delete files", "`/f` force, `/s` recurse, `/q` quiet"],
          ["`ren` / `rename`", "rename a file (same folder)", "—"],
          ["`md` / `mkdir`", "make directory (creates intermediates)", "—"],
          ["`rd` / `rmdir`", "remove directory", "`/s` incl contents, `/q` quiet"],
          ["`type`", "print a file's contents to the console", "—"],
          ["`tree`", "draw the folder tree", "`/f` show files, `/a` ASCII lines"],
          ["`attrib`", "view / change file attributes (R/H/S/A)", "`+`/`-` to set/clear"],
          ["`where`", "find a command/file on `%PATH%` (like `which`)", "`where /r . *.txt`"]
        ] },
        { type: "heading", text: "robocopy — the one worth learning" },
        { type: "code", lang: "batch", code: "rem Mirror a source tree to a backup (deletes extras in dest to match source!)\nrobocopy \"C:\\Projects\\app\" \"D:\\Backup\\app\" /mir /z /r:2 /w:5\nrem  /mir  mirror (copy tree AND purge dest files not in source)\nrem  /z    restartable mode (survives a dropped network connection)\nrem  /r:2  retry a failed file twice; /w:5 wait 5s between retries\nrem  /mt:8 (optional) copy with 8 threads for speed\nrem  /xd node_modules .git    exclude these directories\nrem  /xf *.tmp                exclude these files" },
        { type: "callout", variant: "warn", text: "**`robocopy /mir` deletes.** Mirroring makes the destination *identical* to the source, which means any file in the destination that isn't in the source **is deleted**. Point `/mir` at the wrong destination (e.g. an existing folder full of data) and you wipe it. Always double-check both paths, and test with `/l` (list-only, changes nothing) first." },
        { type: "callout", variant: "gotcha", text: "**`robocopy`'s exit codes are not 0-means-success.** It returns a *bitmask*: 0 = nothing copied, 1 = files copied OK, 2 = extra files, 3 = 1+2, and anything **>= 8** is a genuine error. So `if errorlevel 8` is the correct \"did it fail?\" test — treating any non-zero as failure will wrongly flag a successful copy. See the error-handling section." }
      ]
    },
    {
      id: "variables",
      title: "Variables & expansion (incl. delayed expansion)",
      level: "core",
      body: [
        { type: "p", text: "Every variable in batch is an **environment variable** holding a **string**. You set one with `set`, read it by wrapping it in percent signs (`%VAR%`), and — this is the single biggest source of bugs — you sometimes need `!VAR!` instead. Read this section carefully; delayed expansion trips up everyone." },
        { type: "code", lang: "batch", code: "set NAME=Ada                 rem assign — but a trailing space becomes part of the value!\nset \"NAME=Ada\"               rem PREFERRED form: quotes pin the value, no stray spaces\nset \"GREETING=Hello there\"   rem quote the WHOLE `name=value`, not the value alone\necho %NAME% says %GREETING%\n\nset PATH_TO=C:\\Users\\me\\docs rem backslashes in values are fine, no escaping needed\nset /a SUM=2+3*4             rem /a = ARITHMETIC (integer only): SUM becomes 14\nset /a COUNT+=1              rem += -= *= /= all work\nset /p ANSWER=Continue? (y/n)  rem /p = PROMPT the user, read a line into ANSWER" },
        { type: "callout", variant: "warn", text: "**No spaces around the `=`.** `set X = 5` creates a variable literally named `X ` (with a trailing space) holding ` 5` (with a leading space) — a classic head-scratcher. Always write `set \"X=5\"`. The quoted form also prevents a trailing space after `5` (e.g. from an editor) from sneaking into the value." },
        { type: "heading", text: "Built-in / dynamic variables worth knowing" },
        { type: "table", headers: ["Variable", "Value"], rows: [
          ["`%CD%`", "current directory (full path)"],
          ["`%USERPROFILE%`", "the user's home, e.g. `C:\\Users\\me`"],
          ["`%APPDATA%`", "roaming app data, `C:\\Users\\me\\AppData\\Roaming`"],
          ["`%LOCALAPPDATA%`", "local app data (per-machine, not roamed)"],
          ["`%TEMP%` / `%TMP%`", "the temp directory"],
          ["`%PATH%`", "the executable search path (semicolon-separated)"],
          ["`%COMPUTERNAME%` / `%USERNAME%`", "machine and logged-in user names"],
          ["`%SystemRoot%` / `%windir%`", "the Windows directory, usually `C:\\Windows`"],
          ["`%RANDOM%`", "a fresh random integer 0–32767 each time it's read"],
          ["`%DATE%` / `%TIME%`", "current date / time (format depends on locale!)"],
          ["`%ERRORLEVEL%`", "exit code of the last command (0 = success, usually)"],
          ["`%CMDCMDLINE%`", "the full command line that launched this `cmd`"]
        ] },
        { type: "heading", text: "setlocal / endlocal — scoping" },
        { type: "p", text: "By default `set` mutates the *process* environment, and those changes leak out after the script ends (when run in an existing prompt). Wrap your script in **`setlocal ... endlocal`** to make a private copy of the environment: everything you `set` inside is discarded at `endlocal`, keeping the caller's environment clean." },
        { type: "code", lang: "batch", code: "@echo off\nsetlocal                     rem start a private environment scope\nset \"TEMP_VAR=only visible in here\"\ncd \"C:\\somewhere\"            rem even the current directory is restored by endlocal\nrem ... do work ...\nendlocal                     rem TEMP_VAR and the cd are undone here (implicit at EOF too)" },
        { type: "heading", text: "Delayed expansion — the #1 batch gotcha" },
        { type: "p", text: "`cmd` expands `%VAR%` **once, when it parses the whole line/block** — *before* the block runs. So inside a `for` loop or an `if (...)` block, every `%VAR%` is replaced with the value the variable had *before the loop started*, not its updated value each iteration. To read the *current* value at run time you must enable **delayed expansion** and use **`!VAR!`** instead." },
        { type: "code", lang: "batch", code: "@echo off\nsetlocal enabledelayedexpansion       rem turn on !VAR! syntax\n\nset \"count=0\"\nfor %%f in (a b c) do (\n    set /a count+=1\n    echo WRONG: %count%   -- prints 0 every time (expanded once, before the loop)\n    echo RIGHT: !count!   -- prints 1, 2, 3 (read fresh each iteration)\n)\necho Final count is !count!\nendlocal" },
        { type: "callout", variant: "gotcha", text: "**Rule of thumb:** the moment you `set` a variable *inside* a `for` or `if` block and read it back in the same block, you need `setlocal enabledelayedexpansion` and `!VAR!`. Using `%VAR%` there gives you the pre-block value — the bug looks like \"my counter never increments.\" The trade-off: with delayed expansion on, a literal `!` in your data must be escaped as `^^!` — so enable it only in scripts that actually need it." }
      ]
    },
    {
      id: "strings",
      title: "String manipulation & substitution",
      level: "core",
      body: [
        { type: "p", text: "Batch has a surprisingly capable (if cryptic) set of string operations built into variable expansion: **substrings**, **search-and-replace**, and **length**. They only work on real variables (`%VAR%`), not on literals or `%1` arguments directly — assign to a variable first if needed." },
        { type: "heading", text: "Substrings — %VAR:~start,length%" },
        { type: "code", lang: "batch", code: "set \"s=Hello, World\"\necho %s:~0,5%      rem \"Hello\"        (start at 0, take 5 chars)\necho %s:~7%        rem \"World\"        (from index 7 to the end)\necho %s:~-5%       rem \"World\"        (last 5 chars — negative start counts from the end)\necho %s:~0,-7%     rem \"Hello\"        (all but the last 7 chars)\necho %s:~3,4%      rem \"lo, \"         (4 chars starting at index 3)" },
        { type: "heading", text: "Search & replace — %VAR:find=replace%" },
        { type: "code", lang: "batch", code: "set \"path=C:\\a\\b\\c\"\necho %path:\\=/%          rem replace every backslash with a slash -> C:/a/b/c\n\nset \"csv=one,two,three\"\necho %csv:,=; %          rem -> one; two; three  (replace commas with \"; \")\n\nset \"noisy=  trimme  \"\nset \"quiet=%noisy: =%\"   rem remove ALL spaces (replace space with nothing)\n\nrem  Replace only when the value STARTS with the text: use * before the find token\nset \"url=http://example.com\"\necho %url:*//=%          rem -> example.com  (delete everything up to and incl the first //)" },
        { type: "heading", text: "String length (no built-in — a small trick)" },
        { type: "code", lang: "batch", code: "@echo off\nsetlocal enabledelayedexpansion\nset \"str=measure me\"\nset \"len=0\"\n:strlen_loop\nif not \"!str:~%len%,1!\"==\"\" (\n    set /a len+=1\n    goto strlen_loop\n)\necho Length is %len%\nendlocal" },
        { type: "callout", variant: "gotcha", text: "Substring and replace syntax **cannot** be applied to `%1`…`%9` arguments directly (`%1:~0,3%` is a syntax error). Copy the argument into a variable first: `set \"arg=%~1\"` then use `%arg:~0,3%`. Also, inside a `for`/`if` block these operations follow the same delayed-expansion rule — use `!VAR:...!`." },
        { type: "callout", variant: "tip", text: "Case conversion is *not* built in. The common hack is a chain of `%VAR:a=A%` replacements for each letter (ugly), or — far better — shell out once to PowerShell: `for /f %%u in ('powershell -c \"'%name%'.ToUpper()\"') do set \"upper=%%u\"`. When string work gets real, that's your signal to switch to PowerShell." }
      ]
    },
    {
      id: "arguments",
      title: "Arguments & the %~ parameter modifiers",
      level: "core",
      body: [
        { type: "p", text: "A script receives command-line arguments as **`%1`** through **`%9`** (`%0` is the script's own name/path). `%*` is *all* arguments as one string. Beyond nine, you use `shift` to slide the window. The real power is the **`%~` modifiers**, which dissect a path argument into drive, folder, name, and extension — no external tools needed." },
        { type: "code", lang: "batch", code: "@echo off\nrem  Called as:  deploy.cmd staging \"C:\\build\\app.zip\"\necho Script name : %0        rem deploy.cmd (or its full path, depending on how invoked)\necho First arg   : %1        rem staging\necho Second arg  : %2        rem \"C:\\build\\app.zip\"  (quotes INCLUDED)\necho All args    : %*        rem staging \"C:\\build\\app.zip\"\necho Stripped    : %~2       rem C:\\build\\app.zip     (surrounding quotes REMOVED)" },
        { type: "heading", text: "The %~ modifiers (shown on %1)" },
        { type: "table", headers: ["Modifier", "Gives you", "For `%1` = `\"C:\\build\\app.zip\"`"], rows: [
          ["`%~1`", "the value with surrounding quotes stripped", "`C:\\build\\app.zip`"],
          ["`%~f1`", "**f**ull absolute path", "`C:\\build\\app.zip`"],
          ["`%~d1`", "**d**rive letter only", "`C:`"],
          ["`%~p1`", "**p**ath (folders) only", "`\\build\\`"],
          ["`%~dp1`", "**d**rive + **p**ath", "`C:\\build\\`"],
          ["`%~n1`", "**n**ame without extension", "`app`"],
          ["`%~x1`", "e**x**tension (with the dot)", "`.zip`"],
          ["`%~nx1`", "**n**ame + e**x**tension (the filename)", "`app.zip`"],
          ["`%~s1`", "the **s**hort 8.3 path", "`C:\\build\\app.zip`"],
          ["`%~t1`", "last-modified **t**imestamp of the file", "`2026-07-08 14:30`"],
          ["`%~z1`", "file si**z**e in bytes", "`10485760`"],
          ["`%~a1`", "file **a**ttributes", "`--a------`"]
        ] },
        { type: "callout", variant: "tip", text: "You can **combine** modifiers: `%~dpnx1` = drive+path+name+ext (the fully-qualified path). And `%~$PATH:1` searches `%PATH%` for the file named in `%1` and returns its full path (or empty if not found) — a poor man's `where`." },
        { type: "heading", text: "%~dp0 — the single most useful idiom" },
        { type: "code", lang: "batch", code: "@echo off\nrem  %0 is THIS script. So %~dp0 is the folder this script lives in,\nrem  WITH a trailing backslash. It makes a script location-independent:\nrem  it can find its own sibling files no matter what the current directory is.\n\ncd /d \"%~dp0\"                     rem make the script's own folder the working dir\ncall \"%~dp0lib\\helpers.cmd\"       rem call a helper next to this script\nset \"CONFIG=%~dp0config\\app.ini\"  rem reference a config relative to the script\necho This script is: %~f0        rem the script's own full path" },
        { type: "callout", variant: "gotcha", text: "`%~dp0` **ends with a backslash**, so concatenate directly: `\"%~dp0config.ini\"` (correct), not `\"%~dp0\\config.ini\"` (double backslash — usually still works, but sloppy). Also note `%0` inside a **`call`ed subroutine** is still the *script* name, but the modifiers behave the same. Always **quote** `\"%~dp0\"` — the path may contain spaces (`C:\\Program Files\\...`)." },
        { type: "heading", text: "shift — sliding past %9" },
        { type: "code", lang: "batch", code: "@echo off\nrem  Process an arbitrary number of arguments by consuming them one at a time.\n:next\nif \"%~1\"==\"\" goto done      rem no more args -> stop\necho Processing: %~1\nshift                        rem %2 becomes %1, %3 becomes %2, ... %0 unchanged by default\ngoto next\n:done\necho All arguments processed." }
      ]
    },
    {
      id: "control-flow",
      title: "Control flow: if, else, comparisons",
      level: "core",
      body: [
        { type: "p", text: "`if` is batch's conditional. It has three broad forms: testing **strings**, testing **file/variable existence**, and testing **errorlevels**. The syntax is fussy — quoting and brace placement matter." },
        { type: "code", lang: "batch", code: "rem  String comparison — ALWAYS quote BOTH sides so an empty value can't break the syntax\nif \"%name%\"==\"admin\" (\n    echo Welcome, administrator\n) else (\n    echo Hello, %name%\n)\n\nif /i \"%answer%\"==\"y\"  echo Confirmed   rem /i = case-INsensitive compare\nif not \"%name%\"==\"\"   echo Name was provided" },
        { type: "callout", variant: "gotcha", text: "**Quote both sides of a string compare.** If `%name%` is empty, `if %name%==admin` expands to `if ==admin` — a syntax error that aborts the script. Writing `if \"%name%\"==\"admin\"` expands to `if \"\"==\"admin\"` which is valid (and false). This bug bites when a variable is unexpectedly blank." },
        { type: "heading", text: "Existence tests: exist and defined" },
        { type: "code", lang: "batch", code: "if exist \"C:\\data\\input.csv\"   echo The file is there\nif not exist \"%TEMP%\\lock\"     echo No lock file\nif exist \"C:\\logs\\\"           echo That folder exists   rem trailing \\ tests a DIRECTORY\n\nif defined MY_VAR   echo MY_VAR is set to: %MY_VAR%\nif not defined MY_VAR   echo MY_VAR is not set   rem note: NO percent signs around the name" },
        { type: "heading", text: "Numeric comparisons" },
        { type: "p", text: "`==` is a **string** equality test. For numbers, use the letter operators, which compare numerically." },
        { type: "table", headers: ["Operator", "Meaning", "Example"], rows: [
          ["`EQU`", "equal", "`if %n% EQU 10 ...`"],
          ["`NEQ`", "not equal", "`if %n% NEQ 0 ...`"],
          ["`LSS`", "less than", "`if %n% LSS 5 ...`"],
          ["`LEQ`", "less than or equal", "`if %n% LEQ 5 ...`"],
          ["`GTR`", "greater than", "`if %n% GTR 100 ...`"],
          ["`GEQ`", "greater than or equal", "`if %n% GEQ 1 ...`"]
        ] },
        { type: "code", lang: "batch", code: "set /a age=25\nif %age% GEQ 18 (echo adult) else (echo minor)\n\nrem  Careful: EQU/GTR compare NUMERICALLY only if BOTH sides look like numbers;\nrem  otherwise they fall back to a string compare. `if 09 EQU 9` is TRUE (numeric),\nrem  but `if abc GTR 5` compares as strings.  Sanitize input before comparing." },
        { type: "callout", variant: "warn", text: "**The same-line brace rule.** When you use `(...)` blocks with `else`, the `) else (` must be on **one line** — `cmd` needs to see the `else` right after the closing paren. Writing the `else` on its own next line is a syntax error. Also, the whole `if (...) else (...)` is parsed as *one* statement, so `%VAR%` set inside a branch won't be visible later in that same block without delayed expansion." }
      ]
    },
    {
      id: "loops",
      title: "Loops: the many faces of for",
      level: "core",
      body: [
        { type: "p", text: "Batch has essentially **one** loop keyword — `for` — but with several modes selected by a flag (`/L`, `/F`, `/D`, `/R`). This is one of batch's most powerful and most confusing features. The universal quirk: in a *script* the loop variable is written **`%%i`** (doubled percent); on the *interactive command line* it's a single **`%i`**." },
        { type: "callout", variant: "gotcha", text: "**`%%i` in a `.bat`/`.cmd`, `%i` at the prompt.** This is the #1 \"why does my for loop error\" confusion. Scripts double the percent because `cmd` already consumed single `%` for variable expansion during parsing. If you copy a `for` command from the interactive prompt into a script, remember to double the loop-variable percents." },
        { type: "heading", text: "Basic for — iterate a set" },
        { type: "code", lang: "batch", code: "rem  Iterate a literal list\nfor %%c in (red green blue) do echo Colour: %%c\n\nrem  Iterate files matching a wildcard (the classic use)\nfor %%f in (*.txt) do echo Found file: %%f\n\nrem  %%~nxf etc. — the SAME ~ modifiers as arguments work on the loop var\nfor %%f in (C:\\logs\\*.log) do echo %%~nxf is %%~zf bytes" },
        { type: "heading", text: "for /L — a numeric counter" },
        { type: "code", lang: "batch", code: "rem  for /L %%i in (start,step,end)  — an inclusive counting loop\nfor /L %%i in (1,1,5) do echo Count %%i        rem 1 2 3 4 5\nfor /L %%i in (10,-2,0) do echo Down %%i        rem 10 8 6 4 2 0\nfor /L %%i in (0,1,100) do echo Percent: %%i%%  rem note %% for a literal percent sign" },
        { type: "heading", text: "for /D and /R — directories and recursion" },
        { type: "code", lang: "batch", code: "rem  /D  iterate DIRECTORIES (not files) matching a pattern\nfor /D %%d in (C:\\Projects\\*) do echo Project folder: %%d\n\nrem  /R  RECURSE a tree; walk every folder under the root and match a pattern\nfor /R \"C:\\src\" %%f in (*.tmp) do del \"%%f\"   rem delete every .tmp under C:\\src" },
        { type: "heading", text: "for /F — parse files & command output (the powerhouse)" },
        { type: "p", text: "**`for /F`** reads text — from a file, a literal string, or the *output of a command* — line by line, and splits each line into **tokens**. This is how batch does everything a real language would use `split()` and file iteration for. The options string controls the parsing:" },
        { type: "list", items: [
          "**`delims=`** — the delimiter characters to split on (default: space and tab). `delims=,` splits on commas; `delims=` (empty) means *don't split*, take the whole line.",
          "**`tokens=`** — which split pieces to capture into variables. `tokens=1,3` puts token 1 in `%%a` and token 3 in the *next* letter `%%b`. `tokens=2*` captures token 2 plus `*` = the rest of the line.",
          "**`skip=N`** — skip the first N lines (e.g. a CSV header).",
          "**`eol=`** — the end-of-line/comment character (default `;`); lines starting with it are ignored.",
          "**`usebackq`** — change quoting so you can use back-quotes for a command and double-quotes for a filename with spaces."
        ] },
        { type: "code", lang: "batch", code: "rem  Read a file line by line (whole line, no splitting)\nfor /F \"usebackq delims=\" %%L in (\"C:\\path\\notes.txt\") do echo LINE: %%L\n\nrem  Parse a CSV: skip the header, take columns 1 and 3\nfor /F \"skip=1 tokens=1,3 delims=,\" %%a in (data.csv) do echo Name=%%a  Score=%%b\n\nrem  Capture a COMMAND's output into a variable (the string-substitution workhorse)\nfor /F \"tokens=* usebackq\" %%v in (`hostname`) do set \"HOST=%%v\"\necho This machine is %HOST%\n\nrem  Split a fixed string right in the loop (single quotes = literal string source)\nfor /F \"tokens=1-3 delims=-\" %%a in (\"2026-07-08\") do echo Y=%%a M=%%b D=%%c" },
        { type: "callout", variant: "tip", text: "The **capture-command-output** idiom — `for /F ... in ('somecommand') do set \"VAR=%%v\"` — is batch's equivalent of `VAR=$(command)` in bash. There's no `$(...)`; this loop is how you get a command's result into a variable. Use back-quotes `` `cmd` `` with `usebackq`, or single quotes `'cmd'` without it." },
        { type: "callout", variant: "gotcha", text: "When looping and building up a variable inside the loop body, you'll hit the delayed-expansion trap again: `set /a total+=%%a` works (the `%%a` is the loop var, fine), but reading `%total%` back inside the loop shows the pre-loop value — use `!total!` with `setlocal enabledelayedexpansion`." }
      ]
    },
    {
      id: "subroutines",
      title: "Subroutines, labels & goto",
      level: "core",
      body: [
        { type: "p", text: "Batch structures code with **labels** (`:name`) and jumps (`goto`, `call`). There are no functions with parameters and return values in the usual sense, but `call :label args` plus `exit /b` gives you a workable approximation — a subroutine with its own `%1`…`%9`." },
        { type: "code", lang: "batch", code: "@echo off\ngoto :main            rem jump past the subroutine definitions to the real start\n\n:greet                rem a subroutine label\n    echo Hello, %~1!  rem inside a called sub, %1 is the sub's FIRST argument\n    exit /b 0         rem return to the caller (NOT exit — that kills the script)\n\n:add\n    set /a _result=%~1 + %~2\n    exit /b 0         rem \"return\" a value by leaving it in a known variable\n\n:main\n    call :greet World          rem prints \"Hello, World!\"\n    call :add 20 22\n    echo 20 + 22 = %_result%    rem read the sub's result variable\n    exit /b 0" },
        { type: "table", headers: ["Construct", "Meaning"], rows: [
          ["`:label`", "a jump target (a line starting with a colon)"],
          ["`goto :label`", "jump to `:label` and continue there (no return)"],
          ["`goto :eof`", "jump to the **end of file** — the built-in way to end a script/sub"],
          ["`call :label args`", "call `:label` as a subroutine; it gets its own `%1`…`%9`; returns on `exit /b` or `goto :eof`"],
          ["`call other.cmd args`", "run *another* batch file and return here when it finishes"],
          ["`exit /b [N]`", "return from the current sub/script with exit code `N` (sets `%ERRORLEVEL%`)"],
          ["`exit [N]`", "terminate the **whole `cmd.exe`** — avoid inside a called script"]
        ] },
        { type: "callout", variant: "tip", text: "**`goto :eof` is a special built-in** (note the colon) — it always jumps to the end of the current file *even if you have no `:eof` label*. It's the idiomatic way to end a subroutine or script cleanly. Pair it with `setlocal`/`endlocal` per subroutine to keep variable scope tidy." },
        { type: "heading", text: "Returning values from a subroutine" },
        { type: "p", text: "A sub can \"return\" data three ways: (1) set a variable the caller reads afterward (simplest — see `_result` above), (2) set an **exit code** with `exit /b N` and check `%ERRORLEVEL%`, or (3) — the clean way — use `endlocal` chaining to publish exactly one value out of a local scope." },
        { type: "code", lang: "batch", code: "@echo off\nsetlocal enabledelayedexpansion\ncall :square 7 SQ            rem pass the RESULT variable NAME as an argument\necho 7 squared is %SQ%\nexit /b\n\n:square\n    setlocal\n    set /a _n=%~1 * %~1\n    rem  this trick lets ONE value survive endlocal and land in the caller's var %~2:\n    endlocal & set \"%~2=%_n%\"\n    exit /b" },
        { type: "callout", variant: "gotcha", text: "Inside a subroutine, `exit` (without `/b`) closes the entire console — a common mistake that makes a double-clicked script vanish. **Always use `exit /b`** to leave a subroutine or script; reserve bare `exit` for genuinely terminating everything." }
      ]
    },
    {
      id: "error-handling",
      title: "Error handling & exit codes",
      level: "core",
      body: [
        { type: "p", text: "Batch's error handling revolves around **`%ERRORLEVEL%`** — an integer holding the exit code of the last command. By convention **0 means success** and non-zero means an error (each program defines its own codes). There are two ways to test it, and they behave *differently* — this catches everyone." },
        { type: "callout", variant: "gotcha", text: "**`if errorlevel N` means \"errorlevel is N *or greater*\", not \"equal to N\".** So `if errorlevel 1` is true for 1, 2, 3, … (any error), and `if errorlevel 0` is *always* true (everything is >= 0). To test for exactly one code, compare the variable: `if %ERRORLEVEL% EQU 2`. To test \"did it fail?\", `if errorlevel 1` or `if %ERRORLEVEL% NEQ 0` both work." },
        { type: "code", lang: "batch", code: "some_program.exe\nif errorlevel 1 (\n    echo It failed with code %ERRORLEVEL%\n    exit /b 1\n)\n\nrem  Test an EXACT code:\nping -n 1 example.com >nul\nif %ERRORLEVEL% EQU 0 (echo online) else (echo offline)\n\nrem  Descending checks are the safe pattern for `if errorlevel` (high to low):\nrobocopy src dst /mir\nif errorlevel 8 (echo ROBOCOPY ERROR & exit /b 1)\nif errorlevel 1 (echo copied some files, all good)" },
        { type: "heading", text: "&& and || — inline success/failure" },
        { type: "code", lang: "batch", code: "rem  Cleaner than an if-block for simple cases:\nmkdir build || (echo could not create build dir & exit /b 1)\ncall npm install && call npm run build || (echo build pipeline failed & exit /b 1)\n\nrem  Set the script's OWN exit code so a CALLER (CI, another script) can check it\nexit /b 0        rem success\nexit /b 1        rem failure — the shell/CI sees this as %ERRORLEVEL%" },
        { type: "callout", variant: "warn", text: "**Don't `set ERRORLEVEL=0` to \"clear\" it.** That creates a *real environment variable* named `ERRORLEVEL` that then **shadows** the dynamic one — from that point `%ERRORLEVEL%` reads your fake value forever, breaking all error checks. To reset the true errorlevel, run a command that succeeds, e.g. `cd .` or `(call )` (that odd `(call )` sets it to 0)." },
        { type: "callout", variant: "gotcha", text: "**`%ERRORLEVEL%` is expanded at parse time**, so inside an `if`/`for` block it holds the *pre-block* value. Read the live value with **delayed expansion** (`!ERRORLEVEL!`) inside blocks, or better, test with the bare `if errorlevel N` form which always sees the current value. Also recall the **`.bat` vs `.cmd`** wrinkle: in a `.cmd`, a successful `set`/`path` resets errorlevel to 0; in a `.bat` it doesn't — one more reason to prefer `.cmd`." }
      ]
    },
    {
      id: "redirection",
      title: "Redirection, pipes & filtering",
      level: "core",
      body: [
        { type: "p", text: "Redirection sends a command's output to a file (or nowhere), and pipes feed one command's output into another. The stream numbers are **1 = stdout**, **2 = stderr**; combine them to capture or silence everything." },
        { type: "table", headers: ["Syntax", "Effect"], rows: [
          ["`cmd > file`", "write stdout to `file` (**overwrites**)"],
          ["`cmd >> file`", "**append** stdout to `file`"],
          ["`cmd 2> file`", "redirect **stderr** (errors) to `file`"],
          ["`cmd > out.txt 2>&1`", "send stdout to `out.txt` **and** merge stderr into it"],
          ["`cmd > nul`", "discard stdout (`nul` is the black-hole device)"],
          ["`cmd > nul 2>&1`", "discard **everything** — run silently"],
          ["`cmd < input.txt`", "feed `input.txt` to the command's stdin"],
          ["`cmd1 | cmd2`", "pipe cmd1's stdout into cmd2's stdin"]
        ] },
        { type: "code", lang: "batch", code: "dir /b > filelist.txt              rem save a file listing\necho New log entry >> app.log       rem append a line to a log\nbuild.exe > build.log 2>&1          rem capture BOTH output and errors\ndel maybe_missing.txt 2>nul         rem run, but hide any error message\nservice.exe > nul 2>&1              rem run completely silently\n\nrem  the ORDER matters: `2>&1` must come AFTER the `>` that sets stream 1\ncmd > out.txt 2>&1     rem correct: stderr follows stdout to the file\ncmd 2>&1 > out.txt     rem WRONG: stderr goes to the console, only stdout to file" },
        { type: "heading", text: "findstr — batch's grep" },
        { type: "code", lang: "batch", code: "rem  findstr = the powerful text search (regex-capable). find = simpler substring search.\ntype server.log | findstr /I \"error warning\"   rem /I case-insensitive; matches EITHER word\nfindstr /C:\"exact phrase\" file.txt             rem /C: = literal search (spaces included)\nfindstr /R \"^ERROR.*failed$\" file.txt          rem /R = regex (^ $ . * [] supported)\nfindstr /S /I /M \"TODO\" *.cs                    rem /S recurse, /M list matching FILENAMES only\ndir | find /C \".txt\"                            rem find /C = COUNT matching lines\n\nrem  Use the exit code: findstr sets errorlevel 0 if it found a match, 1 if not\nfindstr /C:\"OK\" result.txt >nul && echo passed || echo failed" },
        { type: "table", headers: ["Tool", "Role"], rows: [
          ["`findstr`", "regex/multi-pattern search (grep-like); `/I` `/R` `/S` `/M` `/C:`"],
          ["`find`", "simple substring search; `/C` count, `/V` invert, `/I` ignore case"],
          ["`sort`", "sort lines; `/R` reverse, `/+n` sort from column n, `/unique`"],
          ["`more`", "page long output one screen at a time"],
          ["`clip`", "**pipe into it** to copy text to the Windows clipboard"]
        ] },
        { type: "callout", variant: "tip", text: "`dir /b *.log | findstr /R \"2026\" | sort > recent.txt` chains it all: list, filter, sort, save. And `echo Copied to clipboard | clip` puts text on the clipboard. For \"grep this and count\", `find /C` beats `findstr` (which has no count flag)." }
      ]
    },
    {
      id: "builtin-tools",
      title: "Useful built-in commands & system tools",
      level: "core",
      body: [
        { type: "p", text: "`cmd` ships with dozens of console utilities for processes, networking, services, and scheduling — the raw material of automation scripts. Here's the working set worth memorising." },
        { type: "table", headers: ["Command", "What it does", "Typical use"], rows: [
          ["`tasklist`", "list running processes", "`tasklist | findstr chrome`"],
          ["`taskkill`", "kill a process", "`taskkill /IM notepad.exe /F` (by name), `/PID 1234`"],
          ["`ping`", "test connectivity / crude sleep", "`ping -n 1 host` ; `ping -n 6 127.0.0.1 >nul` waits ~5s"],
          ["`ipconfig`", "show network config", "`ipconfig /all`, `ipconfig /flushdns`"],
          ["`net`", "users, shares, services", "`net use`, `net user`, `net start/stop <svc>`"],
          ["`sc`", "low-level service control", "`sc query`, `sc start`, `sc config`"],
          ["`schtasks`", "scheduled tasks (Task Scheduler)", "`schtasks /create /tn ... /tr ... /sc daily`"],
          ["`systeminfo`", "OS/hardware summary", "`systeminfo | findstr /C:\"Total Physical\"`"],
          ["`where`", "locate an executable on `%PATH%`", "`where python`"],
          ["`timeout /t N`", "wait N seconds (proper sleep)", "`timeout /t 10 /nobreak`"],
          ["`choice`", "prompt for a single-key choice", "`choice /c yn /m \"Proceed\"`"],
          ["`start`", "launch a program/URL/file", "`start \"\" https://example.com`, `start notepad`"],
          ["`assoc` / `ftype`", "file-extension associations", "`assoc .txt`, `ftype txtfile`"],
          ["`setx`", "**persist** an env var (registry)", "`setx TOOLS C:\\tools` (new shells only)"],
          ["`powershell -c`", "the escape hatch to real scripting", "`powershell -c \"Get-Date -Format o\"`"]
        ] },
        { type: "code", lang: "batch", code: "rem  Wait properly (timeout beats ping for readability)\ntimeout /t 5 /nobreak >nul        rem sleep 5 seconds, ignore keypresses, silent\n\nrem  Ask a yes/no question with a single keystroke (no Enter needed)\nchoice /c yn /n /m \"Deploy to production? [y/n] \"\nif errorlevel 2 (echo Cancelled & exit /b 1)   rem choice: errorlevel = choice INDEX (1=y, 2=n)\nif errorlevel 1 echo Deploying...\n\nrem  Kill any hung instance of an app, quietly, before restarting it\ntaskkill /IM myapp.exe /F >nul 2>&1\nstart \"\" \"C:\\Program Files\\MyApp\\myapp.exe\"" },
        { type: "callout", variant: "gotcha", text: "**`start`'s first quoted argument is the window TITLE, not the program.** `start \"C:\\My App\\x.exe\"` opens a console *titled* `C:\\My App\\x.exe` instead of launching it. Always pass an (often empty) title first: `start \"\" \"C:\\My App\\x.exe\"`. Same for URLs: `start \"\" https://...`." },
        { type: "callout", variant: "warn", text: "**`setx` truncates at 1024 characters and does NOT affect the current shell** — the new value only appears in *future* processes. Never `setx PATH \"%PATH%;C:\\new\"` from an admin shell: `%PATH%` there is the merged system+user path, and `setx` will write that whole blob into your *user* PATH, duplicating everything. Edit PATH via System Properties or PowerShell instead." },
        { type: "callout", variant: "note", text: "**`wmic` is deprecated** (removed by default on Windows 11 24H2+). Old scripts use it for system queries (`wmic cpu get name`); the modern replacement is PowerShell's `Get-CimInstance`. If you see `wmic`, treat it as legacy and plan a rewrite." }
      ]
    },
    {
      id: "professional",
      title: "Writing professional batch scripts",
      level: "deep",
      body: [
        { type: "p", text: "Good batch scripts share a skeleton: quiet echoing, a local scope, jump to the script's own folder, parse and validate arguments, do the work with error checks, and exit with a meaningful code. Here's a template that folds in every best practice from the earlier sections." },
        { type: "code", lang: "batch", code: "@echo off\nrem =====================================================================\nrem  deploy.cmd  -  build and deploy an app to a target environment\nrem  Usage:  deploy.cmd <environment> [--dry-run]\nrem =====================================================================\nsetlocal enabledelayedexpansion         rem local scope + !VAR! support\n\nrem --- always operate relative to the script's own location -----------\ncd /d \"%~dp0\" || (echo Cannot cd to script dir & exit /b 1)\n\nrem --- argument parsing ----------------------------------------------\nset \"ENVIRONMENT=%~1\"\nset \"DRYRUN=\"\nif /i \"%~2\"==\"--dry-run\" set \"DRYRUN=1\"\n\nif \"%ENVIRONMENT%\"==\"\" goto :usage       rem no env given -> show help\nif /i not \"%ENVIRONMENT%\"==\"staging\" if /i not \"%ENVIRONMENT%\"==\"prod\" (\n    echo ERROR: environment must be 'staging' or 'prod', got '%ENVIRONMENT%'\n    goto :usage\n)\n\nrem --- do the work, checking each step -------------------------------\necho [1/3] Building...\ncall :run npm run build || goto :fail\n\necho [2/3] Packaging...\nif not exist dist\\ (echo ERROR: dist not produced & goto :fail)\n\necho [3/3] Deploying to %ENVIRONMENT%...\nif defined DRYRUN (\n    echo   (dry run) would deploy dist to %ENVIRONMENT%\n) else (\n    call :run robocopy dist \\\\server\\%ENVIRONMENT%\\app /mir\n    if !ERRORLEVEL! GEQ 8 goto :fail       rem robocopy: >=8 is a real error\n)\n\necho SUCCESS.\nendlocal & exit /b 0\n\nrem --- helpers --------------------------------------------------------\n:run\n    echo   ^> %*\n    %*\n    exit /b %ERRORLEVEL%\n\n:fail\n    echo DEPLOY FAILED (code !ERRORLEVEL!).\n    endlocal & exit /b 1\n\n:usage\n    echo Usage: %~nx0 ^<staging^|prod^> [--dry-run]\n    endlocal & exit /b 2" },
        { type: "list", ordered: true, items: [
          "**`@echo off` + `setlocal enabledelayedexpansion`** up top: quiet output, private scope, `!VAR!` available.",
          "**`cd /d \"%~dp0\"`** so the script finds its siblings regardless of the caller's current directory.",
          "**Parse args into named variables** (`%~1` strips quotes) and **validate** them, jumping to a `:usage` label on bad input.",
          "**Check every step** with `|| goto :fail` or an explicit errorlevel test; never let a failed step silently proceed.",
          "**A `:run` helper** echoes then runs a command and propagates its errorlevel — cheap logging.",
          "**Exit with a code**: 0 success, non-zero failure, so CI and callers can react. `endlocal & exit /b N` closes the scope on the way out."
        ] },
        { type: "callout", variant: "tip", text: "**Quoting discipline** is what separates scripts that survive `C:\\Program Files` from ones that don't. Quote every path (`\"%~dp0\"`, `\"%~1\"`), quote both sides of string compares, and use the `set \"VAR=value\"` form. When a script grows past ~100 lines, sprouts real data structures, needs JSON/HTTP, or requires robust error handling — **stop and rewrite it in PowerShell.** Batch's ceiling is low; recognising when you've hit it is a senior skill." }
      ]
    },
    {
      id: "tricks",
      title: "Handy tricks & idioms",
      level: "deep",
      body: [
        { type: "p", text: "A grab-bag of things that come up constantly once you write real scripts: randomness, timestamps, sleeping, colours, and clipboard/drive tricks." },
        { type: "heading", text: "Random numbers" },
        { type: "code", lang: "batch", code: "echo %RANDOM%                      rem a new integer 0-32767 each read\nset /a dice=%RANDOM% %% 6 + 1       rem 1-6  (%% is modulo; doubled in a script)\nset /a pct=%RANDOM% * 100 / 32768   rem roughly 0-99\nset \"tmpname=tmp_%RANDOM%%RANDOM%.dat\"   rem a quick unique-ish temp filename" },
        { type: "heading", text: "Timestamps for filenames (the locale trap)" },
        { type: "code", lang: "batch", code: "rem  %DATE% / %TIME% formats depend on the user's LOCALE — fragile for filenames.\nrem  The ROBUST, locale-independent way uses WMIC/PowerShell to get a fixed format:\nfor /F \"usebackq\" %%t in (`powershell -nop -c \"Get-Date -Format yyyyMMdd_HHmmss\"`) do set \"STAMP=%%t\"\necho Backing up to backup_%STAMP%.zip\n\nrem  Legacy locale-dependent slice (works on many en-US machines, but NOT portable):\nset \"d=%DATE:~-4%%DATE:~4,2%%DATE:~7,2%\"   rem YYYYMMDD from `Ddd MM/DD/YYYY`" },
        { type: "callout", variant: "gotcha", text: "**Never rely on `%DATE%`/`%TIME%` string-slicing across machines.** The format is controlled by regional settings — day/month order, separators, and 12/24-hour all vary, and `%TIME%` before 10:00 has a *leading space* not a zero (`\" 9:05\"`), which corrupts filenames. For anything durable, shell out to PowerShell's `Get-Date -Format` as above." },
        { type: "heading", text: "Sleeping / delays" },
        { type: "code", lang: "batch", code: "timeout /t 10 /nobreak >nul     rem BEST: wait 10s, ignore keys, no countdown text\nping -n 11 127.0.0.1 >nul        rem legacy sleep: ~10s (n-1 seconds between pings)\nchoice /t 10 /c y /d y >nul      rem wait up to 10s or a keypress" },
        { type: "heading", text: "ANSI colours on Windows 10+" },
        { type: "code", lang: "batch", code: "@echo off\nrem  Modern Windows consoles support ANSI escape codes. You need a real ESC char.\nrem  This `for` trick captures the ESC (0x1B) byte into %ESC% via prompt.\nfor /F %%e in ('echo prompt $E ^| cmd') do set \"ESC=%%e\"\necho %ESC%[92mThis is bright green%ESC%[0m and this is normal.\necho %ESC%[91mRed error%ESC%[0m  %ESC%[93mYellow warning%ESC%[0m\nrem  For the WHOLE window instead, the old-school `color 0A` still works." },
        { type: "heading", text: "Drives & clipboard" },
        { type: "code", lang: "batch", code: "net use Z: \\\\server\\share /persistent:no   rem map a network drive to Z:\nnet use Z: /delete                          rem unmap it\n\ndir /b | clip                               rem copy a file listing to the clipboard\nclip < report.txt                           rem copy a file's contents to the clipboard\n\nstart \"\" \"https://example.com\"              rem open a URL in the default browser\nstart \"\" .                                   rem open the CURRENT folder in Explorer" },
        { type: "callout", variant: "tip", text: "`start \"\" .` opens Explorer at the current directory — handy at the end of a script that produces output. And `explorer /select,\"C:\\path\\file.txt\"` opens the folder *with that file highlighted*." }
      ]
    },
    {
      id: "danger",
      title: "⚠️ DANGER — destructive batch (educational only)",
      level: "deep",
      body: [
        { type: "callout", variant: "warn", text: "⚠️ **STOP. Everything in this section can destroy data, brick a Windows install, or crash a machine. NONE of it should ever be run on a real computer you care about.** It exists so you can *recognise* these patterns in a suspicious `.bat` file, understand why they're dangerous, and defend against them. If you ever want to experiment, do it in a **throwaway virtual machine with no shared folders and no network** — never on your host, never on someone else's machine. Running these to harm a system is malware, and in most jurisdictions a crime." },
        { type: "p", text: "Batch's reputation for danger comes from a few infamous one-liners. Understanding *why* each is destructive is the point — this is a defensive briefing, not a how-to." },
        { type: "heading", text: "Fork bomb — exhaust the process table" },
        { type: "callout", variant: "warn", text: "The classic self-replicating bomb `%0^|%0` starts *two* copies of the script, each of which starts two more, exponentially — the machine's CPU and RAM are consumed within seconds until it locks up. A variant, `:s / start \"\" %0 / goto s`, spawns an endless flood of new console windows. **Why dangerous:** exponential process creation is a denial-of-service against the whole OS; only a hard reboot recovers it. This is the batch equivalent of the Unix `:(){ :|:& };:` fork bomb." },
        { type: "heading", text: "Infinite file/folder creation — fill the disk" },
        { type: "callout", variant: "warn", text: "A loop like `:x / md %RANDOM% / goto x` (or one that writes files instead of folders) creates directories forever until the drive is 100% full, at which point Windows itself begins to malfunction (no room for temp files, page file, logs). **Why dangerous:** a full system drive can prevent boot and corrupt applications mid-write. The fix if caught early is to kill the process and delete the generated tree." },
        { type: "heading", text: "Mass deletion of the system" },
        { type: "callout", variant: "warn", text: "`del /f /s /q C:\\*` tries to force-delete every file on the C: drive recursively and quietly; `rd /s /q C:\\` attempts to remove the entire directory tree. `del %SystemRoot%\\*` / `del %windir%\\...` target the Windows folder specifically. **Why dangerous:** these obliterate the OS and user data with no confirmation and no recycle bin (`del` bypasses it). Modern Windows blocks some of this via file-in-use locks and permissions, but plenty still goes, leaving an unbootable machine. Real backups are the only defence." },
        { type: "heading", text: "Disk format & shutdown loops" },
        { type: "callout", variant: "warn", text: "`format C: /q` requests a quick format of the system drive — it won't run against the *running* OS volume without extra force, but against a *data* drive it wipes the filesystem instantly. A shutdown loop `:a / shutdown -s -t 0 -f / goto a` (or a single `shutdown /s /t 0`) forces an immediate power-off; placed in a **startup folder** it makes the machine unusable — it shuts down the moment it finishes booting, before you can remove the script. **Why dangerous:** the format destroys a filesystem; the shutdown loop denies all access to the machine." },
        { type: "heading", text: "Breaking file associations" },
        { type: "callout", variant: "warn", text: "`assoc .exe=` clears the association for `.exe` files, after which **nothing executable will launch** — including the tools you'd use to fix it (Task Manager, regedit) — often requiring Safe Face / registry repair to recover. `assoc=` with no extension and other `ftype` mischief similarly cripples how Windows opens files. **Why dangerous:** it disables the OS's ability to run or open programs, a subtle and hard-to-diagnose sabotage that survives reboots because it's written to the registry." },
        { type: "callout", variant: "gotcha", text: "**Defence, practically:** never run a `.bat`/`.cmd` from an untrusted source without reading it first (they're plain text — open in Notepad). Watch for `%0` self-reference, `del/rd /s /q` on drive roots or `%SystemRoot%`, `format`, `shutdown` loops, `assoc`/`ftype` with empty right-hand sides, and obfuscated `set`+delayed-expansion that hides the real command. Keep real backups. When testing anything risky, use a disposable VM with snapshots so you can roll back instantly." }
      ]
    },
    {
      id: "landscape",
      title: "Batch vs PowerShell vs WSL — the modern landscape",
      level: "deep",
      body: [
        { type: "p", text: "Windows now has three scripting worlds. Knowing which to reach for is half the battle — batch is often the *wrong* default in 2026, kept alive by ubiquity rather than merit." },
        { type: "table", headers: ["", "Batch (`cmd`)", "PowerShell", "WSL (Linux/bash)"], rows: [
          ["Data model", "strings only", "**objects** (pipe real .NET objects)", "text streams (like batch but sane)"],
          ["Availability", "**every** Windows, no setup", "built-in (Win7+); `pwsh` 7 is a download", "opt-in feature; installs a Linux distro"],
          ["Error handling", "`errorlevel` / `||`", "`try/catch`, `$ErrorActionPreference`", "`set -e`, traps, `$?`"],
          ["Best for", "legacy, installers, tiny glue, CI shims", "**real Windows automation & admin**", "Linux tooling, dev workflows, containers"],
          ["Learning curve", "quirky but small", "large but coherent", "familiar if you know Unix"],
          ["Verdict", "know it, don't reach for it", "**the default for new scripts**", "for cross-platform / Linux-native work"]
        ] },
        { type: "list", items: [
          "**Batch** wins only on *reach*: it runs on any Windows with no execution policy, no install, no distro. Use it for installers, `npm` script shims, CI bootstrap steps, and 5-line glue.",
          "**PowerShell** is the right tool for genuine Windows automation: it has objects, a huge cmdlet library, JSON/CSV/HTTP built in, real functions and modules, and proper error handling. Every new non-trivial Windows script should start here.",
          "**WSL** (Windows Subsystem for Linux) gives you a real bash + the entire Linux userland on Windows — use it when your workflow is Linux-shaped (Docker, make, gcc, shell pipelines) rather than Windows-admin-shaped.",
          "**Interop:** call between them freely. From batch: `powershell -c \"...\"` or `wsl ls -la`. From PowerShell: run `cmd /c`. This lets a thin batch entry point delegate the hard parts to PowerShell."
        ] },
        { type: "callout", variant: "tip", text: "Install **Windows Terminal** (free, from the Store) as your console host — it gives tabs, splits, and proper Unicode/ANSI to `cmd`, PowerShell, *and* WSL side by side. It's a strict upgrade over the legacy console window for anyone who scripts on Windows." }
      ]
    },
    {
      id: "headaches",
      title: "Common headaches & how to handle them",
      level: "core",
      body: [
        { type: "p", text: "The recurring foot-guns that bite batch authors. Almost all are about *when* `cmd` expands things and *how* it parses quoting and paths — not about the commands themselves." },
        { type: "heading", text: "1. Delayed expansion inside for/if (the #1 bug)" },
        { type: "callout", variant: "gotcha", text: "`%VAR%` is expanded **once, before** a `for`/`if` block runs, so a counter set inside the loop always reads its pre-loop value. **Fix:** `setlocal enabledelayedexpansion` and read with **`!VAR!`** inside the block. Symptom to recognise: \"my variable never changes inside the loop.\"" },
        { type: "heading", text: "2. Spaces & quotes in paths" },
        { type: "callout", variant: "gotcha", text: "`C:\\Program Files\\...` breaks unquoted commands (the space splits it into two arguments). **Fix:** quote every path — `\"%~dp0\"`, `\"%~1\"`, `cd /d \"%TARGET%\"`. Use `%~1` (not `%1`) to strip quotes when *storing* a path in a variable so you don't end up double-quoting later." },
        { type: "heading", text: "3. `%` must be doubled in scripts" },
        { type: "callout", variant: "gotcha", text: "A literal percent needs to be `%%` in a `.bat`/`.cmd` (`echo 100%%`, `set /a x=y %% 2`), and `for` loop variables are `%%i` in scripts vs `%i` at the prompt. **Fix:** remember scripts double every `%` that isn't part of a `%VAR%` expansion. Copying a `for` command from the interactive prompt is the usual trigger for forgetting." },
        { type: "heading", text: "4. The set trailing-space bug" },
        { type: "callout", variant: "gotcha", text: "`set X=5 ` (trailing space, or spaces around `=`) stores the spaces in the name/value, so `%X%` mysteriously has a trailing blank and comparisons fail. **Fix:** always use the quoted form `set \"X=5\"` — it pins exactly what's between the quotes." },
        { type: "heading", text: "5. .bat vs .cmd errorlevel differences" },
        { type: "callout", variant: "note", text: "In a `.cmd`, a successful `set`/`path`/`assoc` resets `%ERRORLEVEL%` to 0; in a `.bat` it leaves the previous value. This makes error checks behave differently between the two extensions. **Fix:** prefer **`.cmd`**, and test errors *immediately* after the command that produced them, before any `set`." },
        { type: "heading", text: "6. `if errorlevel N` is \"N or greater\"" },
        { type: "callout", variant: "gotcha", text: "`if errorlevel 0` is always true, and `if errorlevel 1` matches *any* error. For an exact code use `if %ERRORLEVEL% EQU N`; for `if errorlevel` cascades, test **high-to-low**. **Fix:** know which semantics you want, and remember `robocopy` uses a bitmask where `>= 8` is failure." },
        { type: "heading", text: "7. Corrupting ERRORLEVEL by setting it" },
        { type: "callout", variant: "warn", text: "`set ERRORLEVEL=0` defines a real variable that permanently **shadows** the dynamic errorlevel, silently breaking every later error check. **Fix:** never assign to `ERRORLEVEL`; to genuinely reset it run a succeeding command (`cd .` or `(call )`). Same shadowing risk applies to `DATE`, `TIME`, `CD`, `RANDOM`." },
        { type: "heading", text: "8. Admin / UAC" },
        { type: "callout", variant: "gotcha", text: "Commands that touch services, `%SystemRoot%`, `HKLM`, or `Program Files` fail with \"Access is denied\" unless the `cmd` is **elevated**. Double-clicking does *not* elevate. **Fix:** right-click → Run as administrator, or self-elevate (a `powershell Start-Process cmd -Verb runAs` relaunch trick), and check for admin early with `net session >nul 2>&1 && ... || (echo Please run as admin & exit /b 1)`." },
        { type: "heading", text: "9. ANSI / code-page issues" },
        { type: "callout", variant: "note", text: "Non-ASCII output shows as `?` or mojibake because the console code page (often 437/850) doesn't match the file's encoding. **Fix:** `chcp 65001` for UTF-8 (and save the `.cmd` as UTF-8 **without BOM** — a BOM makes `cmd` choke on the first line). ANSI colour codes need a real ESC byte and a Win10+ console (see the tricks section)." },
        { type: "heading", text: "10. Forward vs backslashes" },
        { type: "callout", variant: "gotcha", text: "Paths use **backslashes** `\\`; most *file* commands also accept `/`, but `/` is how you pass **switches** (`dir /b`), so `cd /foo` is read as \"the `/f`, `/o`, `/o` switches,\" not a path. **Fix:** use backslashes in paths inside scripts, quote them, and never assume Unix-style `/` separators will work with every command." }
      ]
    }
  ],

  packages: [
    { name: "PowerShell", why: "the modern successor to batch — objects, cmdlets, real error handling, JSON/HTTP built in; the default for any new non-trivial Windows script (start a batch escape hatch with `powershell -c`)" },
    { name: "Windows Terminal", why: "the modern console host (free, Store) — tabs, splits, Unicode/ANSI, hosts cmd + PowerShell + WSL side by side; a strict upgrade over the legacy conhost window" },
    { name: "robocopy", why: "the robust, restartable, multithreaded file/tree copier built into Windows — `/mir` mirroring, retry logic, exclude filters; far better than copy/xcopy for real backups" },
    { name: "findstr", why: "the built-in grep — regex (`/R`), multi-pattern, recurse (`/S`), list-filenames (`/M`), case-insensitive (`/I`); sets errorlevel on match so you can branch on it" },
    { name: "PsExec / Sysinternals Suite", why: "Microsoft's power-tools kit — PsExec (run commands remotely/as SYSTEM), Handle, ProcMon, Autoruns; the professional's toolbox that pairs with scripts" },
    { name: "schtasks", why: "the command-line front-end to Task Scheduler — create/query/delete scheduled jobs (`/create /sc daily /tn ... /tr ...`) so a batch script runs unattended" },
    { name: "timeout", why: "a proper sleep (`timeout /t N /nobreak`) — replaces the old `ping -n` delay hack with something readable" },
    { name: "choice", why: "single-keystroke menu prompts (`choice /c yn /m ...`) — returns the selection index in errorlevel; cleaner than `set /p` for yes/no" },
    { name: "clip", why: "pipe text into it to put it on the Windows clipboard (`dir /b | clip`, `clip < file.txt`) — the missing 'copy to clipboard' primitive" },
    { name: "WSL (bash)", why: "Windows Subsystem for Linux — a real Linux userland when your workflow is Unix-shaped; call `wsl <cmd>` from batch to borrow grep/sed/awk/make" },
    { name: "Notepad++ / VS Code", why: "editors with batch syntax highlighting and — crucially — control over line endings (CRLF) and encoding (UTF-8 no BOM), which cmd is picky about" },
    { name: "Chocolatey / winget", why: "package managers for Windows so your batch installer scripts can `choco install ...` / `winget install ...` instead of hand-rolling downloads" }
  ],

  gotchas: [
    "**Delayed expansion:** `%VAR%` is expanded once before a `for`/`if` block runs — a counter set inside reads its pre-loop value. Use `setlocal enabledelayedexpansion` + `!VAR!` inside blocks.",
    "**`%%i` in scripts, `%i` at the prompt** — the #1 'why does my for loop error' bug. Scripts double the loop-variable percent; so does a literal `%` (`echo 100%%`).",
    "**`set X = 5` is broken** — spaces around `=` become part of the name/value. Always use the quoted form `set \"X=5\"`.",
    "**Quote both sides of a string compare** — `if %x%==y` errors when `%x%` is empty (`if ==y`). Write `if \"%x%\"==\"y\"`; add `/i` for case-insensitive.",
    "**`if errorlevel N` means 'N or greater'**, so `if errorlevel 0` is always true. Use `if %ERRORLEVEL% EQU N` for an exact code; test high-to-low in cascades.",
    "**Never `set ERRORLEVEL=0`** — it creates a real variable that shadows the dynamic one and breaks every later error check. Reset it with `cd .` or `(call )`.",
    "**`robocopy` exit codes are a bitmask** — 0–7 are success/info, `>= 8` is a real error. `if errorlevel 8` is the correct failure test; treating any non-zero as failure is wrong.",
    "**`robocopy /mir` deletes** files in the destination that aren't in the source — point it at the wrong folder and you wipe it. Test with `/l` (list-only) first.",
    "**`start \"C:\\app.exe\"` sets the window TITLE, not the program** — always pass an empty title first: `start \"\" \"C:\\app.exe\"`.",
    "**`::` comments break inside `(...)` blocks** — use `rem` for comments inside `for`/`if` bodies.",
    "**`%DATE%`/`%TIME%` are locale-dependent** (order, separators, a leading space before 10:00) — never string-slice them for filenames; shell out to `powershell Get-Date -Format`.",
    "**Save `.cmd` as UTF-8 WITHOUT a BOM** — a BOM makes cmd choke on the first line. Use `chcp 65001` for UTF-8 output.",
    "**`/` is a switch prefix, not a path separator** — `cd /foo` is read as switches. Use backslashes in paths and quote them.",
    "**`setx` truncates at 1024 chars and doesn't affect the current shell** — and `setx PATH \"%PATH%;...\"` from an admin shell corrupts your user PATH. Edit PATH via System Properties instead.",
    "**Prefer `.cmd` over `.bat`** — `.cmd` resets errorlevel to 0 on a successful `set`/`path`; `.bat` doesn't, so error checks differ between the two.",
    "**Use `exit /b`, never bare `exit`, to leave a script/sub** — bare `exit` closes the whole console (and a double-clicked window vanishes)."
  ],

  flashcards: [
    { q: "What is a batch file and what runs it?", a: "A plain-text file of console commands (`.bat`/`.cmd`) interpreted top-to-bottom by `cmd.exe`, the Windows Command Prompt. No runtime to install — it ships with every Windows." },
    { q: "`.bat` vs `.cmd` — any real difference?", a: "Nearly identical. The one difference: in a `.cmd`, a successful `set`/`path` resets `%ERRORLEVEL%` to 0; a `.bat` leaves the old value. Prefer `.cmd` for saner error behaviour." },
    { q: "When should you NOT use batch?", a: "For anything non-trivial — use PowerShell. Batch has no real data structures, objects, or error handling. Keep batch for legacy, installers, CI shims, and tiny glue where its universal availability matters." },
    { q: "Why does a counter set inside a `for` loop read as unchanged?", a: "`%VAR%` is expanded once, before the block runs. Enable `setlocal enabledelayedexpansion` and read with `!VAR!` to get the live value each iteration." },
    { q: "`%%i` or `%i` for a loop variable?", a: "`%%i` in a script (`.bat`/`.cmd`), `%i` on the interactive command line. Scripts double the percent because cmd already consumed single `%` during parsing." },
    { q: "How do you write `set` so a stray space doesn't corrupt the value?", a: "Quote the whole assignment: `set \"VAR=value\"`. Never put spaces around `=` (`set X = 5` names the var `X ` with value ` 5`)." },
    { q: "What is `%~dp0` and why is it so useful?", a: "The drive+path of the script itself (with a trailing backslash). It makes a script location-independent — `cd /d \"%~dp0\"` or `\"%~dp0config.ini\"` find siblings regardless of the current directory." },
    { q: "Give three `%~` argument modifiers.", a: "`%~1` strips surrounding quotes; `%~f1` full path; `%~dp1` drive+path; `%~nx1` filename+extension; `%~z1` size; `%~t1` timestamp. Combine like `%~dpnx1`." },
    { q: "Why quote both sides of `if \"%a%\"==\"%b%\"`?", a: "If a variable is empty, the unquoted form expands to a syntax error (`if ==x`) that aborts the script. Quoting both sides keeps it valid. Add `/i` for case-insensitive." },
    { q: "Numeric comparison operators in `if`?", a: "`EQU NEQ LSS LEQ GTR GEQ` compare numerically (when both sides are numbers). `==` is a string compare. So use `if %n% GEQ 18`, not `if %n%==18`, for numbers." },
    { q: "How do you capture a command's output into a variable?", a: "`for /F \"tokens=* usebackq\" %%v in (`command`) do set \"VAR=%%v\"` — batch's equivalent of bash `VAR=$(command)`. There is no `$(...)`." },
    { q: "The trap with `if errorlevel N`?", a: "It means 'errorlevel is N or greater', so `if errorlevel 0` is always true. Use `if %ERRORLEVEL% EQU N` for an exact code, and test high-to-low in cascades (e.g. robocopy's `>= 8`)." },
    { q: "`exit` vs `exit /b`?", a: "`exit` closes the entire `cmd.exe` (window and all). `exit /b [N]` leaves only the current script or subroutine, setting the exit code — always use `/b` inside scripts." },
    { q: "How do you silence a command completely?", a: "`command > nul 2>&1` — stdout to the nul device and stderr merged into it. Order matters: `2>&1` must come after the `>` that redirects stdout." },
    { q: "Name three infamous destructive batch patterns (to recognise, not run).", a: "Fork bomb `%0^|%0`; infinite folder creation `:x / md %RANDOM% / goto x`; `del /f /s /q C:\\*` or `rd /s /q C:\\`; `format C:`; a `shutdown /s /t 0` loop; `assoc .exe=`. Test only in a disposable VM." }
  ],

  cheatsheet: [
    { label: "Script header", code: "@echo off\nsetlocal enabledelayedexpansion\ncd /d \"%~dp0\"" },
    { label: "Set a variable (safe form)", code: "set \"NAME=value\"   & rem no spaces around =, quote the whole thing" },
    { label: "Arithmetic", code: "set /a total=(a+b)*2   & rem integers only; %% is modulo in scripts" },
    { label: "Read user input", code: "set /p ANSWER=Continue? " },
    { label: "Delayed expansion in a loop", code: "for %%f in (*) do (set /a n+=1 & echo !n!: %%f)" },
    { label: "if / else (same-line brace)", code: "if \"%x%\"==\"y\" (echo yes) else (echo no)" },
    { label: "File / var existence", code: "if exist \"file\" ... & if defined VAR ... & if not exist \"dir\\\" ..." },
    { label: "Count with for /L", code: "for /L %%i in (1,1,10) do echo %%i" },
    { label: "Read a file line by line", code: "for /F \"usebackq delims=\" %%L in (\"file.txt\") do echo %%L" },
    { label: "Capture command output", code: "for /F \"tokens=* usebackq\" %%v in (`hostname`) do set \"HOST=%%v\"" },
    { label: "Subroutine call + return", code: "call :sub arg  ...  :sub / echo %~1 / exit /b 0" },
    { label: "Error check", code: "cmd || (echo failed & exit /b 1)   & rem or: if errorlevel 1 ..." },
    { label: "Silence output", code: "command > nul 2>&1" },
    { label: "grep with findstr", code: "type log.txt | findstr /I /C:\"error\"" },
    { label: "Sleep 5 seconds", code: "timeout /t 5 /nobreak >nul" },
    { label: "Robust copy / mirror", code: "robocopy src dst /mir /z /r:2 /w:5   & rem >=8 = error" },
    { label: "Launch app / URL", code: "start \"\" \"C:\\app.exe\"   &  start \"\" https://site" },
    { label: "Copy to clipboard", code: "echo text | clip" },
    { label: "PowerShell escape hatch", code: "powershell -nop -c \"Get-Date -Format yyyyMMdd_HHmmss\"" },
    { label: "Substring / replace", code: "echo %s:~0,5%   &  echo %path:\\=/%" }
  ]
});
