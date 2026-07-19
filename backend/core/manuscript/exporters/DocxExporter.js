const fs = require("fs");
const IExporter = require("../../../contracts/IExporter");

/**
 * DocxExporter class.
 * Compiles manuscript draft using Word-compliant Office HTML markups.
 */
class DocxExporter extends IExporter {
  name() {
    return "Microsoft Word Doc";
  }

  extension() {
    return ".doc";
  }

  async compile(project, scenes, destinationPath) {
    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <title>${project.name}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    p { margin-bottom: 12pt; text-indent: 0.5in; line-height: 150%; font-family: 'Times New Roman', serif; font-size: 12pt; }
    h1 { font-family: Arial, sans-serif; font-size: 24pt; text-align: center; margin-bottom: 24pt; }
    h2 { font-family: Arial, sans-serif; font-size: 18pt; margin-top: 24pt; page-break-before: always; }
    h3 { font-family: Arial, sans-serif; font-size: 14pt; margin-top: 18pt; color: #333333; }
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

module.exports = DocxExporter;
