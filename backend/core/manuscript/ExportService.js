const path = require("path");
const EventTypes = require("../infrastructure/events/EventTypes");

// Import concrete exporters
const MarkdownExporter = require("./exporters/MarkdownExporter");
const DocxExporter = require("./exporters/DocxExporter");
const PdfExporter = require("./exporters/PdfExporter");
const EpubExporter = require("./exporters/EpubExporter");

/**
 * ExportService class.
 * Service coordinating manuscript compilation via pluggable IExporter adapters.
 */
class ExportService {
  constructor(chapterRepository, sceneRepository, projectManager, eventBus) {
    this.chapterRepository = chapterRepository;
    this.sceneRepository = sceneRepository;
    this.projectManager = projectManager;
    this.eventBus = eventBus;

    // Registers modular compilers implementing IExporter
    this.exporters = {
      markdown: new MarkdownExporter(),
      docx: new DocxExporter(),
      pdf: new PdfExporter(),
      epub: new EpubExporter()
    };
  }

  /**
   * Compiles the manuscript scenes into a structured output document.
   * @param {string} projectId - Project identifier.
   * @param {string} format - Target format key ('markdown', 'docx', 'pdf', 'epub').
   * @returns {Promise<object>} Compilation results.
   */
  async exportManuscript(projectId, format = "markdown") {
    if (projectId !== this.projectManager.activeProjectId) {
      throw new Error("Project is not loaded as the active project");
    }

    const exporter = this.exporters[format.toLowerCase()];
    if (!exporter) {
      throw new Error(`Unsupported export format format key: ${format}`);
    }

    const projectName = this.projectManager.activeProjectName;
    const projectPath = this.projectManager.activeProjectPath;

    this.eventBus.publish(EventTypes.EXPORT_STARTED, {
      projectId,
      format
    });

    // Fetch project metadata & scenes
    const projectMeta = {
      id: projectId,
      name: projectName,
      path: projectPath
    };
    const scenes = await this.sceneRepository.findAllByProject(projectId);

    // Build destination output path
    const extension = exporter.extension();
    const fileName = `${projectName}_Compile${extension}`;
    const destinationPath = path.join(projectPath, "exports", fileName);

    // Run compile sequence
    await exporter.compile(projectMeta, scenes, destinationPath);

    this.eventBus.publish(EventTypes.EXPORT_FINISHED, {
      projectId,
      format,
      path: destinationPath
    });

    return {
      success: true,
      format,
      path: destinationPath,
      fileName
    };
  }
}

module.exports = ExportService;
