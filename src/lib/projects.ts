export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
}

// The major projects only (resume + GitHub); class assignments and small
// experiments are left out on purpose.
export const projects: Project[] = [
  {
    id: "ai-safety-red-teaming",
    title: "AI Safety Red-Teaming Tool",
    description:
      "A high-performance C++ policy engine that detects and scores LLM security vulnerabilities across 10 risk categories, 12× faster than Python at an 8.3µs median latency. Azure AI Foundry (Phi-4) generates adversarial prompts and Azure Content Safety scores them, with a live severity dashboard on Azure Container Apps and GitHub Actions CI/CD.",
    technologies: ["C++", "Python", "Azure AI Foundry", "Azure Content Safety", "FastAPI", "React", "GitHub Actions"],
    githubUrl: "https://github.com/archiips/AI-safety-red-teaming-tool",
  },
  {
    id: "chippy",
    title: "Chippy",
    description:
      "An iOS app that turns confusing medical documents into a clear health history. Scan a prescription, lab result or doctor's note and a 10-step pipeline extracts medications, diagnoses and lab values into a timeline, with a RAG chat that answers only from your own records. On-device OCR runs before anything is uploaded.",
    technologies: ["Swift", "SwiftUI", "FastAPI", "Gemini 2.5 Flash", "LlamaIndex", "Qdrant", "Supabase"],
    githubUrl: "https://github.com/archiips/Chippy-Health-records-AI-App",
  },
  {
    id: "vitaquest",
    title: "VitaQuest",
    description:
      "Built at UWBHacks '26: everyday habits as a pixel-art adventure with a panda companion. Habit islands, XP, streaks and friend nudges, with photo verification of activities through a FastAPI service using MobileCLIP embeddings (Ollama fallback) and HealthKit steps and sleep.",
    technologies: ["React Native", "Expo", "SwiftUI", "HealthKit", "FastAPI", "MobileCLIP", "Supabase"],
    githubUrl: "https://github.com/archiips/uwbhacks-26",
  },
  {
    id: "catalog",
    title: "Catalog",
    description:
      "A full-stack social platform for cat owners: pet profiles, paginated feeds, multi-image posts, likes, comments and follows. Routes secured with Google OAuth 2.0 and JWT, plus pet ownership transfers with notifications and a health calendar with vet records.",
    technologies: ["React", "FastAPI", "PostgreSQL", "SQLAlchemy", "Cloudinary", "Google OAuth", "Docker"],
    githubUrl: "https://github.com/archiips/Catalog",
    liveUrl: "https://catalog-seven-khaki.vercel.app",
  },
  {
    id: "bedrock-rag",
    title: "Bedrock RAG System",
    description:
      "A production-ready RAG system for querying enterprise documents with Amazon Bedrock and Claude 3 Sonnet. A pgvector store on Aurora Serverless gives sub-second retrieval, the whole stack (VPCs, IAM, S3) is deployed with Terraform, and inference parameters are tuned for factual answers.",
    technologies: ["Amazon Bedrock", "Claude 3 Sonnet", "Aurora Serverless", "pgvector", "Terraform", "AWS S3"],
    githubUrl: "https://github.com/archiips/aws-bedrock-rag-system",
  },
  {
    id: "recommendation-engine",
    title: "Clothing Recommendation Engine",
    description:
      "A recommendation system trained on 23K+ real e-commerce reviews, comparing a popularity baseline, PyTorch matrix factorization and neural collaborative filtering. Served by a FastAPI API (9 endpoints, <200ms) with Redis + LRU caching at an 80%+ hit rate, deployed to Cloud Run with GitHub Actions CI/CD.",
    technologies: ["PyTorch", "FastAPI", "Redis", "Docker", "GCP Cloud Run", "GitHub Actions"],
    githubUrl: "https://github.com/archiips/Deep-Learning-Clothing-Recommendation-System",
  },
  {
    id: "neuroverse",
    title: "NeuroVerse",
    description:
      "A full-stack app that makes neuroscience data approachable: demographics from 23 OpenNeuro datasets (2,700+ participants) as interactive 3D charts of age, sex and diagnosis, without downloading the raw data. FastAPI + PostgreSQL backend, React and Plotly.js frontend.",
    technologies: ["React", "FastAPI", "PostgreSQL", "Plotly.js", "Vercel", "Render"],
    githubUrl: "https://github.com/archiips/NeuroVerse",
    liveUrl: "https://neuroverse-dusky.vercel.app",
  },
];

