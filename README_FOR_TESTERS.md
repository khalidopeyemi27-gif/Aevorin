# AEVORIN Private Alpha — Author Guide & Release Notes

Welcome to the private alpha of **AEVORIN**, the professional operating system for authors. AEVORIN is designed as a local-first, offline-first workspace that puts you in complete control of your creative manuscripts, story worlds, and metadata.

---

## 1. Quick Start Instructions

To run AEVORIN without managing developer commands:

1. **Prerequisite**: Ensure you have **Node.js** installed on your system. If not, download and install it from [nodejs.org](https://nodejs.org/).
2. **Launch**: Double-click `AEVORIN.bat` (or right-click `AEVORIN.ps1` and select *Run with PowerShell*).
3. **Write**: The launcher will initialize the backend writing engine, spin up the local interface, and automatically open your default browser to:
   `http://localhost:5180`
4. **Shutdown**: To close the application and release the SQLite databases safely, return to the launcher command window and press any key.

---

## 2. What this Alpha Supports

This release focuses on hardening the fundamental writing experience:

* **Draft Editor**: A clean, distraction-free environment utilizing TipTap for rich text editing, with debounced autosaving, a word goal tracker, and Focus Mode.
* **Story Outlines (Corkboard)**: Reorder and tag scenes independently of chapters. Set scene POV, purpose, conflict, and outcome status.
* **Story Bible & Wiki**: Create character profiles, location settings, and cross-reference details.
* **Timeline Planner**: Log chronological events and link them to draft scenes.
* **Version History & Recovery**: Keystroke-level local browser draft cache recovery in case of system crashes or accidental window closing.
* **Snapshots (Backups)**: Create local SQLite database backups on-demand, and restore to historical snapshots with validation warning messages.
* **Manuscript Compiler**: Package your entire story sequentially into **Markdown**, **HTML eBook**, or **true DOCX** formats.

---

## 3. Known Limitations

As a pre-release version, please keep the following limitations in mind:
- **No AI Assistant**: While AEVORIN v2.0 is designed to support offline LLMs and assistants, the AI module is completely disabled in v1.0 to ensure a pure writing foundation first.
- **Offline Only**: There is no cloud sync, login accounts, or online collaboration features. All data is saved inside your local `user_data/projects` directory.
- **Vite CLI Window**: During startup, terminal windows will remain minimized. Do not close these windows while writing, or AEVORIN will disconnect.

---

## 4. Submitting Survey & Diagnostics

Your feedback is critical to preparing the Beta release. 
To share feedback:

1. Go to the **Help & Feedback** tab inside your loaded project workspace.
2. Click **Open Tester Survey** to complete our short feedback questionnaire.
3. Submit bug reports or suggestions directly through the **Report Feedback & Issues** form.
4. Download a privacy-safe JSON diagnostics file using the **Export Diagnostics Log** button. Send this file to the developers to report errors or schema issues (it contains environment logs and counts, but **never** exposes your manuscript draft texts).

*Thank you for helping us build the ultimate author workspace!*
