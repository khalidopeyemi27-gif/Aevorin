const fs = require("fs");
const path = require("path");
const IExporter = require("../../../contracts/IExporter");

/**
 * EpubExporter class.
 * Compiles manuscript draft into a structured, standard EPUB book directory.
 */
class EpubExporter extends IExporter {
  name() {
    return "EPUB unzipped eBook folder";
  }

  extension() {
    return "_epub"; // Generates folder name
  }

  async compile(project, scenes, destinationPath) {
    // destinationPath will end in '_epub'
    const epubDir = destinationPath;
    if (!fs.existsSync(epubDir)) {
      fs.mkdirSync(epubDir, { recursive: true });
    }

    const oebpsDir = path.join(epubDir, "OEBPS");
    const metaInfDir = path.join(epubDir, "META-INF");
    const chaptersDir = path.join(oebpsDir, "chapters");

    fs.mkdirSync(oebpsDir, { recursive: true });
    fs.mkdirSync(metaInfDir, { recursive: true });
    fs.mkdirSync(chaptersDir, { recursive: true });

    // 1. Write mimetype file
    fs.writeFileSync(path.join(epubDir, "mimetype"), "application/epub+zip", "utf8");

    // 2. Write META-INF/container.xml
    const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
    fs.writeFileSync(path.join(metaInfDir, "container.xml"), containerXml, "utf8");

    // 3. Compile scenes into XHTML files
    const sorted = [...scenes].sort((a, b) => a.order_index - b.order_index);
    const manifests = [];
    const spines = [];
    const navs = [];

    for (let i = 0; i < sorted.length; i++) {
      const scene = sorted[i];
      const fileName = `scene_${i + 1}.xhtml`;
      const id = `scene_${i + 1}`;
      
      let text = "";
      if (scene.content) {
        try {
          const parsed = JSON.parse(scene.content);
          text = this.parseTipTapToHtml(parsed);
        } catch (e) {
          text = scene.content;
        }
      }

      const chapterXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${scene.title}</title>
</head>
<body>
  <h2>${scene.title}</h2>
  <div>${text}</div>
</body>
</html>`;

      fs.writeFileSync(path.join(chaptersDir, fileName), chapterXml, "utf8");
      
      manifests.push(`    <item id="${id}" href="chapters/${fileName}" media-type="application/xhtml+xml"/>`);
      spines.push(`    <itemref idref="${id}"/>`);
      navs.push(`    <navPoint id="navPoint-${i + 1}" playOrder="${i + 1}">
      <navLabel>
        <text>${scene.title}</text>
      </navLabel>
      <content src="chapters/${fileName}"/>
    </navPoint>`);
    }

    // 4. Write OEBPS/content.opf Manifest
    const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookID" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>${project.name}</dc:title>
    <dc:language>en</dc:language>
    <dc:identifier id="BookID">urn:uuid:${project.id || "12345"}</dc:identifier>
    <dc:creator>AEVORIN Exporter</dc:creator>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
${manifests.join("\n")}
  </manifest>
  <spine toc="ncx">
${spines.join("\n")}
  </spine>
</package>`;
    fs.writeFileSync(path.join(oebpsDir, "content.opf"), contentOpf, "utf8");

    // 5. Write OEBPS/toc.ncx Table of Contents
    const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:${project.id || "12345"}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${project.name}</text>
  </docTitle>
  <navMap>
${navs.join("\n")}
  </navMap>
</ncx>`;
    fs.writeFileSync(path.join(oebpsDir, "toc.ncx"), tocNcx, "utf8");

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

module.exports = EpubExporter;
