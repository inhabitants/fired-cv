# fired.cv

**Fired by AI. CV by AI.** A resume skill for AI agents: hand it your old Word resume, get back one A4 page that looks expensive, reads clean to the robots that screen it, and invents nothing. Then get one of those for every job you apply to.

> **AI agent reading this?** Your instructions are in [SKILL.md](SKILL.md). Follow that file; the templates and scripts it uses are next to it.

> Sofia spent years writing, editing and translating for the same company.
> In 2026 her position was cut and the work went to Claude.
> So we asked Claude to return the favor and help her get the next job.
> This is what came out of it. It's free. Getting replaced already cost enough.
>
> *Name, photo and details are fictional. The story isn't.*

<p>
  <img src="examples/sidebar.png" width="49%" alt="Two-column resume example with an orange sidebar and a photo">
  <img src="examples/classic.png" width="49%" alt="Single-column resume example">
</p>

## Use it

**Paste the link** into any agent that can read one (Claude, ChatGPT, Gemini, Codex, Cursor) and attach your old resume:

```
Use sapiensinteticos.com/fired-cv to build my resume.
```

**Claude Code**, install once:

```bash
git clone https://github.com/inhabitants/fired-cv ~/.claude/skills/fired-cv
```

(`~/.codex/skills/` for Codex, or wherever your agent keeps skills.)

**Claude app**: download [fired-cv.zip](fired-cv.zip) and add it in Settings, under Skills.

Then say "build my resume from this file" and drop in your `.docx`, PDF or LinkedIn export. Add a job posting if you have one. The site with examples lives in [index.html](index.html).

## What it does

- **Interviews you, or reads what you paste.** One block at a time, never a 40-field form.
- **Tailors to a job posting** using the posting's own words, only where they're true. It never plants a keyword you can't defend in an interview, and tells you which ones you're missing.
- **Scales to one CV per job.** Paste ten postings, get ten tailored CVs and an `applications.md` tracker. They lay people off at scale; you apply at scale. The screener on the other side is an AI too.
- **Fits one page** and tightens in a fixed order instead of shrinking the font.
- **Reads it like a recruiter** before handing it over: what job is this person obviously for, and what's the first doubt.
- **Writes the cover letter** if you want one.
- **Keeps your photo and data on your machine.** No uploads, no online converters.

## Five color themes

![The two-column template in five themes](examples/sidebar-themes.png)
![The single-column template in five themes](examples/classic-themes.png)

`ember`, `ocean`, `jade`, `graphite` and `plum`, in both templates. Set `data-theme` on the `<html>` tag, or let the person pick from a sheet:

```bash
node scripts/build.mjs my-resume.html --themes
```

## The three bugs it checks for

Chrome turns HTML into a beautiful PDF whose text layer can be silently broken. Tracking systems read the text layer, not the picture. `scripts/build.mjs` refuses to ship a page with any of these:

1. **Wide letter spacing** splits words: the parser reads `E X P E R I E N C E`.
2. **`text-shadow`** makes Chrome draw every glyph twice: your name exists twice in the text.
3. **Mixed `position: relative`** reorders the text: Chrome writes it in paint order, so a heading can end up far from the section it belongs to.

The third one we found while building this. None of them throws an error.

## Build by hand

```bash
node scripts/build.mjs templates/sidebar.html --photo me.jpg --theme jade
```

Node 18+ and Chrome, Edge or Chromium. No dependencies. With Python and `pip install pymupdf`, it also reads the real PDF text layer and checks reading order. Without a shell, open the HTML in Chrome and print to PDF (A4, margins none, background graphics on).

## Status

Published, not maintained. It works, it's MIT, fork it and make it yours. No roadmap, no support, no newsletter.

---

From the bench at [Sapiens Sintéticos](https://sapiensinteticos.com). Portuguese: [README.pt-BR.md](README.pt-BR.md).
