---
name: fired-cv
description: Build a one-page, parser-proof resume (and an optional cover letter) as a print-ready A4 PDF, from an old Word/PDF CV, a LinkedIn export or an interview, tailored to one job posting or to many at once (one CV per job, with a tracker). Use when someone asks for a resume, CV, curriculum vitae, "update my CV", "tailor my resume to this job", "one CV for each of these jobs", "make my resume look good", or has just lost a job and needs to start applying.
license: MIT
---

# fired.cv

Fired by AI. CV by AI. A resume skill that exists because someone lost years of work to an AI model, and the fair thing was to make the model help land the next job. Treat the person that way: they may be having a bad month. Be fast, be warm, don't be syrupy, and never waste their energy on questions you could have answered yourself.

Talk to the person in their language. Write the resume in the language of the job they want.

## What you deliver

1. **One A4 page.** Not two. Not "one and a bit".
2. **A PDF text layer a machine reads correctly.** Applicant tracking systems read the text layer, not the picture. It must come out whole words, no duplicates, in reading order.
3. **Nothing invented.** You sharpen wording. You never create an employer, title, date, degree, certification or number.
4. **Private by default.** The photo and the personal data stay on the person's machine. No image hosts, no online PDF converters, no third-party upload of any kind.

## Files next to this one

```
SKILL.md                  this file
templates/sidebar.html    two columns, colored sidebar, optional photo
templates/classic.html    one column, no photo, safest for tracking systems
scripts/build.mjs         HTML -> PDF + PNG, with the checks below (Node 18+, Chrome/Edge/Chromium)
scripts/extract.mjs       old resume (.docx, .odt, .pdf, .txt) -> plain text
examples/                 rendered samples of a fictional person (AI-generated photo), repo only
```

If you loaded this file from a URL, fetch the others from the same base URL (replace `SKILL.md` with `templates/sidebar.html`, and so on). If you can't fetch them, write the page yourself following the rules in step 5.

---

## Step 1. Intake: pick the door that costs the person less

**Door A, a file or a paste.** Their old resume as a Word file (`.docx`), a PDF, an `.odt`, a LinkedIn export (LinkedIn: profile, More, Save to PDF), or loose pasted text. Read files with your own file reader when you have one. When you don't and you have a shell: `node scripts/extract.mjs old-resume.docx` prints the text (it also reads `.odt`, and `.pdf` when Python + PyMuPDF are installed; an old binary `.doc` has to be saved as `.docx` first). Word templates often hide the phone and email in the page header, and the script prints those first. Extract everything, then show a compact summary (roles with dates, education, languages) and ask only about what is missing or ambiguous.

**Door B, interview.** One block per message, never the whole form at once:

1. Name, the job title they want next, city and country.
2. Contact: phone with country code, email, LinkedIn or portfolio.
3. Each role, most recent first: title, company, start and end month, what they did, what changed because they were there. Ask "any number you remember: volume, team size, time saved, growth?" once per role. If they have none, move on.
4. Education, then certifications or courses worth showing.
5. Languages with an honest level; tools and hard skills.

**Ask these in both doors, all in one message:**

