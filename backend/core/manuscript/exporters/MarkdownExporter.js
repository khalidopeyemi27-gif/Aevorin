const fs = require("fs");
const IExporter = require("../../../contracts/IExporter");

/**
 * MarkdownExporter class.
 * Compiles manuscript draft to plain Markdown document.
 */
class MarkdownExporter extends IExporter {
  name() {
    return "Markdown Plaintext";
  }

  extension() {
    return ".md";
  }

  async compile(project, scenes, destinationPath) {
    let content = `# ${project.name}\n\n`;

    // Sort scenes by order index
    const sorted = [...scenes].sort((a, b) => a.order_index - b.order_index);

    for (const scene of sorted) {
      content += `### ${scene.title}\n\n`;
      let text = "";
      if (scene.content) {
        try {
          const parsed = JSON.parse(scene.content);
          text = this.parseTipTapToMarkdown(parsed);
        } catch (e) {
          text = scene.content;
        }
      }
      content += `${text}\n\n---\n\n`;
    }

    fs.writeFileSync(destinationPath, content, "utf8");
    return true;
  }

  parseTipTapToMarkdown(doc) {
    if (!doc || !Array.isArray(doc.content)) return "";
    let markdown = "";
    for (const node of doc.content) {
      if (node.type === "paragraph" && Array.isArray(node.content)) {
        let para = "";
        for (const child of node.content) {
          if (child.type === "text" && child.text) para += child.text;
        }
        markdown += `${para}\n\n`;
      } else if (node.type === "heading" && Array.isArray(node.content)) {
        let headingText = "";
        for (const child of node.content) {
          if (child.type === "text" && child.text) headingText += child.text;
        }
        const lvl = node.attrs?.level || 1;
        markdown += `${"#".repeat(lvl)} ${headingText}\n\n`;
      }
    }
    return markdown;
  }
}

module.exports = MarkdownExporter;
