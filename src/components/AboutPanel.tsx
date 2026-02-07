"use client";

import { useEffect, useState } from "react";
import {
  X,
  Mail,
  Phone,
  MapPin,
  Github,
  Linkedin,
  GraduationCap,
  Briefcase,
  Code,
} from "lucide-react";
import { aboutMe } from "@/lib/projects";

interface AboutPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutPanel({ isOpen, onClose }: AboutPanelProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
    } else {
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-8"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        style={{
          opacity: isOpen ? 1 : 0,
          transition: "opacity 300ms ease-out",
        }}
      />

      {/* Panel */}
      <div
        className="relative w-full h-full md:max-w-3xl md:max-h-[80vh] md:rounded-2xl overflow-hidden"
        style={{
          background: "rgba(30, 30, 30, 0.85)",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)",
          transform: isOpen
            ? "scale(1) translateY(0)"
            : "scale(0.95) translateY(20px)",
          opacity: isOpen ? 1 : 0,
          transition: "transform 300ms ease-out, opacity 300ms ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-6 h-6 md:w-3 md:h-3 rounded-full bg-red-500 hover:bg-red-600 group flex items-center justify-center z-10"
        >
          <X className="w-4 h-4 md:w-2 md:h-2 text-red-900 opacity-0 group-hover:opacity-100" />
        </button>

        {/* Content */}
        <div className="p-4 md:p-8 pt-12 md:pt-12 overflow-y-auto h-full md:max-h-[80vh]">
          {/* Header */}
          <div className="text-center mb-8">
            <div
              className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 border-4 border-white/20"
              style={{ boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)" }}
            >
              <img
                src="/profile.jpg"
                alt="Archit Jaiswal"
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {aboutMe.name}
            </h1>
            <p className="text-lg text-white/70">{aboutMe.title}</p>
            <p className="text-white/50">
              {aboutMe.university} • GPA: {aboutMe.gpa}
            </p>
          </div>

          {/* Contact Info */}
          <div className="flex justify-center gap-6 mb-8 flex-wrap">
            <a
              href={`mailto:${aboutMe.email}`}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span className="text-sm">{aboutMe.email}</span>
            </a>
            <span className="flex items-center gap-2 text-white/70">
              <Phone className="w-4 h-4" />
              <span className="text-sm">{aboutMe.phone}</span>
            </span>
            <span className="flex items-center gap-2 text-white/70">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{aboutMe.location}</span>
            </span>
          </div>

          {/* Social Links */}
          <div className="flex justify-center gap-4 mb-8">
            <a
              href={aboutMe.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
            <a
              href={aboutMe.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
            >
              <Linkedin className="w-4 h-4" />
              <span>LinkedIn</span>
            </a>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Education */}
            <div className="bg-white/5 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-semibold">Education</h3>
              </div>
              <ul className="space-y-2">
                {aboutMe.education.map((edu, idx) => (
                  <li key={idx} className="text-white/70 text-sm">
                    {edu}
                  </li>
                ))}
              </ul>
            </div>

            {/* Experience */}
            <div className="bg-white/5 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-5 h-5 text-blue-400" />
                <h3 className="text-white font-semibold">Experience</h3>
              </div>
              <ul className="space-y-3">
                {aboutMe.experience.map((exp, idx) => (
                  <li key={idx}>
                    <p className="text-white text-sm font-medium">
                      {exp.title}
                    </p>
                    <p className="text-white/50 text-xs">{exp.company}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Skills */}
          <div className="mt-6 bg-white/5 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Code className="w-5 h-5 text-green-400" />
              <h3 className="text-white font-semibold">Skills</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wider mb-2">
                  Languages
                </p>
                <div className="flex flex-wrap gap-2">
                  {aboutMe.skills.languages.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 rounded text-xs bg-white/10 text-white/80"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wider mb-2">
                  Frontend & Backend
                </p>
                <div className="flex flex-wrap gap-2">
                  {aboutMe.skills.frontendBackend.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 rounded text-xs bg-white/10 text-white/80"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wider mb-2">
                  AI & Data
                </p>
                <div className="flex flex-wrap gap-2">
                  {aboutMe.skills.aiData.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 rounded text-xs bg-white/10 text-white/80"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wider mb-2">
                  Cloud & DevOps
                </p>
                <div className="flex flex-wrap gap-2">
                  {aboutMe.skills.cloudDevops.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 rounded text-xs bg-white/10 text-white/80"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
