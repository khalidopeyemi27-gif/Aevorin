const fs = require("fs");
const IExporter = require("../../../contracts/IExporter");

/**
 * PdfExporter class.
 * Compiles manuscript draft to print-ready HTML page configured for PDF creation.
 */
class PdfExporter extends IExporter {
  name() {
    return "Print-ready PDF / HTML";
  }

  extension() {
    return ".html";
  }

  async compile(project, scenes, destinationPath) {
    const totalWordCount = scenes.reduce((acc, sc) => acc + (sc.word_count || sc.wordCount || 0), 0);
    const authorName = project.authorName || "Author Name";
    const year = new Date().getFullYear();

    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${project.name}</title>
  <style>
    @page {
      size: A4;
      margin: 1in;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      line-height: 1.6;
      color: #000000;
      margin: 0;
      padding: 0;
      font-size: 12pt;
    }
    .title-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      height: 100vh;
      page-break-after: always;
    }
    .title-wrapper {
      margin-top: 30vh;
      margin-bottom: auto;
    }
    .book-title {
      font-size: 32pt;
      margin-bottom: 24pt;
      text-transform: uppercase;
      letter-spacing: 2px;
      page-break-after: avoid;
    }
    .book-subtitle {
      font-size: 16pt;
      margin-bottom: 48pt;
      font-style: italic;
    }
    .book-author {
      font-size: 18pt;
    }
    .title-meta {
      margin-bottom: 10vh;
      font-size: 11pt;
      color: #444;
    }
    h1.chapter-title {
      text-align: center;
      margin-top: 2in;
      font-size: 28pt;
      page-break-before: always;
      page-break-after: avoid;
    }
    h2.scene-title {
      font-size: 18pt;
      margin-top: 24pt;
      text-align: center;
      page-break-after: avoid;
    }
    p {
      margin-bottom: 12pt;
      text-indent: 0.5in;
      text-align: justify;
    }
    .scene-divider {
      text-align: center;
      margin: 24pt 0;
      font-size: 16pt;
      letter-spacing: 4px;
    }
    @media print {
      body {
        width: 100%;
        margin: 0;
      }
    }
  </style>
</head>
<body>
  <div class="title-page">
    <div class="title-wrapper">
      <h1 class="book-title">${project.name}</h1>
      <p class="book-subtitle">A Novel</p>
      <p class="book-author">by<br/>${authorName}</p>
    </div>
    <div class="title-meta">
      <p>Word Count:<br/>${totalWordCount.toLocaleString()}</p>
      <p>Created:<br/>${year}</p>
    </div>
  </div>
`;

    const sorted = [...scenes].sort((a, b) => a.order_index - b.order_index);

    let lastChapterId = null;

    for (let i = 0; i < sorted.length; i++) {
      const scene = sorted[i];
      
      // If chapter changed, print Chapter Title
      if (scene.chapter_id !== lastChapterId) {
        html += `  <h1 class="chapter-title">Chapter</h1>\n`;
        lastChapterId = scene.chapter_id;
      } else if (i > 0) {
        // Not the first scene in chapter, print divider
        html += `  <div class="scene-divider">* * *</div>\n`;
      }

      html += `  <h2 class="scene-title">${scene.title}</h2>\n`;
      let text = "";
      if (scene.content) {
        try {
          const parsed = JSON.parse(scene.content);
          text = this.parseTipTapToHtml(parsed);
        } catch (e) {
          text = scene.content;
        }
      }
      html += `  <div>${text}</div>\n`;
    }

    html += `</body>\n</html>`;
    fs.writeFileSync(destinationPath, html, "utf8");
    return true;
  }

  parseTipTapToHtml(doc) {
    if (!doc || !Array.isArray(doc.content)) return "";
    let html = "";
    for (const node of doc.content) {
      if (node.type === "paragraph" && Array.isArray(node.content)) {
        let paraText = "";
        for (const child of node.content) {
          if (child.type === "text" && child.text) {
            let chunk = child.text;
            if (child.marks) {
              for (const mark of child.marks) {
                if (mark.type === "bold") chunk = `<strong>${chunk}</strong>`;
                if (mark.type === "italic") chunk = `<em>${chunk}</em>`;
                if (mark.type === "strike") chunk = `<s>${chunk}</s>`;
              }
            }
            paraText += chunk;
          }
        }
        html += `<p>${paraText || "&nbsp;"}</p>\n`;
      } else if (node.type === "heading" && Array.isArray(node.content)) {
        let headingText = "";
        for (const child of node.content) {
          if (child.type === "text" && child.text) headingText += child.text;
        }
        const level = node.attrs?.level || 1;
        html += `<h${level}>${headingText}</h${level}>\n`;
      }
    }
    return html;
  }
}

module.exports = PdfExporter;
