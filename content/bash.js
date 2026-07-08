(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "bash",
  name: "Bash",
  language: "Bash",
  group: "Shell scripting",
  navLabel: "Bash",
  color: "#4EAA25",
  readMinutes: 34,
  tagline: "The **shell every Linux/macOS dev lives in** — an interactive command language *and* a scripting language. This deck takes you from `cd`/`ls` and the grep/sed/awk toolkit to pipes, expansion, and production-grade scripts with `set -euo pipefail`, `trap`, and `getopts` — plus the modern CLI tools worth installing.",

  sections: [
    {
      id: "overview",
      title: "Overview & mental model",
      level: "core",
      body: [
        { type: "p", text: "**Bash** (the *Bourne-Again SHell*) is two things at once: an **interactive prompt** where you type commands one at a time, and a **programming language** you write into `.sh` files to automate work. The mental model that matters: a shell is a **command dispatcher** — it reads a line, expands it (variables, globs, quotes), splits it into a command plus arguments, finds that command on your `PATH`, runs it, and waits for its **exit status**. Almost everything you \"do\" in a shell is really *launching small programs and wiring their inputs and outputs together*." },
        { type: "p", text: "`sh` is the POSIX shell standard; **bash** is a superset with many conveniences (arrays, `[[ ]]`, `${var/a/b}`, process substitution). **zsh** (macOS default since Catalina) and **fish** are cousins. Scripts that must run *anywhere* target POSIX `sh`; scripts you control target bash and say so in the shebang." },
        { type: "heading", text: "The shebang & how a script runs" },
        { type: "code", lang: "bash", code: "#!/usr/bin/env bash\n# ^ the shebang: the kernel reads this first line and runs the script with bash.\n# Use /usr/bin/env bash (found on PATH) rather than hard-coding /bin/bash.\necho \"Hello from a script\"" },
        { type: "code", lang: "bash", code: "# Three ways to run script.sh:\nbash script.sh        # explicit interpreter — shebang & +x not required\nchmod +x script.sh    # make it executable, once...\n./script.sh           # ...then run it directly (uses the shebang)\nsource script.sh      # run it IN the current shell (a.k.a.  . script.sh)" },
        { type: "callout", variant: "note", text: "`source` (or `.`) runs a script **in your current shell**, so any `cd`, `export`, or variable it sets *sticks*. Running `./script.sh` spawns a **child shell** — its `cd` and variables vanish when it exits. This is why \"my script's `cd` didn't change my directory\" — it can't, unless you `source` it." },
        { type: "callout", variant: "tip", text: "Interactive vs non-interactive matters: your prompt reads `~/.bashrc`; a login shell reads `~/.bash_profile`/`~/.profile`; a script reads **neither** unless you `source` them. Don't put script logic in your rc files, and don't assume a script sees your aliases." }
      ]
    },
    {
      id: "cli-navigation",
      title: "Moving around the CLI",
      level: "core",
      body: [
        { type: "p", text: "The interactive shell is a **GNU Readline** editor. Learning a handful of movement keys and history tricks is the single biggest speed-up for daily work." },
        { type: "code", lang: "bash", code: "pwd                 # print working directory\ncd /var/log         # change directory (absolute)\ncd project/src      # relative\ncd                  # go $HOME\ncd -                # go back to the PREVIOUS directory (toggles)\ncd ..               # up one level\nls -lah             # long, all (incl. dotfiles), human sizes\nls -lt              # sort by mtime, newest first" },
        { type: "heading", text: "History & Readline shortcuts" },
        { type: "table", headers: ["Key", "Does"], rows: [
          ["`Ctrl-R`", "**reverse-search** history as you type (the most useful key in the shell)"],
          ["`Ctrl-A` / `Ctrl-E`", "jump to start / end of line"],
          ["`Ctrl-W` / `Ctrl-U`", "delete word before cursor / whole line"],
          ["`Ctrl-L`", "clear the screen (like `clear`)"],
          ["`Ctrl-C` / `Ctrl-D`", "cancel current line / send EOF (logout)"],
          ["`Tab`", "**complete** a command, path, or (with plugins) an option"],
          ["`Alt-.`", "insert the **last argument** of the previous command"]
        ] },
        { type: "code", lang: "bash", code: "history            # numbered list of past commands\n!!                 # re-run the previous command (e.g.  sudo !!)\n!$                 # last ARG of previous command\n!vi                # re-run the last command starting with \"vi\"\n!1234              # run history entry #1234\n^old^new           # re-run previous command, replacing first \"old\" with \"new\"" },
        { type: "heading", text: "Globbing (filename patterns)" },
        { type: "p", text: "Globs are expanded **by the shell**, not the command — by the time `rm` sees them, `*.log` has already become a list of real files. This is why quoting matters (see the expansion section)." },
        { type: "table", headers: ["Glob", "Matches"], rows: [
          ["`*`", "any run of characters (not a leading dot, not `/`)"],
          ["`?`", "exactly one character"],
          ["`[abc]` / `[0-9]`", "one char from a set / range"],
          ["`{jpg,png}`", "brace expansion — `a.{jpg,png}` → `a.jpg a.png`"],
          ["`**`", "recursive match (needs `shopt -s globstar`)"],
          ["`.*`", "dotfiles (hidden) — normal `*` skips them"]
        ] },
        { type: "callout", variant: "gotcha", text: "If a glob matches **nothing**, bash passes the *literal* pattern through by default (so `ls *.md` in an empty dir runs `ls '*.md'` and errors). Set `shopt -s nullglob` to make non-matching globs expand to *nothing* instead — essential when looping over files that might not exist." }
      ]
    },
    {
      id: "files",
      title: "Files & the filesystem",
      level: "core",
      body: [
        { type: "code", lang: "bash", code: "cp src.txt dst.txt          # copy\ncp -r dir/ backup/          # recursive copy of a directory\nmv old.txt new.txt          # move / rename\nrm file.txt                 # delete a file\nrm -r dir/                  # delete a directory tree\nrm -i *.tmp                 # -i = prompt before each (safer)\nmkdir -p a/b/c              # make nested dirs, no error if they exist\nrmdir empty_dir             # remove an EMPTY dir only\ntouch file.txt              # create empty / update mtime\nln -s /opt/app/bin app      # symbolic link  (app -> /opt/app/bin)" },
        { type: "heading", text: "find — the workhorse" },
        { type: "p", text: "`find` walks a directory tree and tests each entry. It is the canonical way to *select* files by name, type, age, or size and then *act* on them." },
        { type: "code", lang: "bash", code: "find . -name \"*.log\"                 # by name (quote it so the SHELL doesn't expand it)\nfind . -iname \"readme*\"              # case-insensitive\nfind . -type f -mtime +7             # regular files modified >7 days ago\nfind . -type d -empty                # empty directories\nfind . -size +100M                   # files bigger than 100 MB\nfind . -name \"*.tmp\" -delete         # delete matches (built-in, safe-ish)\nfind . -name \"*.js\" -exec grep -l TODO {} +   # run a command per batch of matches" },
        { type: "callout", variant: "tip", text: "`-exec cmd {} +` batches many files into one invocation (fast); `-exec cmd {} \\;` runs once per file (slower, but needed when the command takes exactly one arg). The `\\;` must be escaped so the shell doesn't eat the semicolon." },
        { type: "heading", text: "Inspecting files" },
        { type: "code", lang: "bash", code: "stat file.txt      # size, perms, mtime/atime, inode\nfile mystery.bin   # guess the file TYPE by content (\"PNG image\", \"ELF binary\"...)\ndu -sh dir/        # total size of a directory (human-readable)\ndf -h              # free space per mounted filesystem\nwc -l access.log   # count lines  (-w words, -c bytes)\nrealpath ./x       # resolve to an absolute, symlink-free path" },
        { type: "callout", variant: "warn", text: "There is **no undo** and no recycle bin for `rm`. Never build an `rm -rf` path from an *unset* variable: `rm -rf \"$DIR/\"` becomes `rm -rf /` if `$DIR` is empty. Quote paths, and consider `trash-cli` (`trash` command) for interactive use." }
      ]
    },
    {
      id: "text-viewing",
      title: "Viewing & editing text",
      level: "core",
      body: [
        { type: "code", lang: "bash", code: "cat file.txt              # dump a file to stdout (concatenate)\nless big.log              # scrollable pager: /search, n/N, g/G, q to quit\nhead -n 20 file           # first 20 lines\ntail -n 50 file           # last 50 lines\ntail -f app.log           # FOLLOW a growing file (live logs) — Ctrl-C to stop\ntail -F app.log           # follow even across log rotation\nnl file                   # number the lines\ntee out.txt               # copy stdin to BOTH a file and stdout (see below)" },
        { type: "code", lang: "bash", code: "# tee is how you \"save AND keep piping\":\nmake 2>&1 | tee build.log | grep -i error\n# sudo tee is the idiom for writing a file that needs root (redirection can't):\necho \"127.0.0.1 db\" | sudo tee -a /etc/hosts" },
        { type: "callout", variant: "note", text: "Editors: **nano** is the friendly one (shortcuts shown at the bottom; `Ctrl-O` save, `Ctrl-X` exit). **vim** is everywhere and worth basic literacy: `i` insert, `Esc` to command mode, `:wq` save-and-quit, `:q!` quit-without-saving. If you're stuck in vim, that last one is your escape hatch." }
      ]
    },
    {
      id: "text-toolkit",
      title: "The text-processing toolkit (grep · sed · awk)",
      level: "core",
      body: [
        { type: "p", text: "Unix philosophy: **small tools, joined by pipes, each doing one thing to a stream of text**. Master this handful and you can slice any log, CSV, or command output without writing a program." },
        { type: "heading", text: "grep — search lines" },
        { type: "code", lang: "bash", code: "grep \"error\" app.log            # lines containing \"error\"\ngrep -i \"error\" app.log         # case-insensitive\ngrep -r \"TODO\" src/             # recursive through a directory\ngrep -n \"panic\" *.go            # show line numbers\ngrep -v \"DEBUG\" app.log         # INVERT: lines WITHOUT \"DEBUG\"\ngrep -c \"200\" access.log        # count matching lines\ngrep -E \"warn|error|fatal\" log  # extended regex (alternation)\ngrep -o \"[0-9]+\\.[0-9]+\" file   # print only the MATCHED text, not the line" },
        { type: "heading", text: "sed — stream editor (substitute & transform)" },
        { type: "code", lang: "bash", code: "sed 's/foo/bar/' file            # replace FIRST foo on each line\nsed 's/foo/bar/g' file           # replace ALL (global)\nsed 's/foo/bar/gi' file          # global + case-insensitive\nsed -i 's/foo/bar/g' file        # edit the file IN PLACE (careful!)\nsed -i.bak 's/foo/bar/g' file    # in place, keeping file.bak backup\nsed -n '10,20p' file             # print only lines 10-20\nsed '/^#/d' config               # delete comment lines\nsed 's|/old/path|/new/path|g' f  # use | as delimiter when data has /" },
        { type: "heading", text: "awk — column-aware processing" },
        { type: "p", text: "`awk` splits each line into fields (`$1`, `$2`, … `$NF` = last field) and runs your program on lines that match a pattern. It's a whole language, but 90% of use is one-liners." },
        { type: "code", lang: "bash", code: "awk '{print $1}' access.log            # first whitespace-separated field\nawk -F, '{print $2}' data.csv          # -F sets the field separator to comma\nawk '{print $NF}' file                 # LAST field\nawk '$3 > 500 {print $1, $3}' data     # filter by a column, print two\nawk '{sum += $1} END {print sum}' nums  # running total, printed at the END\nawk 'NR==1 || /error/' log             # header line OR any matching line" },
        { type: "heading", text: "The supporting cast" },
        { type: "code", lang: "bash", code: "cut -d: -f1 /etc/passwd     # cut field 1, delimiter \":\"  -> usernames\nsort file | uniq            # uniq only collapses ADJACENT dups, so sort first\nsort | uniq -c | sort -rn   # the classic \"count & rank\" pipeline\ntr 'a-z' 'A-Z' < file       # translate/transform characters (lower->upper)\ntr -d '\\r' < win.txt        # strip carriage returns (fix CRLF)\npaste a.txt b.txt           # join files side-by-side, column-wise\nxargs                       # turn stdin into ARGUMENTS for another command" },
        { type: "code", lang: "bash", code: "# A real pipeline: top 5 IPs hitting a server, by request count.\nawk '{print $1}' access.log \\\n  | sort \\\n  | uniq -c \\\n  | sort -rn \\\n  | head -n 5" },
        { type: "callout", variant: "tip", text: "`xargs` is how you feed a *list* to a command that wants *arguments*: `find . -name '*.log' | xargs rm`. Use `find ... -print0 | xargs -0` (NUL-separated) to survive filenames with spaces, and `xargs -P 8` to run 8 jobs in parallel." }
      ]
    },
    {
      id: "pipes-redirection",
      title: "Pipes, redirection & streams",
      level: "core",
      body: [
        { type: "p", text: "Every process has three standard streams: **stdin** (0), **stdout** (1), and **stderr** (2). Redirection rewires them to files; pipes wire one process's stdout into the next's stdin. This is the heart of the shell." },
        { type: "table", headers: ["Operator", "Meaning"], rows: [
          ["`cmd > file`", "send **stdout** to file (truncate/overwrite)"],
          ["`cmd >> file`", "**append** stdout to file"],
          ["`cmd < file`", "feed file as **stdin**"],
          ["`cmd 2> err.txt`", "redirect **stderr** only"],
          ["`cmd > out 2>&1`", "stdout to `out`, **and stderr to the same place**"],
          ["`cmd &> all.txt`", "bash shorthand: both stdout+stderr to a file"],
          ["`a | b`", "pipe a's stdout into b's stdin"],
          ["`cmd 2>/dev/null`", "discard errors (`/dev/null` is the black hole)"]
        ] },
        { type: "code", lang: "bash", code: "# Order matters: redirect stdout to the file FIRST, then point stderr at stdout.\nmake > build.log 2>&1          # correct: everything into build.log\nmake 2>&1 > build.log          # WRONG: stderr still goes to the terminal\n\ngrep -r TODO . 2>/dev/null     # ignore \"permission denied\" noise on stderr\ncommand > /dev/null 2>&1       # run silently, discard all output" },
        { type: "heading", text: "Here-docs & here-strings" },
        { type: "code", lang: "bash", code: "# here-doc: feed a block of literal text as stdin\ncat <<EOF > config.yaml\nname: app\nport: 8080\nEOF\n\n# quote the delimiter ('EOF') to DISABLE variable expansion inside:\ncat <<'EOF'\nThis $VAR is printed literally, not expanded.\nEOF\n\n# here-string: feed a single string as stdin\ngrep foo <<< \"$my_variable\"" },
        { type: "callout", variant: "gotcha", text: "A pipeline runs each stage in a **subshell**. So `echo hi | read x; echo \"$x\"` prints *nothing* — `read` ran in a subshell and `x` was lost. Fixes: `read x < <(echo hi)` (process substitution), or `shopt -s lastpipe` (last stage runs in the current shell)." }
      ]
    },
    {
      id: "variables",
      title: "Variables, quoting & expansion",
      level: "core",
      body: [
        { type: "code", lang: "bash", code: "name=\"world\"           # assignment: NO spaces around = (name = x is a command!)\necho \"$name\"           # use with $ ; braces for clarity: ${name}\necho \"${name}_suffix\"  # braces required when text follows the name\nreadonly PI=3.14       # constant\nunset name             # delete a variable\nexport PATH=\"$HOME/bin:$PATH\"   # export = visible to child processes" },
        { type: "heading", text: "Quoting — the #1 correctness issue" },
        { type: "list", ordered: false, items: [
          "**Double quotes** `\"$x\"` — expand variables but keep the value as ONE word (spaces preserved). **Use these almost always.**",
          "**Single quotes** `'$x'` — totally literal, no expansion at all.",
          "**No quotes** `$x` — the value is split on whitespace and glob-expanded. Rarely what you want."
        ] },
        { type: "code", lang: "bash", code: "file=\"my report.txt\"\nrm $file       # BUG: runs  rm my report.txt  (two args -> deletes wrong things)\nrm \"$file\"     # correct: one argument, spaces intact" },
        { type: "heading", text: "Command & arithmetic substitution" },
        { type: "code", lang: "bash", code: "today=$(date +%F)              # capture a command's output  (prefer $() over backticks)\ncount=$(grep -c error log)\necho \"There are $count errors as of $today\"\n\ni=$(( (2 + 3) * 4 ))          # integer arithmetic  -> 20\n(( i++ ))                      # increment in place\nif (( count > 100 )); then echo \"too many\"; fi" },
        { type: "heading", text: "Parameter expansion (built-in string ops)" },
        { type: "table", headers: ["Expansion", "Result"], rows: [
          ["`${var:-default}`", "value, or `default` if unset/empty"],
          ["`${var:=default}`", "value, or set var to `default` and use it"],
          ["`${var:?msg}`", "error out with `msg` if unset (great for required args)"],
          ["`${#var}`", "length of the string"],
          ["`${var#pattern}` / `${var##...}`", "strip shortest / longest prefix"],
          ["`${var%pattern}` / `${var%%...}`", "strip shortest / longest suffix"],
          ["`${var/old/new}` / `${var//old/new}`", "replace first / all occurrences"],
          ["`${var:0:3}`", "substring: offset 0, length 3"]
        ] },
        { type: "code", lang: "bash", code: "path=\"/home/me/photo.jpg\"\necho \"${path##*/}\"     # photo.jpg   (basename: strip longest leading */)\necho \"${path%/*}\"      # /home/me    (dirname: strip trailing /*)\necho \"${path%.*}\"      # /home/me/photo   (drop extension)\necho \"${path##*.}\"     # jpg         (extension only)" },
        { type: "heading", text: "Arrays" },
        { type: "code", lang: "bash", code: "fruits=(apple banana cherry)\necho \"${fruits[0]}\"        # apple\necho \"${fruits[@]}\"        # all elements (each a separate word — quote it!)\necho \"${#fruits[@]}\"       # 3  (count)\nfruits+=(date)             # append\nfor f in \"${fruits[@]}\"; do echo \"$f\"; done\n\ndeclare -A color           # associative array (map)\ncolor[sky]=blue\necho \"${color[sky]}\"       # blue" },
        { type: "callout", variant: "warn", text: "Always write `\"${arr[@]}\"` with quotes and `@` (not `*`) when iterating — unquoted or `*` re-splits elements on whitespace and breaks on filenames with spaces." }
      ]
    },
    {
      id: "control-flow",
      title: "Control flow: test, [[ ]], case",
      level: "core",
      body: [
        { type: "code", lang: "bash", code: "if [[ -f config.yaml ]]; then\n  echo \"config exists\"\nelif [[ -d config.d ]]; then\n  echo \"config directory\"\nelse\n  echo \"no config\"\nfi" },
        { type: "p", text: "`[[ ]]` is bash's **test keyword** — prefer it over the older `[ ]` (which is really the `test` command). `[[ ]]` doesn't word-split, supports `&&`/`||`/`<`/`>` and `=~` regex, and is far less error-prone." },
        { type: "table", headers: ["Test", "True when"], rows: [
          ["`-f path`", "path is a regular file"],
          ["`-d path`", "path is a directory"],
          ["`-e path`", "path exists (any type)"],
          ["`-x path`", "path is executable"],
          ["`-z str` / `-n str`", "string is empty / non-empty"],
          ["`a == b` / `a != b`", "string equality (glob-matching inside `[[ ]]`)"],
          ["`a =~ regex`", "string matches an extended regex (bash `[[ ]]` only)"],
          ["`a -eq b` `-ne` `-lt` `-le` `-gt` `-ge`", "**numeric** comparison"]
        ] },
        { type: "callout", variant: "gotcha", text: "Use **`-eq`/`-lt`** for numbers and **`==`/`<`** for strings — mixing them bites. `[[ 10 > 9 ]]` is *false* (string compare: \"1\" < \"9\"), but `[[ 10 -gt 9 ]]` is true. Also: with `[ ]` you must quote (`[ \"$x\" = y ]`) or an empty `$x` becomes a syntax error; `[[ ]]` doesn't have that trap." },
        { type: "code", lang: "bash", code: "# case: cleaner than a long if/elif chain, and it glob-matches\ncase \"$1\" in\n  start)        echo \"starting\" ;;\n  stop|halt)    echo \"stopping\" ;;      # multiple patterns with |\n  *.txt)        echo \"a text file\" ;;   # globs work\n  *)            echo \"unknown: $1\" ;;   # default\nesac" },
        { type: "code", lang: "bash", code: "# && and || short-circuit on exit status (0 = success):\nmkdir -p build && cd build          # cd only if mkdir succeeded\nping -c1 host &>/dev/null || echo \"host down\"   # message only on failure\n[[ -f .env ]] && source .env        # load .env if present" }
      ]
    },
    {
      id: "loops",
      title: "Loops",
      level: "core",
      body: [
        { type: "code", lang: "bash", code: "# for over a list / a glob\nfor f in *.txt; do\n  echo \"processing $f\"\ndone\n\n# C-style for (arithmetic)\nfor (( i = 0; i < 5; i++ )); do\n  echo \"i = $i\"\ndone\n\n# over a numeric range\nfor n in {1..10}; do echo \"$n\"; done\nfor n in $(seq 1 2 10); do echo \"$n\"; done   # 1 3 5 7 9" },
        { type: "heading", text: "Reading a file line by line (the correct idiom)" },
        { type: "code", lang: "bash", code: "while IFS= read -r line; do\n  echo \"got: $line\"\ndone < input.txt\n\n# IFS=   -> don't trim leading/trailing whitespace\n# -r     -> don't let backslashes be interpreted (keep them literal)\n# < file -> feed the file as stdin to the whole loop" },
        { type: "callout", variant: "gotcha", text: "**Never** do `for line in $(cat file)` — it splits on *all* whitespace (not just newlines) and glob-expands. Always use `while IFS= read -r line; do ...; done < file`. This is one of the most common bash bugs in the wild." },
        { type: "code", lang: "bash", code: "# until: loop while a condition is FALSE (opposite of while)\nuntil ping -c1 db &>/dev/null; do\n  echo \"waiting for db...\"; sleep 2\ndone\n\n# break / continue work as expected\nfor f in *.log; do\n  [[ -s $f ]] || continue    # skip empty files\n  grep -q FATAL \"$f\" && { echo \"fatal in $f\"; break; }\ndone" }
      ]
    },
    {
      id: "functions",
      title: "Functions & arguments",
      level: "core",
      body: [
        { type: "code", lang: "bash", code: "greet() {\n  local name=\"$1\"          # local = scoped to the function (always use it)\n  local greeting=\"${2:-Hello}\"\n  echo \"$greeting, $name!\"  # a function's stdout is its \"return value\"\n}\n\ngreet \"World\"             # -> Hello, World!\ngreet \"Sam\" \"Hi\"          # -> Hi, Sam!\nresult=$(greet \"Ann\")      # capture the output" },
        { type: "table", headers: ["Variable", "Is"], rows: [
          ["`$0`", "the script (or function) name"],
          ["`$1 $2 …`", "positional arguments"],
          ["`$#`", "number of arguments"],
          ["`\"$@\"`", "all args, each as a **separate** quoted word (use this)"],
          ["`\"$*\"`", "all args as **one** string joined by the first char of `IFS`"],
          ["`$?`", "exit status of the last command (0 = success)"],
          ["`$$` / `$!`", "current PID / PID of last background job"]
        ] },
        { type: "code", lang: "bash", code: "process_all() {\n  (( $# > 0 )) || { echo \"usage: process_all FILE...\" >&2; return 2; }\n  for f in \"$@\"; do        # \"$@\" preserves each argument exactly\n    echo \"-> $f\"\n  done\n}\nprocess_all a.txt \"my file.txt\" c.txt" },
        { type: "callout", variant: "tip", text: "A function communicates two ways: **stdout** (captured with `$(...)`) for data, and its **return code** (0-255, via `return N`) for success/failure. Don't `return` a string — `echo` it. And `return` only sets a status; use `exit` to end the whole script." }
      ]
    },
    {
      id: "pro-scripts",
      title: "Writing professional scripts",
      level: "deep",
      body: [
        { type: "p", text: "The difference between a throwaway script and one you'd ship is **failure handling**. Bash's defaults are dangerously lax — a typo'd variable is silently empty, a failed command in the middle keeps going. These lines fix that." },
        { type: "heading", text: "The safety preamble" },
        { type: "code", lang: "bash", code: "#!/usr/bin/env bash\nset -euo pipefail\nIFS=$'\\n\\t'\n\n# set -e  : exit immediately if any command fails (non-zero)\n# set -u  : error on use of an UNSET variable (catches typos)\n# set -o pipefail : a pipeline fails if ANY stage fails, not just the last\n# IFS=... : split only on newline/tab, not spaces — safer word-splitting" },
        { type: "callout", variant: "warn", text: "`set -e` has sharp edges: it does *not* trigger inside `if`/`while` conditions or `||`/`&&` chains, and a function's failure can be masked. It's a safety net, not a guarantee — still check critical commands explicitly. But it catches the 90% case of \"kept running after something broke.\"" },
        { type: "heading", text: "Cleanup with trap" },
        { type: "code", lang: "bash", code: "tmpdir=$(mktemp -d)                 # safe unique temp dir\ncleanup() { rm -rf \"$tmpdir\"; }\ntrap cleanup EXIT                   # run cleanup on ANY exit (success, error, Ctrl-C)\ntrap 'echo \"failed at line $LINENO\" >&2' ERR\n\n# ...work inside \"$tmpdir\"... it's removed automatically when the script ends." },
        { type: "heading", text: "Argument parsing" },
        { type: "code", lang: "bash", code: "usage() { echo \"usage: $0 [-v] [-o OUTFILE] FILE\" >&2; exit 2; }\n\nverbose=0\noutfile=\"\"\nwhile getopts \":vo:h\" opt; do\n  case \"$opt\" in\n    v) verbose=1 ;;\n    o) outfile=\"$OPTARG\" ;;\n    h) usage ;;\n    \\?) echo \"unknown option: -$OPTARG\" >&2; usage ;;\n    :)  echo \"-$OPTARG needs an argument\" >&2; usage ;;\n  esac\ndone\nshift $(( OPTIND - 1 ))              # drop parsed options; $1 is now the first FILE\n\n[[ $# -ge 1 ]] || usage\ninput=\"$1\"\n(( verbose )) && echo \"processing $input -> ${outfile:-stdout}\" >&2" },
        { type: "callout", variant: "tip", text: "For **long options** (`--output`), a `while [[ $# -gt 0 ]]; do case \"$1\" in --output) outfile=\"$2\"; shift 2;; ...` loop is the common pattern, since `getopts` only does short flags. Send all diagnostic/log output to **stderr** (`>&2`) so stdout stays clean for real data that callers might pipe." },
        { type: "callout", variant: "good", text: "Lint every script with **`shellcheck`** (`shellcheck script.sh`) — it catches unquoted variables, `[ ]` pitfalls, useless `cat`, and dozens of subtle bugs before they bite. It's the single best habit for writing correct bash; most editors integrate it inline." }
      ]
    },
    {
      id: "jobs-processes",
      title: "Jobs, processes & signals",
      level: "core",
      body: [
        { type: "code", lang: "bash", code: "long_task &          # run in the BACKGROUND, shell returns immediately\njobs                 # list background jobs of this shell\nfg %1                # bring job 1 to the FOREGROUND\nbg %1                # resume a stopped job in the background\n# Ctrl-Z              # SUSPEND the foreground job (then bg/fg it)\nwait                 # wait for all background jobs to finish\nwait $!              # wait for the LAST background job specifically" },
        { type: "code", lang: "bash", code: "# keep a job alive after you log out:\nnohup ./server.sh &          # ignores hangup; output -> nohup.out\ndisown -h %1                 # detach an already-running job from the shell\n\n# run several things in parallel and wait for all:\nfor url in \"${urls[@]}\"; do curl -sO \"$url\" & done\nwait\necho \"all downloads done\"" },
        { type: "heading", text: "Inspecting & killing" },
        { type: "code", lang: "bash", code: "ps aux | grep nginx      # snapshot of processes\ntop        # or  htop / btop — live process monitor\npgrep -fl python         # find PIDs by name (with full command line)\nkill 1234                # send SIGTERM (15) — polite \"please stop\"\nkill -9 1234             # SIGKILL (9) — force, last resort (no cleanup)\npkill -f \"node server\"    # kill by command-line match\nkill -l                  # list all signal names" },
        { type: "callout", variant: "note", text: "Signals are how you talk to a running process: **SIGTERM** (15, default `kill`) asks it to shut down gracefully; **SIGKILL** (9) is unstoppable but skips cleanup; **SIGHUP** (1) often means \"reload config\"; **SIGINT** (2) is what `Ctrl-C` sends. Prefer `-TERM` first and only escalate to `-9` if it hangs." }
      ]
    },
    {
      id: "env-path",
      title: "Environment, PATH & dotfiles",
      level: "core",
      body: [
        { type: "code", lang: "bash", code: "env                    # print all environment variables\necho \"$PATH\"           # colon-separated dirs searched for commands\nwhich python3          # where a command resolves to\ntype -a ls             # is it a builtin, alias, function, or file? (all of them)\nexport EDITOR=vim      # set an env var for this shell AND its children\nPATH=\"$HOME/.local/bin:$PATH\"   # prepend a dir (yours wins over system copies)" },
        { type: "heading", text: "Which file runs when?" },
        { type: "table", headers: ["File", "Read by"], rows: [
          ["`~/.bashrc`", "each **interactive non-login** shell (new terminal tabs) — put aliases & prompt here"],
          ["`~/.bash_profile` / `~/.profile`", "**login** shells (SSH, console login) — usually just sources `.bashrc`"],
          ["`/etc/profile`, `/etc/bash.bashrc`", "system-wide defaults for all users"],
          ["`~/.bash_logout`", "runs on logout"]
        ] },
        { type: "code", lang: "bash", code: "# handy things that live in ~/.bashrc:\nalias ll='ls -lah'\nalias gs='git status'\nalias ..='cd ..'\nexport HISTSIZE=100000        # remember more history\nexport HISTCONTROL=ignoredups # don't store duplicate lines\nmkcd() { mkdir -p \"$1\" && cd \"$1\"; }   # a tiny function\n\n# after editing, reload without opening a new terminal:\nsource ~/.bashrc" },
        { type: "callout", variant: "gotcha", text: "Aliases are **not** available in scripts (scripts don't read `.bashrc`, and aliases are off in non-interactive shells). For reusable logic in scripts, write **functions** in a sourced file, not aliases." }
      ]
    },
    {
      id: "networking-archives",
      title: "Networking & archives",
      level: "core",
      body: [
        { type: "code", lang: "bash", code: "curl -fsSL https://api.example.com/health          # fetch; -f fail on HTTP error, -s silent, -L follow redirects\ncurl -o out.json https://api.example.com/data      # save to a file (-O keeps remote name)\ncurl -H \"Authorization: Bearer $TOKEN\" URL          # add a header\ncurl -X POST -d '{\"a\":1}' -H \"Content-Type: application/json\" URL   # POST JSON\nwget -c https://host/big.iso                       # download; -c resumes a partial file" },
        { type: "code", lang: "bash", code: "ssh user@host                       # remote shell\nssh -i ~/.ssh/id_ed25519 user@host  # with a specific key\nscp file.txt user@host:/tmp/        # copy a file over SSH\nrsync -avz --delete src/ user@host:/backup/   # mirror a tree (fast, incremental)\n# -a archive (perms/times/symlinks), -v verbose, -z compress, --delete removes extras" },
        { type: "code", lang: "bash", code: "tar -czf backup.tar.gz project/     # CREATE a gzip'd tarball  (c=create z=gzip f=file)\ntar -xzf backup.tar.gz              # EXTRACT it  (x=extract)\ntar -tzf backup.tar.gz              # LIST contents without extracting\nzip -r site.zip site/               # zip a directory\nunzip site.zip -d out/              # unzip into out/\ngzip -k big.log                     # compress (keep original with -k)" },
        { type: "code", lang: "bash", code: "ss -tulpn            # listening TCP/UDP sockets + owning process (modern netstat)\nping -c4 example.com  # 4 packets then stop\ndig +short example.com   # DNS lookup (or  nslookup / host)\nip addr              # network interfaces & IPs  (older: ifconfig)" },
        { type: "callout", variant: "tip", text: "`curl -fsSL` is the canonical set for scripts: **f**ail on errors (so `set -e` catches a 404), **s**ilent (no progress bar), **S**how errors anyway, **L** follow redirects. Without `-f`, curl exits 0 even on a `500`, silently piping an error page into your logic." }
      ]
    },
    {
      id: "permissions",
      title: "Permissions, users & sudo",
      level: "core",
      body: [
        { type: "p", text: "Every file has an **owner**, a **group**, and three permission triads — for user/group/other — each with read (4), write (2), execute (1). `ls -l` shows them as `-rwxr-xr--`." },
        { type: "code", lang: "bash", code: "chmod +x script.sh        # add execute for everyone\nchmod u+x,go-w file       # symbolic: user +execute, group/other -write\nchmod 755 script.sh       # rwx r-x r-x  (owner all, others read+exec)\nchmod 644 file.txt        # rw- r-- r--  (typical data file)\nchmod 600 ~/.ssh/id_ed25519   # rw- --- ---  (private key: owner only!)\nchown user:group file     # change owner and group\nchmod -R 755 dir/         # recursive (careful — see below)" },
        { type: "table", headers: ["Octal", "Symbolic", "Typical use"], rows: [
          ["`755`", "`rwxr-xr-x`", "executables, directories"],
          ["`644`", "`rw-r--r--`", "normal files"],
          ["`600`", "`rw-------`", "secrets, SSH keys"],
          ["`700`", "`rwx------`", "private directories"]
        ] },
        { type: "code", lang: "bash", code: "sudo apt update           # run one command as root\nsudo -i                   # start a root shell (or  sudo su -)\nsudo -u postgres psql     # run as a DIFFERENT user\nwhoami; id                 # who am I / my uid, gid, groups\numask                     # default-permission mask for NEW files (022 is typical)" },
        { type: "callout", variant: "warn", text: "**Never** `chmod -R 777` anything — it makes files world-writable (anyone can modify them), a classic security hole, and `+x` on every data file is meaningless noise. If a service can't read a file, fix **ownership** (`chown`) or use `750`/`640`, not `777`." }
      ]
    },
    {
      id: "modern-tools",
      title: "Modern CLI tools worth installing",
      level: "core",
      body: [
        { type: "p", text: "The classic tools are everywhere, but a small set of modern replacements are dramatically faster and friendlier. All are single binaries; install via `apt`/`brew`/`cargo`. These are the ones that pay for themselves in a day." },
        { type: "table", headers: ["Tool", "Replaces / adds", "Why you want it"], rows: [
          ["**fzf**", "`Ctrl-R`, file pickers", "fuzzy-finder for *anything* — history, files, git branches; the biggest single upgrade"],
          ["**ripgrep** (`rg`)", "`grep -r`", "recursively greps a repo in milliseconds, respects `.gitignore`"],
          ["**fd**", "`find`", "sane syntax (`fd '\\.js$'`), fast, gitignore-aware"],
          ["**bat**", "`cat`", "syntax-highlighted `cat` with line numbers & git gutter"],
          ["**eza**", "`ls`", "colored `ls` with icons, tree view (`eza --tree`), git status"],
          ["**zoxide** (`z`)", "`cd`", "`z proj` jumps to your most-used dir matching \"proj\""],
          ["**jq** / **yq**", "—", "slice & transform JSON / YAML on the command line"],
          ["**tldr**", "`man`", "community cheat-sheets: `tldr tar` shows the 5 examples you actually need"],
          ["**htop** / **btop**", "`top`", "interactive, colorful process/resource monitor"],
          ["**ncdu**", "`du`", "interactive disk-usage explorer — find what ate your disk"],
          ["**tmux**", "—", "terminal multiplexer: split panes, detachable sessions that survive SSH drops"],
          ["**delta**", "`diff`", "gorgeous side-by-side git diffs"],
          ["**entr**", "—", "run a command whenever files change (`ls *.c | entr make`)"],
          ["**direnv**", "—", "auto-load per-project env vars when you `cd` in"]
        ] },
        { type: "code", lang: "bash", code: "# install examples\nsudo apt install fzf ripgrep fd-find bat        # Debian/Ubuntu\nbrew install fzf ripgrep fd bat eza zoxide jq   # macOS\ncargo install ripgrep fd-find bat eza zoxide    # via Rust\n\n# jq: pull a field out of JSON\ncurl -s api/user/1 | jq '.name'\ncurl -s api/users | jq -r '.[] | .email'        # -r = raw (unquoted) strings\n\n# fzf: fuzzy-open a file in your editor\nvim \"$(fzf)\"\n# rg: find a symbol across a repo, fast\nrg -n \"function login\" src/" },
        { type: "callout", variant: "good", text: "Wire up **fzf's key bindings** (`Ctrl-R` fuzzy history, `Ctrl-T` fuzzy file insert, `Alt-C` fuzzy cd) — run the installer's setup script and source it in `.bashrc`. Add **starship** (`starship`) for a fast, informative prompt (git branch, exit code, language versions) with zero config." }
      ]
    },
    {
      id: "power-moves",
      title: "Handy one-liners & power moves",
      level: "deep",
      body: [
        { type: "code", lang: "bash", code: "cp report.txt{,.bak}          # brace expansion -> cp report.txt report.txt.bak\nmkdir -p project/{src,test,docs}   # make three sibling dirs at once\nmv img_{001,002,003}.png dest/     # expands to three files\n\ndiff <(sort a.txt) <(sort b.txt)   # process substitution: treat command output as a file\ncomm -23 <(sort a) <(sort b)       # lines in a but not b\n\ncd -           # jump back to the previous directory\nsudo !!        # re-run the last command with sudo\n!$             # the last argument of the previous command" },
        { type: "code", lang: "bash", code: "# parallelism with xargs (8 workers):\nfind . -name '*.png' -print0 | xargs -0 -P8 -I{} optipng {}\n\n# watch a command refresh every 2s:\nwatch -n2 'df -h /'\n\n# time how long something takes:\ntime ./build.sh\n\n# run a command repeatedly until it succeeds:\nuntil curl -fsS localhost:8080/health; do sleep 1; done" },
        { type: "heading", text: "Scheduling with cron" },
        { type: "code", lang: "bash", code: "crontab -e        # edit YOUR scheduled jobs\ncrontab -l        # list them\n\n# format:  minute hour day-of-month month day-of-week  command\n# 0 2 * * *     -> every day at 02:00\n# */15 * * * *  -> every 15 minutes\n# 0 9 * * 1     -> 09:00 every Monday\n0 2 * * * /home/me/backup.sh >> /home/me/backup.log 2>&1" },
        { type: "callout", variant: "note", text: "cron runs with a **minimal environment** (a bare `PATH`, no `.bashrc`), so always use **absolute paths** to commands and files in cron jobs, and redirect output to a log — cron mails output nowhere useful by default. On modern systems, `systemd` timers are a more powerful alternative." }
      ]
    },
    {
      id: "danger-zone",
      title: "⚠️ Famous destructive commands (never run these)",
      level: "deep",
      body: [
        { type: "callout", variant: "warn", text: "⚠️ **DANGER — READ, DON'T RUN.** These are infamous shell footguns. They can wipe your disk, brick a boot, or lock you out. They are here so you **recognize** them (in a copy-pasted \"fix,\" a prank gist, or your own typo) — *not* to execute. If you ever want to see one work, do it in a **throwaway VM or container** you can delete, never on a real machine." },
        { type: "heading", text: "The fork bomb" },
        { type: "code", lang: "bash", code: ":(){ :|:& };:      # ⚠️ defines a function \":\" that calls itself twice, forever,\n                    # in the background — exhausts process slots & RAM, freezing the box." },
        { type: "p", text: "It reads as: define `:` as a function that pipes itself into another copy of itself and backgrounds it, then call `:`. Each call spawns two more. Defense: a `ulimit -u` process cap (often set in `/etc/security/limits.conf`) blunts it." },
        { type: "heading", text: "Recursive deletion of everything" },
        { type: "code", lang: "bash", code: "rm -rf /                       # ⚠️ tries to delete the entire filesystem\nrm -rf --no-preserve-root /    # ⚠️ modern rm refuses \"/\" unless you force it — this forces it\nrm -rf ~   /   rm -rf .*        # ⚠️ home wipe / \".*\" can match \"..\" and climb upward\nrm -rf \"$DIR/\"                  # ⚠️ if $DIR is UNSET/empty this becomes  rm -rf /" },
        { type: "callout", variant: "gotcha", text: "The empty-variable trap is the realistic one: a script does `rm -rf \"$BUILD/\"*` and `$BUILD` was never set. `set -u` (error on unset vars) and always quoting + validating paths (`[[ -n $DIR ]]`) prevents the accident that actually happens to people." },
        { type: "heading", text: "Overwriting disks & devices directly" },
        { type: "code", lang: "bash", code: "dd if=/dev/zero of=/dev/sda    # ⚠️ writes zeros over your whole primary disk (unrecoverable)\nmkfs.ext4 /dev/sda             # ⚠️ formats a disk — instantly destroys its filesystem\n> /dev/sda                     # ⚠️ truncating/writing a raw device corrupts it\ncat /dev/urandom > /dev/sda    # ⚠️ fills the disk with random bytes" },
        { type: "heading", text: "Other classics" },
        { type: "code", lang: "bash", code: "chmod -R 777 /                 # ⚠️ makes the whole system world-writable — a security catastrophe\nchmod -R 000 ~                 # ⚠️ removes all your own access to your files\nmv /* /dev/null                # ⚠️ /dev/null is a black hole; \"moving\" files there loses them\ncurl http://sketchy.sh | bash  # ⚠️ runs UNSEEN remote code as you — inspect scripts before piping to a shell\nhistory -c && > ~/.bashrc      # ⚠️ wipes history and blanks your shell config" },
        { type: "callout", variant: "note", text: "Not destructive, but the same *family* of \"looks harmless, isn't\": `: > important.log` truncates a file to zero in one keystroke, and a stray space — `rm -rf / home/me/tmp` instead of `/home/me/tmp` — deletes `/`. The habit that saves you: pause before any `rm -rf`, prefer `rm -i` interactively, snapshot/back up first, and keep dangerous experiments in disposable VMs." }
      ]
    },
    {
      id: "headaches",
      title: "Common headaches & how to handle them",
      level: "core",
      body: [
        { type: "list", ordered: false, items: [
          "**Unquoted variables word-split & glob-expand.** `cp $src $dst` breaks on spaces and `*`. Fix: quote *everything* — `cp \"$src\" \"$dst\"`. Run **shellcheck**; this is its #1 finding.",
          "**`for line in $(cat file)` mangles data.** It splits on all whitespace. Fix: `while IFS= read -r line; do ...; done < file`.",
          "**A pipe loses your variable.** `cmd | while read x; do total=$x; done; echo \"$total\"` prints nothing — the `while` ran in a subshell. Fix: `while ...; done < <(cmd)` (process substitution) or `shopt -s lastpipe`.",
          "**`[ ]` vs `[[ ]]` and `=` vs `==`.** Prefer `[[ ]]`. Use `-eq/-lt` for numbers, `==/<` for strings — never cross them. With `[ ]`, an empty unquoted var is a syntax error; `[[ ]]` avoids it.",
          "**CRLF line endings from Windows.** A script saved with `\\r\\n` fails with `bad interpreter: /bin/bash^M` or weird `command not found`. Fix: `sed -i 's/\\r$//' script.sh` or `dos2unix script.sh`; set your editor to LF.",
          "**Forgot `chmod +x`.** `./script.sh` gives `Permission denied`. Fix: `chmod +x script.sh`, or just run `bash script.sh`.",
          "**`cd` in a script doesn't move your shell.** It ran in a child process. Fix: `source script.sh` (or `.`) to run it in the current shell.",
          "**`set -e` didn't stop on failure.** It's ignored inside `if`/`while`/`&&`/`||` and can be masked in functions/subshells. Don't rely on it alone — check critical commands (`cmd || { echo fail >&2; exit 1; }`).",
          "**`$?` checked too late.** Every command overwrites `$?`. Capture it immediately: `cmd; rc=$?` before running anything else, including `echo`.",
          "**Assignment with spaces.** `x = 5` runs a command named `x`; it must be `x=5` (no spaces around `=`)."
        ] }
      ]
    }
  ],

  packages: [
    { name: "shellcheck", why: "Static linter for bash — catches unquoted vars, `[ ]` pitfalls, and subtle bugs before they bite. The #1 script-quality tool." },
    { name: "fzf", why: "Fuzzy finder — supercharges `Ctrl-R` history, file/branch pickers. The single biggest interactive upgrade." },
    { name: "ripgrep (rg)", why: "Blazingly fast, gitignore-aware recursive grep for codebases." },
    { name: "fd", why: "A simpler, faster `find` with sane syntax and gitignore support." },
    { name: "bat", why: "`cat` with syntax highlighting, line numbers, and a git gutter." },
    { name: "eza", why: "A modern, colorful `ls` with tree view and git status." },
    { name: "zoxide", why: "Smarter `cd` — `z partial-name` jumps to your most-used matching dir." },
    { name: "jq / yq", why: "Command-line JSON / YAML slicing and transformation." },
    { name: "tmux", why: "Terminal multiplexer: split panes and detachable sessions that survive SSH drops." },
    { name: "tldr", why: "Community cheat-sheets — the handful of examples you actually need, faster than `man`." },
    { name: "htop / btop", why: "Interactive, colorful process & resource monitors." },
    { name: "starship", why: "Fast, informative shell prompt (git, exit code, language versions) with near-zero config." }
  ],

  gotchas: [
    "**Quote your variables.** Unquoted `$x` word-splits and glob-expands — the source of most bash bugs. `\"$x\"` and `\"${arr[@]}\"` almost always.",
    "**No spaces around `=`** in assignments: `x=5`, never `x = 5`.",
    "**Read files with `while IFS= read -r line`,** never `for line in $(cat file)`.",
    "**Pipes create subshells** — variables set inside `cmd | while ...` vanish. Use `< <(cmd)` or `shopt -s lastpipe`.",
    "**`set -euo pipefail`** at the top of every serious script — fail fast on errors, unset vars, and broken pipelines.",
    "**Numeric vs string tests:** `-eq/-lt` for numbers, `==/<` for strings. `[[ 10 > 9 ]]` is false (string compare).",
    "**`source`/`.` to affect the current shell;** `./script` runs in a child whose `cd`/exports don't persist.",
    "**A glob that matches nothing** passes through literally by default — `shopt -s nullglob` to expand to nothing instead.",
    "**Never `chmod -R 777`** — world-writable is a security hole; fix ownership instead.",
    "**cron has a bare environment** — use absolute paths and redirect output to a log."
  ],

  flashcards: [
    { q: "What does `set -euo pipefail` do?", a: "`-e` exit on any command failure, `-u` error on unset variables, `-o pipefail` fail a pipeline if *any* stage fails. The standard safety preamble." },
    { q: "Why `while IFS= read -r line; do ...; done < file` instead of `for line in $(cat file)`?", a: "The `for` splits on *all* whitespace and glob-expands. The `while read` reads one whole line at a time; `IFS=` preserves leading/trailing spaces and `-r` keeps backslashes literal." },
    { q: "Difference between `\"$@\"` and `\"$*\"`?", a: "`\"$@\"` expands to each argument as a **separate** quoted word (what you almost always want). `\"$*\"` joins them into **one** string separated by the first char of `IFS`." },
    { q: "How do you redirect both stdout and stderr to a file — and why does order matter?", a: "`cmd > file 2>&1` (redirect stdout first, then point stderr at wherever stdout now goes). `2>&1 > file` fails because stderr is duplicated to the terminal *before* stdout is redirected." },
    { q: "What's the difference between `source script.sh` and `./script.sh`?", a: "`source` (or `.`) runs it in the **current** shell, so its `cd`/`export`/variables persist. `./script.sh` runs in a **child** shell; those changes vanish on exit." },
    { q: "How do you capture a command's output into a variable?", a: "Command substitution: `x=$(command)`. Prefer `$(...)` over backticks — it nests and is clearer." },
    { q: "What does `${var:-default}` do, and `${var:?msg}`?", a: "`:-` yields `default` when `var` is unset/empty (without changing it). `:?` aborts the script with `msg` if `var` is unset — great for required inputs." },
    { q: "Why quote `\"$file\"` when running `rm \"$file\"`?", a: "Without quotes, a filename with spaces word-splits into multiple arguments (deleting the wrong files) and any `*` glob-expands. Quotes keep the value as one literal argument." },
    { q: "What is a fork bomb and what does `:(){ :|:& };:` do?", a: "A function `:` that pipes itself into another backgrounded copy of itself and then calls itself — spawning processes exponentially until the system runs out and freezes. ⚠️ Never run it; VM only." },
    { q: "How do you make a temp dir that's auto-cleaned on exit?", a: "`tmp=$(mktemp -d); trap 'rm -rf \"$tmp\"' EXIT` — `trap ... EXIT` runs cleanup on any exit (success, error, or Ctrl-C)." },
    { q: "Which tests are for numbers vs strings?", a: "Numbers: `-eq -ne -lt -le -gt -ge`. Strings: `==` `!=` `<` `>`. Mixing them gives wrong results — `[[ 10 > 9 ]]` is false (string), `[[ 10 -gt 9 ]]` is true." },
    { q: "What's the fast way to search a whole repo, and why is it better than `grep -r`?", a: "`rg pattern` (ripgrep) — it's far faster, respects `.gitignore`, and has color/line-numbers by default." },
    { q: "How do you parse short options in a script?", a: "`getopts \":vo:h\" opt` in a `while` loop with a `case`; a `:` after a letter (like `o:`) means it takes an argument in `$OPTARG`. Then `shift $((OPTIND-1))`." },
    { q: "Why does `echo hi | read x; echo \"$x\"` print nothing?", a: "The pipeline runs `read` in a subshell, so `x` is set there and lost. Use `read x < <(echo hi)` or enable `shopt -s lastpipe`." }
  ],

  cheatsheet: [
    { label: "Safety preamble", code: "set -euo pipefail" },
    { label: "Loop over files safely", code: "for f in *.log; do echo \"$f\"; done" },
    { label: "Read a file line by line", code: "while IFS= read -r line; do echo \"$line\"; done < file" },
    { label: "Capture output", code: "today=$(date +%F)" },
    { label: "Default value", code: "port=\"${PORT:-8080}\"" },
    { label: "Numeric test", code: "if (( count > 100 )); then ...; fi" },
    { label: "File exists?", code: "[[ -f config.yaml ]] && echo yes" },
    { label: "Redirect all output", code: "cmd > out.log 2>&1" },
    { label: "Discard output", code: "cmd > /dev/null 2>&1" },
    { label: "Count & rank", code: "sort file | uniq -c | sort -rn | head" },
    { label: "First column", code: "awk '{print $1}' file" },
    { label: "In-place replace", code: "sed -i 's/old/new/g' file" },
    { label: "Recursive search (fast)", code: "rg -n \"pattern\" src/" },
    { label: "Find & delete", code: "find . -name '*.tmp' -delete" },
    { label: "Background + wait all", code: "task1 & task2 & wait" },
    { label: "Temp dir with cleanup", code: "t=$(mktemp -d); trap 'rm -rf \"$t\"' EXIT" },
    { label: "Make + enter dir", code: "mkdir -p a/b && cd $_" },
    { label: "Fetch (script-safe)", code: "curl -fsSL \"$url\"" },
    { label: "Mirror a tree", code: "rsync -avz --delete src/ dst/" },
    { label: "Lint a script", code: "shellcheck script.sh" }
  ]
});
