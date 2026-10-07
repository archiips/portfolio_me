// The Blender scene exports invisible `<section>hitbox` boxes for raycasting and
// `nav_<section>` meshes for the visible highlight. Keeping the mapping in one
// place means the 3D scene and the panels can never drift apart.
export const SECTIONS = ["projects", "aboutme", "education", "work", "contact"] as const;

export type Section = (typeof SECTIONS)[number];

export const HITBOX_OF: Record<Section, string> = {
  projects: "projectshitbox",
  aboutme: "aboutmehitbox",
  education: "educationhitbox",
  work: "workhitbox",
  contact: "contacthitbox",
};

export const NAV_MESH_OF: Record<Section, string> = {
  projects: "nav_projects",
  aboutme: "nav_aboutme",
  education: "nav_education",
  work: "nav_work",
  contact: "nav_contact",
};

export const LABEL_OF: Record<Section, string> = {
  projects: "Projects",
  aboutme: "About me",
  education: "Education",
  work: "Experience",
  contact: "Contact",
};

export function sectionFromHitbox(name: string): Section | null {
  const hit = SECTIONS.find((s) => HITBOX_OF[s] === name);
  return hit ?? null;
}
