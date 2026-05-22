export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
}

export const projects: Project[] = [
  {
    id: "ai-safety-red-teaming",
    title: "AI Safety Red-Teaming Tool",
    description:
      "Built a high-performance C++ policy engine that detects and scores LLM security vulnerabilities across 10 risk categories at 8.3µs median latency — 12× faster than Python. Used Azure AI Foundry (Phi-4) to generate adversarial attacks scored by Azure Content Safety, with a severity dashboard deployed on Azure Container Apps and GitHub Actions CI/CD catching regressions on every PR.",
    technologies: ["C++", "Python", "Azure AI Foundry", "Azure Content Safety", "FastAPI", "React", "GitHub Actions"],
    githubUrl: "https://github.com/archiips",
  },
  {
    id: "ml-license-compliance",
    title: "ML License Compliance Agent",
    description:
      "Automated ML license auditing across Python packages, AI models, and datasets in a single GitLab CI/CD pass using CycloneDX SBOMs. Published an Anthropic Claude-powered agent to the GitLab catalog that explains license violations in plain English and recommends fixes.",
    technologies: ["Python", "GitLab CI/CD", "Hugging Face", "CycloneDX", "Claude API"],
    githubUrl: "https://github.com/archiips",
  },
  {
    id: "document-querying",
    title: "Intelligent Document Querying System",
    description:
      "Production-ready RAG system built with Amazon Bedrock and Claude 3 Sonnet for querying enterprise documents. Designed a scalable vector store on Aurora Serverless with pgvector for sub-second retrieval. Automated cloud infrastructure with Terraform (VPCs, IAM, S3) and tuned Temperature and Top P parameters to balance factual accuracy with response quality.",
    technologies: ["Amazon Bedrock", "Claude 3 Sonnet", "RAG", "Aurora Serverless", "pgvector", "Terraform", "AWS S3"],
    githubUrl: "https://github.com/archiips",
  },
  {
    id: "recommendation-engine",
    title: "Deep Learning Recommendation Engine",
    description:
      "Production recommendation system trained on 23,000+ e-commerce reviews using PyTorch, achieving 21.5% precision for top-10 suggestions and a 36% improvement over matrix factorization via Neural Collaborative Filtering. Addressed class imbalance and cold-start problems using negative sampling, dropout, and feature engineering. Deployed with FastAPI, Redis caching, and Prometheus/Grafana monitoring.",
    technologies: ["PyTorch", "FastAPI", "Redis", "Docker", "Neural Collaborative Filtering", "Prometheus", "Grafana"],
    githubUrl: "https://github.com/archiips",
  },
  {
    id: "neuroverse",
    title: "Neuroscience Data Visualization Platform",
    description:
      "Full-stack web app visualizing demographics from 23 OpenNeuro datasets (2,700+ participants). Built a FastAPI backend serving parsed neuroscience data from PostgreSQL on Render, and a React frontend with interactive 3D Plotly.js charts for age, sex, and diagnosis distributions.",
    technologies: ["React", "FastAPI", "PostgreSQL", "Plotly.js", "Vercel", "Render"],
    githubUrl: "https://github.com/archiips",
    liveUrl: "https://neuroverse-dusky.vercel.app",
  },
  {
    id: "dawgs-marketplace",
    title: "Dawgs Marketplace",
    description:
      "Campus-exclusive buy/sell marketplace restricted to verified @uw.edu accounts via Google OAuth, serving UW Bothell students. Led database architecture with Flask, SQLAlchemy, and Supabase/PostgreSQL, supporting full listing lifecycle (create, edit, delete, sold). Integrated Cloudinary for image delivery and deployed on Vercel with a fully responsive UI.",
    technologies: ["React", "Flask", "PostgreSQL", "Supabase", "SQLAlchemy", "Cloudinary", "Google OAuth"],
    githubUrl: "https://github.com/archiips",
  },
  {
    id: "uw-navigation",
    title: "UW Seattle Navigation System",
    description:
      "Real-time campus navigation app in Java and Spring Boot computing shortest walking paths across 19,000+ nodes using Dijkstra's algorithm. Optimized with in-memory graph engine and Java priority queues for ~40ms route calculation. React frontend renders computed paths interactively on a campus map via REST API.",
    technologies: ["Java", "Spring Boot", "React", "Dijkstra's Algorithm", "Graph Data Structures"],
    githubUrl: "https://github.com/archiips",
  },
  {
    id: "products-sense",
    title: "ProductsSense",
    description:
      "Product recommendation web app that fetches live listings from the Amazon Rainforest API and passes them to MistralAI's Mixtral-8x7B-Instruct LLM to generate personalized recommendations. Python backend handles API orchestration and prompt construction; React frontend displays recommendations with product details and pricing.",
    technologies: ["Python", "MistralAI", "Amazon Rainforest API", "React"],
    githubUrl: "https://github.com/archiips",
  },
];

export const aboutMe = {
  name: "Archit Jaiswal",
  title: "Computer Science & Software Engineering Student",
  university: "University of Washington",
  gpa: "3.88",
  location: "Seattle, WA",
  email: "architjaiswal18@gmail.com",
  phone: "(425) 543-2143",
  education: [
    "University of Washington, Bothell — Dean's List",
    "BS in Computer Science & Software Engineering (GPA: 3.88/4.0)",
    "Expected June 2028 | Coursework: DSA (C++), Databases, Agile SE",
    "AWS AI Engineer Nanodegree — Udacity × AWS (Sept–Nov 2025)",
  ],
  experience: [
    {
      title: "Machine Learning Researcher",
      company: "DAIS Research Group, University of Washington",
      period: "April 2026 – Present",
      description:
        "Researching ML microservice and backend architecture of CareBot, an LLM-powered mental health chatbot in the NSF-supported iCare platform, supporting Explainable AI (XAI) development with RASA, Python, and LLMs.",
    },
    {
      title: "User Insight R&D Intern",
      company: "Apexiel, Inc.",
      period: "Oct 2025 – Mar 2026",
      description:
        "Fine-tuned Phi-3 via QLoRA and Unsloth as an interactive story interviewer. Accelerated story creation by 40% with a photo-first Flask/React/PostgreSQL platform and cut content complexity by 60% with a JSONB content system.",
    },
    {
      title: "Software Engineer Intern",
      company: "Genmark AI",
      period: "June 2025 – Aug 2025",
      description:
        "Expanded platform feature coverage by 50% (6→9 workflows) via TypeScript UI redesign and Python/GCP backend. Cut manual marketing work by 40% with n8n automation pipelines for AI-driven content scheduling.",
    },
  ],
  skills: {
    languages: ["Python", "Java", "C++", "JavaScript", "TypeScript", "HTML/CSS", "SQL", "Swift"],
    frontendBackend: ["React", "Flask", "FastAPI", "Spring Boot", "PyTorch", "NumPy", "Pandas", "SwiftUI"],
    aiData: ["Azure AI Foundry", "Amazon Bedrock", "SageMaker", "RAG", "Embeddings", "QLoRA", "Hugging Face", "Comprehend"],
    cloudDevops: ["PostgreSQL", "Amazon S3", "Aurora", "Lambda", "GCP", "Terraform", "Docker", "Git", "GitLab", "Redis"],
  },
  github: "https://github.com/archiips",
  linkedin: "https://www.linkedin.com/in/archit-jaiswal4/",
};
