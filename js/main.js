/* ============================================================
   main.js — Markdown 渲染器 + 交互（一般不用改）
   ------------------------------------------------------------
   1. 把 index.html 里 <script type="text/markdown"> 的内容渲染成页面
   2. 从 h1 分区自动生成侧边栏目录（锚点 #sec-N）
   3. 滚动高亮当前分区 + 顶部进度条
   4. 深浅色切换（记忆到 localStorage）
   5. 移动端目录抽屉

   改内容 → 编辑 index.html 里的 Markdown 块。
   ============================================================ */

(function () {
  "use strict";

  /* ---------- 转义 + 行内标记：**加粗** / `代码` / [文字](链接) ---------- */
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function inline(text) {
    var s = escapeHtml(text);
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (m, t, url) {
      return '<a href="' + url + '">' + inline(t) + "</a>";
    });
    s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    return s;
  }

  /* ---------- 去掉 script 标签里的公共缩进 ---------- */
  function dedent(src) {
    var lines = src.split("\n");
    var nonEmpty = lines.filter(function (l) { return l.trim(); });
    if (!nonEmpty.length) return "";
    var min = Math.min.apply(
      null,
      nonEmpty.map(function (l) {
        return (l.match(/^[ \t]*/) || [""])[0].length;
      })
    );
    return lines.map(function (l) { return l.slice(min); }).join("\n");
  }

  /* ---------- Markdown → HTML ---------- */
  function renderMarkdown(src) {
    var lines = dedent(src).split("\n");
    var html = "";
    var sections = [];
    var inSection = false;
    var listType = null;
    var i = 0;

    function closeList() {
      if (listType) {
        html += "</" + listType + ">";
        listType = null;
      }
    }

    while (i < lines.length) {
      var line = lines[i].trim();
      var isEmpty = line === "";

      // 围栏代码块
      if (/^```/.test(line)) {
        closeList();
        var buf = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i].trim())) {
          buf.push(lines[i]);
          i++;
        }
        i++; // 跳过收尾 ```
        html += "<pre><code>" + escapeHtml(buf.join("\n")) + "</code></pre>";
        continue;
      }

      // 标题
      var hm = line.match(/^(#{1,3})\s+(.+)$/);
      if (hm) {
        closeList();
        var level = hm[1].length;
        var text = hm[2];
        if (level === 1) {
          var id = "sec-" + (sections.length + 1);
          sections.push(text);
          if (inSection) html += "</section>";
          html += '<section id="' + id + '"><h1>' + inline(text) + "</h1>";
          inSection = true;
        } else {
          html += "<h" + level + ">" + inline(text) + "</h" + level + ">";
        }
        i++;
        continue;
      }

      // 引用块（连续 > 行）
      if (line.charAt(0) === ">") {
        closeList();
        var q = [];
        while (i < lines.length && lines[i].trim().charAt(0) === ">") {
          q.push(inline(lines[i].trim().replace(/^>\s?/, "")));
          i++;
        }
        html += "<blockquote>" + q.join("") + "</blockquote>";
        continue;
      }

      // 无序列表
      if (/^[-*]\s+/.test(line)) {
        if (listType !== "ul") {
          closeList();
          html += "<ul>";
          listType = "ul";
        }
        html += "<li>" + inline(line.replace(/^[-*]\s+/, "")) + "</li>";
        i++;
        continue;
      }
      // 有序列表
      if (/^\d+\.\s+/.test(line)) {
        if (listType !== "ol") {
          closeList();
          html += "<ol>";
          listType = "ol";
        }
        html += "<li>" + inline(line.replace(/^\d+\.\s+/, "")) + "</li>";
        i++;
        continue;
      }

      // 分隔线
      if (/^-{3,}$/.test(line)) {
        closeList();
        html += "<hr>";
        i++;
        continue;
      }

      // 空行
      if (isEmpty) {
        closeList();
        i++;
        continue;
      }

      // 段落：收集到下一个空行 / 特殊块
      closeList();
      var para = [];
      while (i < lines.length) {
        var t = lines[i].trim();
        if (
          t === "" ||
          /^(#{1,3}\s)/.test(t) ||
          /^```/.test(t) ||
          /^-{3,}$/.test(t) ||
          t.charAt(0) === ">" ||
          /^[-*]\s+/.test(t) ||
          /^\d+\.\s+/.test(t)
        ) {
          break;
        }
        para.push(t);
        i++;
      }
      if (para.length) html += "<p>" + inline(para.join(" ")) + "</p>";
    }

    closeList();
    if (inSection) html += "</section>";
    return { html: html, sections: sections };
  }

  /* ---------- 构建侧边栏目录 ---------- */
  function buildToc(sections) {
    var list = document.getElementById("toc-list");
    sections.forEach(function (text, idx) {
      var a = document.createElement("a");
      a.href = "#sec-" + (idx + 1);
      a.innerHTML = inline(text);
      list.appendChild(a);
    });
  }

  /* ---------- 初始化 ---------- */
  function init() {
    var source = document.getElementById("md-source");
    var root = document.getElementById("md-root");
    if (!source || !root) return;

    var rendered = renderMarkdown(source.textContent);
    root.innerHTML = rendered.html;
    buildToc(rendered.sections);

    var progressBar = document.getElementById("progress-bar");
    var tocLinks = Array.prototype.slice.call(
      document.querySelectorAll("#toc-list a")
    );
    var secs = Array.prototype.slice.call(document.querySelectorAll(".md section"));
    var themeBtn = document.getElementById("theme-btn");
    var toc = document.getElementById("toc");
    var tocBtn = document.getElementById("toc-btn");
    var tocMask = document.getElementById("toc-mask");
    var isMobile = function () {
      return window.matchMedia("(max-width: 860px)").matches;
    };

    /* 滚动：进度条 + 分区高亮 */
    function onScroll() {
      var doc = document.documentElement;
      var pct = doc.scrollTop / Math.max(1, doc.scrollHeight - doc.clientHeight);
      progressBar.style.width = pct * 100 + "%";

      var probe = 70; // 检测线：视口往下 70px
      var current = null;
      secs.forEach(function (s) {
        if (s.getBoundingClientRect().top <= probe) current = s;
      });
      tocLinks.forEach(function (a) {
        a.classList.toggle("active", current && a.getAttribute("href") === "#" + current.id);
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });

    /* 深浅色 */
    function applyTheme(t) {
      document.documentElement.setAttribute("data-theme", t);
      themeBtn.textContent = t === "dark" ? "浅色" : "深色";
      try {
        localStorage.setItem("xv-theme", t);
      } catch (e) {}
    }
    themeBtn.addEventListener("click", function () {
      var now = document.documentElement.getAttribute("data-theme") || "light";
      applyTheme(now === "dark" ? "light" : "dark");
    });
    var saved = null;
    try {
      saved = localStorage.getItem("xv-theme");
    } catch (e) {}
    if (saved === "dark" || saved === "light") {
      applyTheme(saved);
    } else {
      applyTheme(
        window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      );
    }

    /* 移动端目录抽屉 */
    tocBtn.addEventListener("click", function () {
      toc.classList.add("open");
      tocMask.hidden = false;
    });
    function closeToc() {
      toc.classList.remove("open");
      tocMask.hidden = true;
    }
    tocMask.addEventListener("click", closeToc);
    toc.addEventListener("click", function (e) {
      if (isMobile() && e.target.closest("a")) closeToc();
    });

    /* 初始 hash（从 #sec-N 进入） */
    onScroll();
    if (location.hash && location.hash.indexOf("#sec-") === 0) {
      var el = document.querySelector(location.hash);
      if (el) {
        setTimeout(function () {
          el.scrollIntoView({ behavior: "smooth" });
        }, 50);
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