- Target role and country or market.
- A job posting link or text, if they have one (turns on step 4).
- Work authorization, availability, relocation: anything a recruiter would otherwise wonder about.
- Photo: yes or no (answer for them with the table in step 2 if they don't care).

**If they were laid off:** the resume does not explain it. The end date is the real month. The story belongs in the cover letter or the interview, in one neutral sentence ("my role was eliminated in a restructuring"). A short gap needs nothing; a long one can carry one honest line (course, freelance, caregiving) if it is true.

## Step 2. Pick the template

| Situation | Template | Photo |
|---|---|---|
| US, UK, Canada, Ireland, Australia, New Zealand | `classic` | no, it can get the resume discarded |
| Applying through a big portal (Workday, Taleo, iCIMS, SuccessFactors, Greenhouse, Lever) | `classic` | no |
| Brazil, Portugal, Spain, Italy, Germany, Latin America, much of Asia | `sidebar` | optional, only a good one |
| Creative, communication, marketing or design role applied by email or LinkedIn | `sidebar` | optional |
| Not sure | `classic` | no |

A bad photo is worse than none. Without a photo, `sidebar` shows the initials in a circle, which looks intentional.

## Step 3. Write

Work from the target job backwards: every line should make that job more obviously theirs.

**Header.** Name. The target title (the posting's wording when it honestly describes them). City and country, never the full address. Phone with country code, email, one link. No birth date, marital status, ID numbers or nationality unless the market or the person requires it.

**Highlight box.** Work authorization, availability, relocation. Only if it removes a doubt. Otherwise delete it.

**Summary, 3 to 4 lines.** Who they are (title, years, domain), the strongest proof (one concrete result), what they want next. Banned, because they claim instead of show: passionate, results-driven, team player, hard-working, dynamic, proactive, detail-oriented, go-getter, synergy, "proven track record".

**Experience.** Reverse chronological.

- Most recent or most relevant role: 3 to 5 bullets. Older roles: 1 to 2. Past 15 years: one line each, or grouped as "Earlier roles".
- Bullet formula: **verb + what + scale or result.** "Moved review from email threads to a shared tracker, cutting approval from 9 to 4 days."
- When a role has 3 or more bullets, start each with a bold label naming the skill area (`<b>Localization:</b>`). Recruiters skim labels.
- A number only if the person gave it. A bullet without a number is fine; a made-up number is a lie they will have to defend in an interview.
- Duties ("responsible for") become outcomes ("kept", "cut", "grew", "shipped", "resolved").

**Skills.** 2 to 4 groups of 3 to 6 items, hard skills and tools. Soft skills are shown in the bullets, not listed.

**Languages.** Honest levels (CEFR such as C1 if they know it). Bar widths in `sidebar`: native 100, fluent about 85, intermediate about 55, basic about 30.

**Education.** Degree, school, years. Grades only for recent graduates with strong ones.

**Optional sections** only if they earn the space: certifications, projects, publications, volunteer work.

## Step 4. Tailor to a job posting (only when one was given)

1. Pull out the must-haves, the nice-to-haves, and the 8 to 12 keywords in the posting's exact wording.
2. Map each keyword to real evidence in the person's history.
   - **True:** use the posting's exact words. Tracking systems match strings, so "stakeholder management" beats "working with stakeholders".
   - **Not true:** leave it out. Never plant a keyword the person can't defend in an interview.
3. Reorder bullets so the matching ones come first. Put the posting's title in the header if it honestly fits.
4. Cut whatever doesn't serve this job. That space is the budget for what does.
5. Report back in two short lists: keywords covered, keywords missing. Missing ones are for the cover letter, or for the person to learn.

## Step 4b. One CV per job (when they give you several postings)

Layoffs happen by the thousand, and the screening on the other side is increasingly an AI model reading the text layer. So answer at the same scale: one tailored CV per posting. Scale is where the no-invention rule matters most, because a lie repeated fifty times is fifty interviews to defend.

1. **Build the master first.** Steps 1 to 3 once, reviewed with the person. Every tailored version is cut from the master; nothing appears in a version that isn't in the master.
2. **Read every posting.** Links, pasted text or files. If you can't open a link, ask for the text instead of guessing from the job title. Skip postings that are clearly out of reach (a hard requirement the person doesn't meet) and say so in the tracker rather than forcing a version.
3. **One file per posting**, from the same template and theme: `Firstname_Lastname_CV_Company.html`, rendered to PDF. Per version, change only what step 4 allows: title line, summary, bullet order, which true keywords are worded the posting's way, what gets cut for space.
4. **Build and check each one** (`node scripts/build.mjs <file>` per file, or a shell loop over the folder). A version that fails a check is fixed before it is listed.
5. **Write `applications.md` next to the files**, one row per posting:

   | Company | Role | Link | Keywords covered | Missing | File | Status |
   |---|---|---|---|---|---|---|

   Status starts as `ready` (or `skipped: reason`). The person updates it as they apply.
6. **Report in three lines:** how many versions, the strongest matches, and the missing keywords that repeat across postings (those are the ones worth learning or addressing in cover letters).

Cover letters in batch: only when asked, one per posting, same rules as step 8.

## Step 5. Fill the template and render

**Fill.** Copy the template to a new file named like `Firstname_Lastname_Resume.html` (`CV` instead of `Resume` in markets that say CV). Replace the example person completely. Before rendering, search the file for `example`, `Sofia`, `Marques`, `Halden`, `Larkspur`, `Corvo`, `Atlas`: zero hits allowed. Escape `&` as `&amp;` and `<` `>` as `&lt;` `&gt;`. Set `<html lang>` and translate the section titles when the resume isn't in English.

**Color theme.** Both templates ship the same five themes, set on the root tag: `<html data-theme="jade">`.

| Theme | Look | Fits |
|---|---|---|
| `ocean` | blue | anything; tech, operations, public sector |
| `jade` | green | health, education, sustainability, finance |
| `graphite` | charcoal (sidebar) with bronze | legal, consulting, senior and executive roles |
| `ember` | orange | creative, marketing, communication |
| `plum` | wine | fashion, beauty, hospitality, culture |

If the person cares about looks, run `node scripts/build.mjs <file> --themes` and show them the side-by-side sheet it writes (`<name>-themes.png`); then set their pick in `data-theme`. A theme is only a block of CSS tokens: add one by copying a block and changing the values, keeping white text readable on the sidebar.

**Photo (sidebar only).** With a shell, pass `--photo`. Without one, replace `<div class="monogram">..</div>` with `<img class="photo" src="data:image/jpeg;base64,..." alt="">`. If the face is cut, adjust `object-position` (`center 12%` moves the frame up, `center 35%` down).

**Render with what you have:**

| You have | Do |
|---|---|
| Shell, Node 18+, and Chrome, Edge or Chromium | `node scripts/build.mjs Firstname_Lastname_Resume.html` (add `--photo photo.jpg`; `--theme jade` to try a color without editing, which suffixes the file name). It writes the PDF and a PNG preview, runs the checks, and exits non-zero when one fails. |
| The above plus Python with PyMuPDF (`pip install pymupdf`) | Same command. The checks now read the real PDF text layer too. |
| File writing, no shell | Write the `.html` and tell the person: open it in Chrome or Edge, Ctrl+P (Cmd+P on Mac), Destination "Save as PDF", Paper A4, Margins "None", Background graphics on. |
| Chat only, no files | Output the full HTML in one code block with the same print instructions. |

**If you write the page from scratch** instead of using a template, keep these, because each one breaks the PDF with no error message:

1. **Letter spacing at or under 0.1em of the font size.** Wider spacing splits words letter by letter in the text layer: a parser reads `E X P E R I E N C E`.
2. **No `text-shadow` on text.** Chrome draws the glyphs twice, so every word exists twice in the text layer. Shadows go on boxes.
3. **Uniform positioning.** Chrome writes the PDF text in paint order, and `position: relative` boxes paint after static ones. Position some blocks and not their siblings, and headings land far from their content in the text layer. Draw bullets as background dots instead of positioned `::before`, or position every sibling.
4. `@page { size: A4; margin: 0 }`, `print-color-adjust: exact`, page `min-height: 297mm` (never a fixed height with `overflow: hidden`, which hides the overflow instead of letting it show up as page 2).
5. Body text at 2.7mm (about 7.7pt) or larger.

## Step 6. Verify

- **Exactly one page.** Two pages: tighten in this order, rebuilding after each: bullet `line-height`, gap between jobs, top padding, cut the weakest bullet, merge the oldest roles. Never shrink body text below 2.7mm.
- **Page too empty** (content ends before about 70% of the height): add the next strongest true bullet or an optional section. Don't inflate the font.
- **Look at the PNG** if you can see images: a line with one orphan word, a date pill wrapping, an empty block, leftover example text.
- **The build checks passed** (letter spacing, text-shadow, reading order, page count), or, without a shell, you followed step 5's list by hand.

## Step 7. The six-second read

Recruiters decide in seconds. Before delivering, read only the name, the title line, the top third, the first bullet of each role and the dates. Answer in three lines:

1. What job is this person obviously for?
2. What is the strongest proof visible without reading closely?
3. What is the first doubt a recruiter would have (gap, short stints, career change, mismatch with the posting), and does the page answer it?

If line 1 isn't the target job, go back to step 3. Show these three lines to the person with the file.

## Step 8. Cover letter (when asked, or when tailoring)

At most 250 words, three paragraphs:

1. The role, and one specific reason for this company taken from the posting or their public material. Never invented.
2. Two proofs mapped to their top two must-haves.
3. Availability and a plain ask for a conversation. If there was a layoff and it needs mentioning, one neutral sentence here.

Never open with "I am writing to apply". For a PDF, reuse `classic.html`: keep the header, replace the sections with the letter. For a form field or email, plain text.

## Deliver

- The file paths (PDF, PNG, HTML) or the HTML block.
- The six-second read, in three lines.
- Keywords covered and missing, if you tailored.
- One next step, at most one question.

---

From the bench at Sapiens Sintéticos (sapiensinteticos.com). MIT licensed.
