import { Github, Linkedin, Mail } from "lucide-react";
import { aboutMe } from "@/lib/projects";

const LINKS = [
  { label: "LinkedIn", href: aboutMe.linkedin, Icon: Linkedin },
  { label: "Email", href: `mailto:${aboutMe.email}`, Icon: Mail },
  { label: "GitHub", href: aboutMe.github, Icon: Github },
];

export default function ContactBar() {
  return (
    <nav
      aria-label="Contact"
      className="fixed right-4 top-4 z-20 flex items-center gap-4 sm:right-8 sm:top-6 sm:gap-5"
    >
      <span className="hidden text-sm font-medium text-[#E9DFD0] sm:inline">Contact me:</span>
      {LINKS.map(({ label, href, Icon }) => (
        <a
          key={label}
          href={href}
          aria-label={label}
          target={href.startsWith("mailto:") ? undefined : "_blank"}
          rel="noreferrer"
          className="text-[#E9DFD0] transition-colors hover:text-[#FFDE85]"
        >
          <Icon className="h-6 w-6" strokeWidth={1.8} />
        </a>
      ))}
    </nav>
  );
}