export const aboutMe = {
  name: "Archit Jaiswal",
  title: "Computer Science & Software Engineering Student",
  university: "University of Washington",
  gpa: "3.88",
  location: "Seattle, WA",
  email: "archit4@uw.edu",
  phone: "(425) 543-2143",
  website: "https://architjaiswal.vercel.app",
  education: [
    "University of Washington, Bothell — Dean's List",
    "BS in Computer Science & Software Engineering (GPA: 3.88/4.0)",
    "Sept 2024 – Expected June 2028",
    "Coursework: Data Structures & Algorithms (C++), Databases, Network Design & Programming, Parallel & Distributed Computing, Software Engineering (Agile)",
  ],
  experience: [
    {
      title: "Software Engineer Intern",
      company: "Quadrant Technologies",
      period: "Jul 2026 – Aug 2026",
      description:
        "Built the AI layer of an internal HR portal: RAG with Azure OpenAI and Azure AI Search over 31 policy documents, with cited answers and retrieval filtered by Entra ID role. Cut grounded answer latency from 124s to 7s, wrote the full Terraform estate and two CI/CD pipelines, 128 tests and a 70-question retrieval benchmark, and cut the monthly cloud run rate 80%.",
    },
    {
      title: "Machine Learning Researcher",
      company: "DAIS Research Group, University of Washington",
      period: "April 2026 – Present",
      description:
        "Prototyping speech emotion recognition for CareBot, an LLM-powered mental-health chatbot in the NSF-supported iCare platform, using Meta's wav2vec2 (fine-tuned on IEMOCAP) and OpenAI's Whisper, and designing parallel audio inference so emotion signals augment the system prompt.",
    },
    {
      title: "Software Developer (Contract)",
      company: "Catalog",
      period: "March 2026 – July 2026",
      description:
        "Built a full-stack social platform for cat owners with React, FastAPI and PostgreSQL: pet profiles, paginated feeds, multi-image posts via Cloudinary, likes, comments and follows, all secured with Google OAuth 2.0 and JWT.",
    },
    {
      title: "User Insight R&D Intern",
      company: "Apexiel, Inc.",
      period: "Oct 2025 – Mar 2026",
      description:
        "Fine-tuned Phi-3 via QLoRA and Unsloth as an interactive story interviewer. Accelerated story creation by 40% across 5 motorsport categories with a photo-first Flask/React/PostgreSQL platform, and cut content complexity by 60% with a JSONB content system.",
    },
    {
      title: "Software Engineer Intern",
      company: "Genmark AI",
      period: "June 2025 – Aug 2025",
      description:
        "Expanded platform feature coverage by 50% (6 → 9 workflows) by redesigning the UI in TypeScript and configuring Python backend services for GCP, cutting manual marketing work by 40% with n8n automation pipelines.",
    },
  ],
  leadership: {
    title: "President",
    org: "Helping Handz, University of Washington",
    period: "2025 – Present",
    description:
      "Lead a student volunteer organization: a donation drive for Seattle Children's Hospital, hygiene kits for unhoused residents across Seattle, building tiny homes for transitional housing and restoring native habitat with Whale Scout.",
  },
  skills: {
    languages: ["Python", "C++", "Java", "JavaScript", "TypeScript", "SQL", "Swift"],
    frontendBackend: ["React", "FastAPI", "Flask", "Spring Boot", "PyTorch", "NumPy", "Pandas", "SwiftUI"],
    aiData: ["QLoRA", "RAG", "Vector Search", "Amazon Bedrock", "Azure OpenAI", "Azure AI Search", "Azure AI Foundry", "wav2vec2", "Whisper"],
    cloudDevops: ["PostgreSQL", "Azure SQL", "Redis", "Docker", "Terraform", "Azure App Service", "Azure DevOps", "GCP", "S3", "GitHub Actions"],
  },
  github: "https://github.com/archiips",
  linkedin: "https://www.linkedin.com/in/archit-jaiswal4/",
};
