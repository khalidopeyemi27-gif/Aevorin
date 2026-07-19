# ARCHITECTURE LOCK — AEVORIN v1.1.0

## Status: FROZEN

This document locks the architectural design of the AEVORIN platform. Unchecked architecture drift is disallowed. All core architectural modifications must satisfy the change process below.

---

## 1. Core Architectural Layout

```
AEVORIN/
├── backend/                       # Core Node.js Engine
│   ├── contracts/                 # Structural Contract Interfaces
│   ├── kernel/                    # Bootstrapper, Container Injection
│   ├── core/                      # Stable Subsystems (Core Engine)
│   │    ├── manuscript/           # Chapters, Scenes, Compilers
│   │    ├── knowledge/            # Unified Entities, Story Bible
│   │    └── infrastructure/       # Database (Native SQLite), Events, Feature flags, Backups
│   └── modules/                   # Extensible Features (AI, Publishing, Analytics)
│
├── client/                        # Desktop UI (React, Vite, TypeScript)
└── user_data/                     # Isolated Local Workspaces
     └── projects/                 # Portable Book Directories
```

---

## 2. Change Control Process

Any modifications to this locked architecture require:
1. **Documented Rationale**: Business/creative justification explaining why existing contracts/interfaces cannot support the feature.
2. **Migration Impact Assessment**: Full details on SQLite schema impacts and how legacy user projects will migrate.
3. **Backward Compatibility Review**: Affirmation that existing `.aevorin` project files can load without data loss.

---

## 3. Approved Core Subsystems (Milestone 1.0 baseline)
- **Offline First**: All user projects are stored locally in isolated folders containing `project.aevorin` (JSON metadata) and `database.sqlite` (portable project databases).
- **Service Container**: Singletons resolved through `ServiceContainer` on kernel bootstrap.
- **Event Bus**: Subsystems communicate asynchronously via global broker events.
- **Native SQL Engine**: Node-native `node:sqlite` connection pooling with zero dependencies or Visual Studio compilation requirements.
