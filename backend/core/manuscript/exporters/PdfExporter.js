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
    h1 {
      text-align: center;
      margin-top: 2in;
      font-size: 28pt;
      page-break-after: always;
    }
    h2 {
      font-size: 18pt;
      margin-top: 24pt;
      page-break-before: always;
      text-align: center;
    }
    h3 {
      font-size: 13pt;
      margin-top: 18pt;
      color: #222;
    }
    p {
      margin-bottom: 12pt;
      text-indent: 0.5in;
      text-align: justify;
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
  <h1>${project.name}</h1>
`;

    const sorted = [...scenes].sort((a, b) => a.order_index - b.order_index);

    for (const scene of sorted) {
      html += `  <h2>${scene.title}</h2>\n`;
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
