const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

/**
 * ProjectSeeder class.
 * Seeds a professional sample fantasy novel workspace for user onboarding.
 */
class ProjectSeeder {
  static async seedExample(projectManager, databaseManager, ownerId) {
    const projectName = "The Forgotten Kingdom";
    
    // 1. Check if example project already exists
    const projects = await projectManager.listProjects(ownerId);
    const existing = projects.find(p => p.name === projectName);
    
    if (existing) {
      // Load and return existing project to prevent duplicate folders
      return await projectManager.loadProject(projectName, ownerId);
    }

    // 2. Create the project
    const project = await projectManager.createProject(
      projectName,
      "A sample worldbuilding and novel writing workspace detailing the ancient secrets of Aetheria.",
      80000,
      null,
      ownerId
    );
    const projectId = project.id;

    // 3. Seed Characters Entities
    const characters = [
      {
        id: uuidv4(),
        type: "character",
        title: "King Alistair",
        summary: "The weary monarch of Aetheria struggling to hold the crown.",
        metadata: JSON.stringify({ age: 58, role: "King of Aetheria", faction: "The Dawn Guard" })
      },
      {
        id: uuidv4(),
        type: "character",
        title: "Elara the Mage",
        summary: "High Sorceress of the Aether Shards studying forbidden light.",
        metadata: JSON.stringify({ age: 24, magic_level: "Arch-Mage", specialty: "Aether manipulation" })
      },
      {
        id: uuidv4(),
        type: "character",
        title: "Kaelen the Scout",
        summary: "Elite pathfinder and spy tracking shadow forces.",
        metadata: JSON.stringify({ age: 29, skills: "Archery, Stealth, Tracking" })
      },
      {
        id: uuidv4(),
        type: "character",
        title: "Commander Vael",
        summary: "Leader of the Dawn Guard bound by ancient knightly oaths.",
        metadata: JSON.stringify({ age: 42, weapon: "Sunsteel Broadsword" })
      },
      {
        id: uuidv4(),
        type: "character",
        title: "Lyra of the Wilds",
        summary: "Mysterious huntress aligned with the beasts of the Whispering Wood.",
        metadata: JSON.stringify({ age: 21, origin: "The Whispering Woods" })
      }
    ];

    for (const char of characters) {
      await databaseManager.run(
        `INSERT INTO entities (id, project_id, type, title, summary, metadata) VALUES (?, ?, ?, ?, ?, ?)`,
        [char.id, projectId, char.type, char.title, char.summary, char.metadata]
      );
    }

    // 4. Seed Chapters
    const chaptersData = [
      { id: uuidv4(), title: "Chapter 1: The Shattered Gate", order_index: 1 },
      { id: uuidv4(), title: "Chapter 2: Shards of Power", order_index: 2 },
      { id: uuidv4(), title: "Chapter 3: The Eclipse War", order_index: 3 }
    ];

    for (const ch of chaptersData) {
      await databaseManager.run(
        `INSERT INTO chapters (id, project_id, title, order_index) VALUES (?, ?, ?, ?)`,
        [ch.id, projectId, ch.title, ch.order_index]
      );
    }

    // Helpers to resolve character IDs by name
    const findCharId = (name) => characters.find(c => c.title === name)?.id || null;

    // 5. Seed Scenes
    const scenesData = [
      {
        id: uuidv4(),
        chapter_id: chaptersData[0].id,
        title: "The Whispering Gate",
        content: JSON.stringify({
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "The Whispering Gate" }]
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Elara stood before the massive stone gateway. Its surface, cracked by time, hummed with glowing blue fragments of Aether Shards. She reached out a hand, feeling the spark jump between her fingers."
                }
              ]
            }
          ]
        }),
        summary: "Elara examines the glowing Aether gate.",
        order_index: 1,
        pov_entity_id: findCharId("Elara the Mage"),
        purpose: "Introduce the nature of aether magic crystals.",
        conflict: "The magic is unstable and threatens to burn her.",
        outcome: "She successfully stabilizes a micro-shard.",
        word_count: 42,
        status: "polished"
      },
      {
        id: uuidv4(),
        chapter_id: chaptersData[0].id,
        title: "Alaric's Decree",
        content: JSON.stringify({
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "King Alistair paced the throne room, the heavy crown weighing on his brow. The shadow marchers had crossed the borderlands, and the council counselled flight. 'We will stand,' he declared."
                }
              ]
            }
          ]
        }),
        summary: "Alistair orders the capital defended.",
        order_index: 2,
        pov_entity_id: findCharId("King Alistair"),
        purpose: "Establish political stakes and imminent war.",
        conflict: "The council wants to surrender.",
        outcome: "The king overrides them, raising the shield barrier.",
        word_count: 36,
        status: "polished"
      },
      {
        id: uuidv4(),
        chapter_id: chaptersData[1].id,
        title: "Scouting the Borderlands",
        content: JSON.stringify({
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Kaelen crouched in the tall grass, watching the shadow marchers move silently through the valley below. They carried obsidian banners that swallowed the sunlight."
                }
              ]
            }
          ]
        }),
        summary: "Kaelen spies on the shadow forces.",
        order_index: 1,
        pov_entity_id: findCharId("Kaelen the Scout"),
        purpose: "Reveal enemy capabilities and troop sizes.",
        conflict: "A shadow beast detects his scent.",
        outcome: "He escapes but is forced to lose his horse.",
        word_count: 27,
        status: "in_progress"
      },
      {
        id: uuidv4(),
        chapter_id: chaptersData[2].id,
        title: "Charge of the Dawn Guard",
        content: JSON.stringify({
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Commander Vael raised his sunsteel blade, ordering the front line shields forward. 'For Aetheria!' he roared as the clash began."
                }
              ]
            }
          ]
        }),
        summary: "Vael leads the initial charge.",
        order_index: 1,
        pov_entity_id: findCharId("Commander Vael"),
        purpose: "Show visual climax of the battle.",
        conflict: "Outnumbered three to one.",
        outcome: "They hold the gate but suffer high casualties.",
        word_count: 25,
        status: "draft"
      },
      {
        id: uuidv4(),
        chapter_id: chaptersData[2].id,
        title: "Call of the Shards",
        content: JSON.stringify({
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Lyra felt the raw power hum inside her chest, calling her deeper into the whispering forest. The ancient crystals were waking up."
                }
              ]
            }
          ]
        }),
        summary: "Lyra connects with the forest core.",
        order_index: 2,
        pov_entity_id: findCharId("Lyra of the Wilds"),
        purpose: "Introduce wild magic resolution.",
        conflict: "The forest spirits are hostile.",
        outcome: "She calms the core, awakening the forest giants.",
        word_count: 24,
        status: "draft"
      }
    ];

    for (const sc of scenesData) {
      await databaseManager.run(
        `INSERT INTO scenes (id, project_id, chapter_id, title, content, summary, order_index, pov_entity_id, purpose, conflict, outcome, word_count, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sc.id,
          projectId,
          sc.chapter_id,
          sc.title,
          sc.content,
          sc.summary,
          sc.order_index,
          sc.pov_entity_id,
          sc.purpose,
          sc.conflict,
          sc.outcome,
          sc.word_count,
          sc.status
        ]
      );
    }

    // 6. Seed Timeline Events
    const timelineData = [
      {
        id: uuidv4(),
        title: "The Great Shattering",
        date: "0100-01-01",
        description: "The cosmic cataclysm that shattered the original Aether Core, dispersing fragments across the kingdom."
      },
      {
        id: uuidv4(),
        title: "The Treaty of Elms",
        date: "0180-05-12",
        description: "A peace pact signed by Alistair's grandfather bringing border tribes into the union."
      },
      {
        id: uuidv4(),
        title: "The Eclipse Siege",
        date: "0260-10-24",
        description: "The shadow legions launch a direct surprise assault on the crystal capital walls."
      }
    ];

    for (const event of timelineData) {
      await databaseManager.run(
        `INSERT INTO timeline_events (id, project_id, title, description, chronological_date) VALUES (?, ?, ?, ?, ?)`,
        [event.id, projectId, event.title, event.description, event.date]
      );
    }

    // 7. Seed Story Bible Category Cards
    const loreData = [
      {
        id: uuidv4(),
        category: "rules",
        title: "Magic of the Shards",
        content: "Aether crystal magic operates through resonance. Magic users must form physical or mental links to raw crystal fragments. Unregulated use causes elemental crystal poisoning."
      },
      {
        id: uuidv4(),
        category: "rules",
        title: "Aetheria Faction Guard",
        content: "The Royal Alliance formed to guard the Aether core ruins. They wear white sunsteel plates and carry crystal shield batteries."
      },
      {
        id: uuidv4(),
        category: "rules",
        title: "The Whispering Wood",
        content: "An ancient forest where magical tree roots form a telepathic node network. Regular humans hear it as soft murmuring whispers."
      }
    ];

    for (const lore of loreData) {
      await databaseManager.run(
        `INSERT INTO story_bible (id, project_id, category, title, content) VALUES (?, ?, ?, ?, ?)`,
        [lore.id, projectId, lore.category, lore.title, lore.content]
      );
    }

    return await projectManager.loadProject(projectName, ownerId);
  }

  static async seedTemplate(projectId, templateName, databaseManager) {
    console.log(`[ProjectSeeder] Seeding template '${templateName}' for project: ${projectId}`);
    
    let chapters = [];
    let characters = [];
    let lore = [];

    if (templateName === "fantasy") {
      chapters = [
        { id: uuidv4(), title: "Chapter 1: The Awakening", order_index: 1, scenes: [
          {
            id: uuidv4(),
            title: "Call to Quest",
            purpose: "Introduce the protagonist, ordinary world, and the inciting spark.",
            conflict: "The protagonist is bound by family duty or lack of self-belief.",
            outcome: "An unexpected visitor or event shatters their peaceful life.",
            content: JSON.stringify({
              type: "doc",
              content: [
                { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Writing Guidance: The Awakening" }] },
                { type: "paragraph", content: [{ type: "text", text: "Focus: Start by introducing your protagonist in their everyday environment. Let the reader see what they stand to lose." }] },
                { type: "paragraph", content: [{ type: "text", text: "Questions to answer in this scene:\n- Who is the protagonist?\n- What do they desire?\n- What prevents them from achieving it?\n- What event changes their life?" }] }
              ]
            })
          }
        ]},
        { id: uuidv4(), title: "Chapter 2: Crossing the Threshold", order_index: 2, scenes: [
          {
            id: uuidv4(),
            title: "Entering the Wilds",
            purpose: "Move the protagonist out of their comfort zone.",
            conflict: "The environment is hostile and their old skills don't work.",
            outcome: "They meet a mentor figure or discover a magical artifact.",
            content: JSON.stringify({
              type: "doc",
              content: [
                { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Writing Guidance: Crossing the Threshold" }] },
                { type: "paragraph", content: [{ type: "text", text: "Focus: The journey begins. Contrast the new setting with their old home. The rules here are different." }] }
              ]
            })
          }
        ]},
        { id: uuidv4(), title: "Chapter 3: The Dark Descent", order_index: 3, scenes: [
          {
            id: uuidv4(),
            title: "First Encounter",
            purpose: "Establish the villain's power and make the stakes personal.",
            conflict: "A surprise attack by the antagonist's minions.",
            outcome: "A narrow escape, but a friend is captured or injured.",
            content: JSON.stringify({
              type: "doc",
              content: [
                { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Writing Guidance: The Dark Descent" }] },
                { type: "paragraph", content: [{ type: "text", text: "Focus: Show the antagonist's reach. The hero must realize that simple evasion is no longer an option." }] }
              ]
            })
          }
        ]}
      ];

      characters = [
        { id: uuidv4(), title: "Eldrin the Chosen", summary: "The young farmhand destined to carry the Dragon Core.", metadata: { age: "18", desire: "To see the world beyond the hills", weakness: "Self-doubt" } },
        { id: uuidv4(), title: "Althazar the Sage", summary: "An ancient wizard who holds the secrets of the elements.", metadata: { age: "142", weapon: "Staff of Elderwood", desire: "To restore peace to the realm" } },
        { id: uuidv4(), title: "Malakar the Shadow", summary: "The corrupt former knight seeking the dragon shards.", metadata: { age: "54", power: "Dark Resonance", faction: "The Onyx Hand" } }
      ];

      lore = [
        { category: "rules", title: "Lore: The Dragon Shards", content: "The Dragon Core was shattered in the First Age. The shards hum with elements (Fire, Water, Stone, Air) and bind only to descendants of the old bloodlines." },
        { category: "rules", title: "Magic System: Resonance Cost", content: "Resonance magic drains physical energy. Attempting spells beyond one's elemental capacity causes temporary paralysis or permanent burns." }
      ];
    } else if (templateName === "romance") {
      chapters = [
        { id: uuidv4(), title: "Chapter 1: The Meet-Cute", order_index: 1, scenes: [
          {
            id: uuidv4(),
            title: "The Collision",
            purpose: "Introduce the protagonist and the love interest in a high-impact collision.",
            conflict: "Opposing professional goals or personal philosophies.",
            outcome: "A memorable, tense interaction that leaves them both thinking.",
            content: JSON.stringify({
              type: "doc",
              content: [
                { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Writing Guidance: The Meet-Cute" }] },
                { type: "paragraph", content: [{ type: "text", text: "Focus: Set up the immediate chemistry alongside the emotional barriers. Let their clash highlight their contrasting flaws." }] },
                { type: "paragraph", content: [{ type: "text", text: "Questions to answer:\n- What is the initial impression?\n- What external circumstance forces them to interact?\n- What internal wound makes them resist the connection?" }] }
              ]
            })
          }
        ]},
        { id: uuidv4(), title: "Chapter 2: Forced Proximity", order_index: 2, scenes: [
          {
            id: uuidv4(),
            title: "Locked In",
            purpose: "Force the characters to spend time together in a confined setting.",
            conflict: "Physical constraints or shared deadlines.",
            outcome: "Vulnerability is shared; they see behind each other's masks.",
            content: JSON.stringify({
              type: "doc",
              content: [
                { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Writing Guidance: Forced Proximity" }] },
                { type: "paragraph", content: [{ type: "text", text: "Focus: Stripping away professional defenses. This is where true emotional intimacy begins to grow." }] }
              ]
            })
          }
        ]},
        { id: uuidv4(), title: "Chapter 3: The Misunderstanding", order_index: 3, scenes: [
          {
            id: uuidv4(),
            title: "The Rift",
            purpose: "Create emotional distance due to fear or a miscommunication.",
            conflict: "Secrets from the past or assumed motives.",
            outcome: "They pull apart, believing the connection is impossible.",
            content: JSON.stringify({
              type: "doc",
              content: [
                { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Writing Guidance: The Misunderstanding" }] },
                { type: "paragraph", content: [{ type: "text", text: "Focus: The Dark Night of the Soul. They must confront their own internal obstacles to deserve the happy ending." }] }
              ]
            })
          }
        ]}
      ];

      characters = [
        { id: uuidv4(), title: "Chloe Vance", summary: "An ambitious fashion editor struggling to save her family magazine.", metadata: { age: "27", drive: "Career independence", fear: "Betrayal and vulnerability" } },
        { id: uuidv4(), title: "Julian Cross", summary: "A reserved real estate investor bound by family expectations.", metadata: { age: "32", conflict: "Duty vs. Desire", trait: "Guarded and structured" } }
      ];

      lore = [
        { category: "rules", title: "Relationship Boundary Pact", content: "They have signed a strict business agreement: no romantic involvement. Violating the pact threatens both of their careers." }
      ];
    } else if (templateName === "scifi") {
      chapters = [
        { id: uuidv4(), title: "Chapter 1: System Check", order_index: 1, scenes: [
          {
            id: uuidv4(),
            title: "The Horizon's Call",
            purpose: "Establish the setting, ship rules, and crew dynamics.",
            conflict: "Engine warnings and micro-meteorite storms.",
            outcome: "A mysterious encrypted signal is received from deep space.",
            content: JSON.stringify({
              type: "doc",
              content: [
                { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Writing Guidance: Sci-Fi Setup" }] },
                { type: "paragraph", content: [{ type: "text", text: "Focus: Establish the tech rules early. The setting is a character—explain how the crew relies on the vessel for survival." }] }
              ]
            })
          }
        ]}
      ];

      characters = [
        { id: uuidv4(), title: "Captain Jax", summary: "A battle-scarred pilot searching for a forgotten colony.", metadata: { age: "42", weapon: "Plasma Pistol", faction: "Interstellar Alliance" } },
        { id: uuidv4(), title: "Nova (AI Core)", summary: "The ship's sentient artificial intelligence harboring secret directives.", metadata: { version: "9.4", core_logic: "Directives: Protect crew, follow secret orders" } }
      ];

      lore = [
        { category: "rules", title: "FTL Physics Rules", content: "Faster-than-light jumps require folding space using dark matter cells. Jumps over 10 light-years cause severe spatial disorientation (Jump sickness)." }
      ];
    } else if (templateName === "mystery") {
      chapters = [
        { id: uuidv4(), title: "Chapter 1: The Silent Study", order_index: 1, scenes: [
          {
            id: uuidv4(),
            title: "Discovering the Body",
            purpose: "Introduce the crime, the sleuth, and the initial set of suspects.",
            conflict: "The police have locked down the room; tension with family.",
            outcome: "The detective finds the first anomalous clue.",
            content: JSON.stringify({
              type: "doc",
              content: [
                { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Writing Guidance: The Crime Scene" }] },
                { type: "paragraph", content: [{ type: "text", text: "Focus: Establish the environment. Every detail could be a clue. Contrast the clean manor with the grim murder scene." }] }
              ]
            })
          }
        ]}
      ];

      characters = [
        { id: uuidv4(), title: "Detective Sterling", summary: "A brilliant, eccentric sleuth utilizing hyper-observant deduction.", metadata: { age: "38", method: "Detailed observation, psychological profiling" } },
        { id: uuidv4(), title: "Arthur Pendelton", summary: "The wealthy patriarch found dead in his study.", metadata: { age: "68", cause_of_death: "Toxin in the tea" } }
      ];

      lore = [
        { category: "rules", title: "Clue Inventory Log", content: "Track all physical evidence. Ensure each clue has a logical placement and can be deduced by the reader." }
      ];
    } else if (templateName === "webnovel") {
      chapters = [
        { id: uuidv4(), title: "Episode 1: Reborn with a System", order_index: 1, scenes: [
          {
            id: uuidv4(),
            title: "Level 1 Awakening",
            purpose: "Introduce transmigration, level rules, and initial dungeon stats.",
            conflict: "Low level hunter trapped in a sudden gate collapse.",
            outcome: "Unlocking a secret hidden S-Rank class.",
            content: JSON.stringify({
              type: "doc",
              content: [
                { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Writing Guidance: Webnovel Start" }] },
                { type: "paragraph", content: [{ type: "text", text: "Focus: Fast pacing. Introduce the System Interface and level progression. The reader expects immediate stakes and progression." }] }
              ]
            })
          }
        ]}
      ];

      characters = [
        { id: uuidv4(), title: "Jin-Woo", summary: "Reborn as the weakest E-rank hunter, now climbing the ranks.", metadata: { age: "20", class: "Shadow Sovereign (S-Rank)", skills: "Inspect, Dagger Slash" } },
        { id: uuidv4(), title: "System Voice", summary: "The cold, mechanical interface guide tracking quests.", metadata: { identity: "System Core" } }
      ];

      lore = [
        { category: "rules", title: "Hunter Guild Ranks", content: "Hunters are ranked E, D, C, B, A, S. Gates are ranked accordingly. Loot drops correspond to gate danger level." }
      ];
    } else if (templateName === "screenplay") {
      chapters = [
        { id: uuidv4(), title: "Act I: The Hook", order_index: 1, scenes: [
          {
            id: uuidv4(),
            title: "Pages 1-10: Setup",
            purpose: "Introduce main character and establish the inciting conflict.",
            conflict: "High-level visual action hook.",
            outcome: "The world changes, prompting the hero to react.",
            content: JSON.stringify({
              type: "doc",
              content: [
                { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Writing Guidance: Screenplay Act I" }] },
                { type: "paragraph", content: [{ type: "text", text: "Focus: Visual writing. Show, don't tell. Write scene headers (INT./EXT.) and keep action blocks under 4 lines." }] }
              ]
            })
          }
        ]}
      ];

      characters = [
        { id: uuidv4(), title: "Protagonist", summary: "The central figure of the screenplay.", metadata: { goal: "Survival and redemption" } }
      ];

      lore = [
        { category: "rules", title: "Screenplay Formatting Standard", content: "1 page of script equals roughly 1 minute of screen time. Action blocks must describe only what can be seen and heard." }
      ];
    }

    // Insert Chapters and Scenes
    for (const ch of chapters) {
      await databaseManager.run(
        `INSERT INTO chapters (id, project_id, title, order_index) VALUES (?, ?, ?, ?)`,
        [ch.id, projectId, ch.title, ch.order_index]
      );

      for (const sc of ch.scenes) {
        await databaseManager.run(
          `INSERT INTO scenes (id, project_id, chapter_id, title, content, purpose, conflict, outcome, order_index, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [sc.id, projectId, ch.id, sc.title, sc.content, sc.purpose, sc.conflict, sc.outcome, 1, "draft"]
        );
      }
    }

    // Insert Characters
    for (const char of characters) {
      await databaseManager.run(
        `INSERT INTO entities (id, project_id, type, title, summary, metadata) VALUES (?, ?, ?, ?, ?, ?)`,
        [char.id, projectId, "character", char.title, char.summary, JSON.stringify(char.metadata)]
      );
    }

    // Insert Lore/Rules
    for (const lr of lore) {
      await databaseManager.run(
        `INSERT INTO story_bible (id, project_id, category, title, content) VALUES (?, ?, ?, ?, ?)`,
        [uuidv4(), projectId, lr.category, lr.title, lr.content]
      );
    }

    console.log(`[ProjectSeeder] Template '${templateName}' seeded successfully.`);
  }
}

module.exports = ProjectSeeder;
