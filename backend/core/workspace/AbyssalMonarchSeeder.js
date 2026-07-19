const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");

class AbyssalMonarchSeeder {
  static async seed(projectManager, databaseManager, ownerId) {
    const projectName = "The Abyssal Monarch";

    // 1. Check if example project already exists
    const projects = await projectManager.listProjects(ownerId);
    const existing = projects.find(p => p.name === projectName);
    
    if (existing) {
      // Overwrite/recreate if seeding demo again
      await projectManager.deleteProject(projectName, ownerId);
    }

    console.log(`[AbyssalMonarchSeeder] Seeding rich demo novel: ${projectName}`);

    // Cover art SVG data URL
    const coverSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"><rect width="400" height="600" fill="%23070a13"/><path d="M 0,300 C 100,280 150,320 200,300 C 250,280 300,320 400,300 L 400,600 L 0,600 Z" fill="%238b5cf6" opacity="0.3"/><path d="M 0,350 C 80,330 120,370 200,350 C 280,330 320,370 400,350 L 400,600 L 0,600 Z" fill="%23f5c542" opacity="0.2"/><text x="200" y="220" font-family="'Georgia', serif" font-size="24" fill="%23f5c542" font-weight="bold" text-anchor="middle" letter-spacing="4">THE ABYSSAL</text><text x="200" y="270" font-family="'Georgia', serif" font-size="36" fill="%23ffffff" font-weight="bold" text-anchor="middle" letter-spacing="6">MONARCH</text><line x1="100" y1="310" x2="300" y2="310" stroke="%23f5c542" stroke-width="2"/><text x="200" y="480" font-family="sans-serif" font-size="12" fill="%2364748b" text-anchor="middle" letter-spacing="2">DEMO EDITION</text></svg>`;

    // 2. Create the project
    const project = await projectManager.createProject(
      projectName,
      "An epic dark fantasy novel following Monarch Lysander's struggle to control the unstable abyssal energy currents and suppress the rising Coral Guard rebellion.",
      120000,
      coverSvg,
      ownerId
    );
    const projectId = project.id;
    
    // Clean up default chapter/scene inserted by createProject to replace with our custom ones
    await databaseManager.run("DELETE FROM scenes WHERE project_id = $1", [projectId]);
    await databaseManager.run("DELETE FROM chapters WHERE project_id = $1", [projectId]);

    // 1. Seed 20 Characters
    const characters = [
      { name: "Monarch Lysander", role: "Protagonist / Abyssal Ruler", age: "Unknown", power: "Abyssal Authority", goal: "Surpass the ancient gods" },
      { name: "Princess Kora", role: "Heir to the Sea / Rebel Catalyst", age: "22", power: "Aether Whispering", goal: "Expose Lysander's secrets" },
      { name: "Sorcerer Triton", role: "Court Mage / Schemer", age: "98", power: "Tidal Siphoning", goal: "Claim the core for the Arcane Order" },
      { name: "Commander Nerida", role: "Captain of the Coral Guard", age: "34", power: "Sunsteel Bulwark", goal: "Protect the border colonies" },
      { name: "General Orpheus", role: "Grand Warlord", age: "61", power: "Tactical Shockwaves", goal: "Conquer the surface ports" },
      { name: "Sybil of the Deep", role: "Oracle of the Void", age: "500+", power: "Premonition Echoes", goal: "Ensure the ancient pact is fulfilled" },
      { name: "Sentry Marina", role: "Loyal Guardian", age: "26", power: "Trident Blitz", goal: "Avenge her fallen brother" },
      { name: "Scholar Poseidon", role: "Archivist of the Archives", age: "115", power: "Chronicle Recall", goal: "Translate the First Inscriptions" },
      { name: "Navigator Nereus", role: "Sub-current Pilot", age: "40", power: "Current Sensing", goal: "Map the unnavigable deep trenches" },
      { name: "Rebel Caspian", role: "Rebel Commander", age: "29", power: "Hydra Claws", goal: "Overthrow the Monarch's throne" },
      { name: "Oracle Delphine", role: "Mystic Guide", age: "72", power: "Bubble Divination", goal: "Maintain equilibrium in the reef" },
      { name: "Knight Muriel", role: "Elite Vanguard", age: "35", power: "Abyssal Shielding", goal: "Defend the Monarch at all costs" },
      { name: "Blacksmith Vulcan", role: "Weapons Forger", age: "55", power: "Volcanic Smelting", goal: "Forge the ultimate Void Blade" },
      { name: "Scout Ondine", role: "Wilderness Tracker", age: "24", power: "Camouflage Veil", goal: "Find the hidden sanctuary" },
      { name: "Healer Thalassa", role: "Court Physician", age: "45", power: "Chitin Restoration", goal: "Cure the elemental rot" },
      { name: "Inquisitor Drake", role: "Punisher of Heretics", age: "39", power: "Iron Will", goal: "Purge the rebel infiltrators" },
      { name: "Sovereign Oceanus", role: "Predecessor (Spirit)", age: "Deceased", power: "Original Authority", goal: "Guide his successor" },
      { name: "Spy Kelpie", role: "Shape-shifting Informant", age: "Unknown", power: "Vapor Mimicry", goal: "Sell information to the highest bidder" },
      { name: "Guardsman Coral", role: "Frontline Sentinel", age: "28", power: "Reef Regeneration", goal: "Hold the line at the trench" },
      { name: "Outcast Levi", role: "Hermit of the Core", age: "80", power: "Fathomless Sight", goal: "Warn the world of the awakening void" }
    ];

    const charMap = {};
    for (const char of characters) {
      const id = uuidv4();
      charMap[char.name] = id;
      await databaseManager.run(
        `INSERT INTO entities (id, project_id, type, title, summary, metadata) VALUES (?, ?, ?, ?, ?, ?)`,
        [id, projectId, "character", char.name, char.role, JSON.stringify({ age: char.age, power: char.power, goal: char.goal })]
      );
    }

    // 2. Seed 15 Locations
    const locations = [
      "The Obsidian Throne Room", "The Trench of Whispers", "Coral Citadel Walls", "The Abyssal Core Ruins", 
      "The Volcanic Forge", "Triton's Laboratory", "The Kelp Wilderness", "The Border Reefs", 
      "The Sunken Scriptorium", "Void Spire Outpost", "Marina's Sentry Barracks", "The Oracle's Cove", 
      "The Silent Abyss", "The Hydrothermal Vent Colonies", "The Fathomless Maw"
    ];
    for (const loc of locations) {
      await databaseManager.run(
        `INSERT INTO entities (id, project_id, type, title, summary) VALUES (?, ?, ?, ?, ?)`,
        [uuidv4(), projectId, "location", loc, `A prominent setting in the epic lore of The Abyssal Monarch.`]
      );
    }

    // 3. Seed 5 Factions
    const factions = [
      "The Abyssal Court", "The Sunken Rebellion", "The Coral Guard", "The Sages Council", "The Onyx Syndicate"
    ];
    for (const fac of factions) {
      await databaseManager.run(
        `INSERT INTO entities (id, project_id, type, title, summary) VALUES (?, ?, ?, ?, ?)`,
        [uuidv4(), projectId, "faction", fac, `An influential power block fighting for dominance under the waves.`]
      );
    }

    // 4. Seed 3 Chapters of ~1,000 words each of real fantasy prose, and 7 remaining empty chapters
    // Helper to generate long rich paragraphs
    const p1 = "The obsidian columns of the Abyssal Court rose into the dark waters like frozen leviathans, their edges glowing with the faint, cold blue light of runic inscriptions. Monarch Lysander stood before the towering throne of glass, his cape of woven kelp drifting around his ankles in the slow, heavy currents of the deep ocean. Above him, the ceiling was lost to the infinite blackness, save for the occasional pulse of bioluminescence from the siphonophores drifting like lanterns in the cold void. For three centuries, his family had held the deep core, their authority absolute, backed by the terrible power of the Abyssal Authority. But now, the water was growing warm, and the ancient stone was beginning to whisper. Lysander reached out, his gauntleted hand hovering inches from the central obsidian spire. A sharp spike of cold magic surged through his veins, making his heart pause before resuming its slow, steady beat. The pressure here was enough to crush a surface dweller into paste, yet to him, it was a familiar embrace. He closed his eyes, listening to the hum of the stone. The Core was waking up, and the seal was cracking.";
    const p2 = "Sorcerer Triton walked silently down the gallery of skulls, his robes of grey eel-skin trailing behind him. He looked up at the Monarch, his eyes pale and clouded, yet sharp with a dark intellect that had survived a dozen royal purges. 'The rebellion grows in the outer reefs, Sire,' Triton murmured, his voice sending ripples through the quiet water. 'The Coral Guard has refused to pay the tribute of shell-iron. They claim the Border Reefs are dying, that the warm vents are drying up because of the Core's resonance.' Lysander did not turn. 'Let them claim what they wish. The tribute must be paid. Without the shell-iron, the Blacksmith cannot fortify the deep spires. If the spires fall, the void will swallow us all. Triton, prepare the ritual. We must bind the core once more, even if it drains the energy of the outer colonies.' Triton bowed, a cold smile touching his thin lips. 'As you command, Monarch. The Sages will be pleased.'";
    const p3 = "In the eastern margins of the kingdom, the Kelp Wilderness stretched for leagues, a forest of giant golden stalks swaying in the deep tidal currents. Princess Kora swam through the upper canopy, her movements silent as a shadow. She carried a message tube of silvered bone, sealed with the wax of the deep-water snails. Below her, the patrol forces of the Coral Guard moved along the reef paths, their white sunsteel armor reflecting the dim sunlight filtering down from the surface world. Kora knew the danger. If Lysander's spies caught her, she would be cast into the Fathomless Maw, the bottomless trench from which no soul ever returned. But the rebellion could not wait. The warm vents were indeed dying, and the people of the outer reefs were beginning to starve. The Monarch cared only for his spires and his ancient authority. She descended into the shadows of the kelp, looking for the hidden cave of Caspian's rebels. The fight for the sea was about to begin.";
    const p4 = "The black water roared in Lysander's ears as he descended into the lower chambers of the spires. The ancient machinery of the creators, built from brass and copper that never tarnished, turned with a grinding hum that vibrated in the teeth. Here, the temperature was near boiling, heated by the hydrothermal vents that rose from the earth's mantle. Small red crabs scurried across the pipes, and white tube worms swayed in the chemical haze. The Monarch pulled his collar high, shielding his face from the stinging sulfur. He needed to find the forge. Blacksmith Vulcan stood before the volcanic hearth, his massive hammer raised. With each blow on the anvil of deep stone, sparks of red fire flew through the boiling water, instantly cooling into black grit. 'Monarch,' Vulcan grunted, wiping sweat and ash from his brow. 'The Void Blade is ready, but it lacks a core. It needs the blood of a royal to bind the steel.' Lysander looked at the sword. Its surface was carved with runes of power, humming with a dark force that made his skin itch. 'The sacrifice will be made,' Lysander said softly. 'Begin the final forge.'";
    const p5 = "Outside the citadel, the vanguard of the Sunken Rebellion gathered in the shadows of the trenches. Caspian checked the edge of his bone dagger, his eyes fixed on the glowing spires of the capital. Beside him, dozens of fighters waited, their skin painted with bioluminescent war marks. They had lived in the dark for too long, forgotten by the court, treated as nothing more than fuel for the Monarch's magic. 'Tonight,' Caspian whispered, 'we strike the border spires. We cut the power to the capital shields. When the lights go out, the Coral Guard will join us.' A murmur of agreement went through the ranks. Kora arrived, dropping from the kelp canopy. She handed the bone tube to Caspian. 'The seal is broken. The Monarch is forging the Void Blade. If he completes it, the Core will belong to him forever. We must move now.' Caspian nodded, raising his blade. 'For the deep reefs!' they cheered, their voices lost in the rushing tide.";

    const wordCount = 1000; // Each chapter will have 5 paragraphs of ~200 words each = ~1000 words.
    const mockProse = `${p1}\n\n${p2}\n\n${p3}\n\n${p4}\n\n${p5}`;

    const chaptersData = [
      { title: "Chapter 1: The Obsidian Throne", prose: mockProse, active: true },
      { title: "Chapter 2: Whispers in the Abyss", prose: mockProse, active: true },
      { title: "Chapter 3: The Tide of Rebellion", prose: mockProse, active: true },
      { title: "Chapter 4: The Volcanic Forge", prose: "", active: false },
      { title: "Chapter 5: The Seal of the Sages", prose: "", active: false },
      { title: "Chapter 6: First Blood on the Reef", prose: "", active: false },
      { title: "Chapter 7: The Fathomless Maw", prose: "", active: false },
      { title: "Chapter 8: The Void Blade Awakens", prose: "", active: false },
      { title: "Chapter 9: The Siege of the Capital", prose: "", active: false },
      { title: "Chapter 10: The Abyssal Coronation", prose: "", active: false }
    ];

    for (let i = 0; i < chaptersData.length; i++) {
      const ch = chaptersData[i];
      const chId = uuidv4();
      await databaseManager.run(
        `INSERT INTO chapters (id, project_id, title, order_index) VALUES (?, ?, ?, ?)`,
        [chId, projectId, ch.title, i + 1]
      );

      // Create a scene inside each chapter
      const scId = uuidv4();
      const content = ch.prose ? JSON.stringify({
        type: "doc",
        content: ch.prose.split("\n\n").map(para => ({
          type: "paragraph",
          content: [{ type: "text", text: para }]
        }))
      }) : JSON.stringify({
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: `Start drafting Chapter ${i + 1} scene here...` }] }]
      });

      await databaseManager.run(
        `INSERT INTO scenes (id, project_id, chapter_id, title, content, summary, order_index, pov_entity_id, purpose, conflict, outcome, word_count, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          scId,
          projectId,
          chId,
          `${ch.title} - Main Scene`,
          content,
          ch.prose ? "Key plot advancement scene containing rich prose details." : "Empty draft template.",
          1,
          i === 0 ? charMap["Monarch Lysander"] : i === 1 ? charMap["Princess Kora"] : charMap["Rebel Caspian"],
          "Establish key character arcs and world conflicts.",
          "Political tension and structural energy depletion.",
          "Deeper mysteries are revealed, raising the stakes.",
          ch.prose ? wordCount : 5,
          ch.prose ? "polished" : "draft"
        ]
      );
    }

    // 5. Seed Timeline Events
    const timelineEvents = [
      { title: "The Great Shattering", date: "0100-01-01", desc: "The cosmic cataclysm that shattered the original Aether Core, dispersing fragments across the deep seabed." },
      { title: "The Treaty of Coral", date: "0210-06-15", desc: "Monarch Lysander's predecessor signs the border treaty with the outer reef clans, establishing a fragile truce." },
      { title: "The Warm Current Failure", date: "0345-09-02", desc: "The geothermal vents in the northern reef suddenly shut down, triggering widespread harvest failures and rebellion." },
      { title: "The Night of Iron Clashes", date: "0359-11-20", desc: "Caspian's rebel forces launch a coordinated raid on the outermost shell-iron outpost, declaring war on the court." }
    ];
    for (const event of timelineEvents) {
      await databaseManager.run(
        `INSERT INTO timeline_events (id, project_id, title, description, chronological_date) VALUES (?, ?, ?, ?, ?)`,
        [uuidv4(), projectId, event.title, event.desc, event.date]
      );
    }

    // 6. Seed Story Bible Category Cards (Magic Rules)
    const bibleCards = [
      { category: "rules", title: "Abyssal Magic System", content: "Abyssal magic operates through resonance with the planet's mantle currents. Magic users channel these thermal-magnetic lines using shell-iron focuses. Unregulated channeling leads to 'elemental rot', freezing the body into dead coral." },
      { category: "rules", title: "The Deep Pact of Sages", content: "A treaty signed by the five founding sages declaring the central Abyssal Core a neutral zone. Any attempts to seal or lock the core triggers a magical cataclysm." },
      { category: "rules", title: "Coral Guard Codices", content: "The laws governing the elite sentinel corps. Sentinel knights carry sunsteel tower shields charged with thermal cells, and are sworn to defend the outer colonies before the Monarch." }
    ];
    for (const card of bibleCards) {
      await databaseManager.run(
        `INSERT INTO story_bible (id, project_id, category, title, content) VALUES (?, ?, ?, ?, ?)`,
        [uuidv4(), projectId, card.category, card.title, card.content]
      );
    }

    // 7. Preload exports directory with mock compiled file output so it looks fully complete
    const mockExportContent = `# THE ABYSSAL MONARCH\n\n## Chapter 1: The Obsidian Throne\n\n${p1}\n\n${p2}\n\n## Chapter 2: Whispers in the Abyss\n\n${p3}\n\n## Chapter 3: The Tide of Rebellion\n\n${p4}\n\n${p5}`;
    fs.writeFileSync(path.join(projectDir, "exports", "The_Abyssal_Monarch_Draft.txt"), mockExportContent, "utf8");

    console.log(`[AbyssalMonarchSeeder] Demo novel seeded successfully.`);
    return await projectManager.loadProject(projectName, ownerId);
  }
}

module.exports = AbyssalMonarchSeeder;
