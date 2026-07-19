import type { Chapter } from "../models/chapter";

export interface ActGroup {
  act: string;
  act_index: number;
  chapters: Chapter[];
}

export function groupChaptersByAct(chapters: Chapter[]): ActGroup[] {
  const groupsMap: { [key: string]: ActGroup } = {};

  for (const ch of chapters) {
    const actName = ch.act || "Act I";
    const actIdx = ch.act_index !== undefined ? ch.act_index : 1;

    if (!groupsMap[actName]) {
      groupsMap[actName] = {
        act: actName,
        act_index: actIdx,
        chapters: []
      };
    }
    groupsMap[actName].chapters.push(ch);
  }

  const groupsList = Object.values(groupsMap);
  for (const group of groupsList) {
    group.chapters.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  }

  return groupsList.sort((a, b) => a.act_index - b.act_index);
}
