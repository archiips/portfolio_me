// The Blender scene exports invisible `<name>hitbox` boxes for raycasting and
// `nav_<name>` meshes for the visible highlight. Keeping the mapping in one
// place means the 3D scene and the panels can never drift apart.
export const SECTIONS = ["projects", "aboutme", "education", "work", "contact", "photos"] as const;

export type Section = (typeof SECTIONS)[number];

// Sections with a clickable object in the room. "contact" is menu-only; the
// photo garland (exported as the contact hitbox) opens the photo stack.
export const HITBOX_OF: Partial<Record<Section, string>> = {
  projects: "projectshitbox",
  aboutme: "aboutmehitbox",
  education: "educationhitbox",
  work: "workhitbox",
  photos: "contacthitbox",
};

export const NAV_MESH_OF: Partial<Record<Section, string>> = {
  projects: "nav_projects",
  aboutme: "nav_aboutme",
  education: "nav_education",
  work: "nav_work",
  photos: "nav_contact",
};

export const LABEL_OF: Record<Section, string> = {
  projects: "Projects",
  aboutme: "About me",
  education: "Education",
  work: "Experience",
  contact: "Contact",
  photos: "Photos",
};

export function sectionFromHitbox(name: string): Section | null {
  const hit = SECTIONS.find((s) => HITBOX_OF[s] === name);
  return hit ?? null;
}
