/**
 * Full-Length Starter Resumes:
 * 1. Mid-Career Software Engineer (Default)
 * 2. Student / Entry-Level
 * 3. Senior Management / Executive
 * 4. Academic CV
 */

export const STARTER_RESUMES = {
  'mid-swe': {
    id: 'starter_mid_swe',
    title: 'Software Engineer Resume',
    rawMarkdown: `---
name: Alex Chen
title: Senior Software Engineer
summary: Full-stack systems engineer with 6+ years designing fault-tolerant distributed platforms and high-throughput microservices. Proven track record reducing cloud infrastructure costs by 35% and mentoring high-velocity engineering teams.
contact:
  email: alex.chen@example.com
  phone: "+1 (555) 382-9102"
  location: San Francisco, CA
  linkedin: linkedin.com/in/alexchen-dev
  github: github.com/alexchen-dev
  website: alexchen.dev
settings:
  template: modern-minimal
  paper: letter
  targetPages: 1
  margins: 0.5
  fontSize: 10
  lineHeight: 1.30
  sectionSpacing: 14
  itemSpacing: 6
  bulletSpacing: 3
  primaryFont: Inter
  headerFont: Inter
  accentColor: "#1e3a8a"
---

## Experience

### Senior Software Engineer | Stripe | San Francisco, CA | 2022 - Present
- Architected and shipped event-driven settlement reconciliation pipeline handling $140M+ daily volume using Go and Apache Kafka.
- Optimized database indexing and connection pooling, reducing p99 API latency from 420ms to 65ms across global endpoints.
- Spearheaded zero-downtime database migration of 45M billing records to Amazon Aurora PostgreSQL.
- Mentored 5 junior and mid-level engineers through bi-weekly design reviews and structured code pair programming.

### Software Engineer | Datadog | New York, NY | 2019 - 2022
- Engineered custom telemetry ingestion agents in Go and Rust, processing 1.2M metrics/sec with sub-50ms ingestion delay.
- Built reusable React and TypeScript observability dashboard components adopted by 12,000+ enterprise clients.
- Automated end-to-end load testing in CI/CD pipeline using Terraform and Kubernetes, cutting regression discovery time by 60%.

### Software Engineering Intern | Mozilla | Remote | Summer 2018
- Contributed memory optimization patches to Firefox WebRender rendering engine in Rust.
- Authored 28 automated integration tests improving test suite code coverage by 14%.

## Technical Skills

::skills Languages: [TypeScript, JavaScript, Go, Python, Rust, SQL]
::skills Frameworks & Tools: [React, Node.js, Next.js, Express, GraphQL, Docker, Kubernetes, Terraform]
::skills Infrastructure & Storage: [AWS (ECS, RDS, S3), Kafka, Redis, PostgreSQL, Git, CI/CD]

## Education

### B.S. in Computer Science | University of California, Berkeley | Berkeley, CA | 2015 - 2019
- GPA: 3.82 / 4.0. Regents and Chancellor's Scholar.
- Relevant Coursework: Operating Systems, Distributed Systems, Algorithms & Complexity, Database Systems.

## Projects

### HyperKV — Distributed Key-Value Store | Personal Project | 2023
- Built Raft-consensus replicated key-value storage engine in Go with snapshotting and gRPC cluster membership.
- Published open-source benchmarks comparing throughput against etcd and Consul (1,400+ GitHub stars).
`
  },

  'entry-level': {
    id: 'starter_entry_level',
    title: 'Student / Entry-Level Resume',
    rawMarkdown: `---
name: Maya Patel
title: Computer Science Graduate & Associate Engineer
summary: Motivated computer science graduate with strong foundational knowledge in data structures, algorithms, and full-stack web development. Experienced through two engineering internships and competitive hackathons.
contact:
  email: maya.patel@alumni.edu
  phone: "+1 (555) 749-2041"
  location: Austin, TX
  linkedin: linkedin.com/in/mayapatel-cs
  github: github.com/mayapatel
settings:
  template: split-sidebar
  paper: letter
  targetPages: 1
  margins: 0.45
  fontSize: 10
  lineHeight: 1.30
  sectionSpacing: 12
  itemSpacing: 6
  bulletSpacing: 3
  primaryFont: Inter
  headerFont: Inter
  accentColor: "#3b82f6"
---

## Education

### B.S. in Computer Science | University of Texas at Austin | Austin, TX | 2020 - 2024
- GPA: 3.88 / 4.0 — Dean's Honor List (All Semesters).
- Honors: Outstanding Undergraduate Researcher in Machine Learning (2023).

## Skills

::skills Core: [Python, Java, C++, TypeScript, SQL]
::skills Web: [React, HTML5, CSS3, TailwindCSS, Node.js]
::skills Developer Tools: [Git, GitHub Actions, Docker, Linux, VS Code]

## Experience

### Software Engineering Intern | Dell Technologies | Round Rock, TX | Summer 2023
- Developed internal diagnostic telemetry dashboard in React and Python Flask monitoring 1,200+ edge server racks.
- Automated API test coverage using PyTest, catching 18 critical edge cases prior to staging deployments.
- Collaborated in an agile scrum team of 8 engineers with daily standups and sprint retrospectives.

### Undergraduate Teaching Assistant | UT Austin CS Department | Austin, TX | 2022 - 2024
- Led weekly discussion and lab sessions for 60+ students in CS 314: Data Structures and Algorithms.
- Graded programming assignments and conducted 4 office hours weekly assisting students in Java debugging.

## Projects

### CampusPulse — Real-Time Campus Events App | Hackathon Winner | 2023
- Built full-stack progressive web application using Next.js, Prisma, and Supabase during HackTX 2023 (1st Place).
- Implemented real-time geospatial filtering allowing students to locate study groups within a 0.5-mile radius.

### Algorithm Visualizer | Open Source | 2022
- Created interactive canvas visualizer demonstrating Dijkstra's, A*, and sorting algorithms with step-by-step playback.
`
  },

  'senior-mgmt': {
    id: 'starter_senior_mgmt',
    title: 'Engineering Director / Executive Resume',
    rawMarkdown: `---
name: Marcus Vance
title: Vice President of Engineering
summary: Strategic technology leader with 16+ years scaling engineering organizations from series B through IPO. Track record managing 120+ cross-functional engineers, delivering enterprise cloud platforms, and maintaining 99.99% SLA across $200M+ ARR businesses.
contact:
  email: marcus.vance@executive.io
  phone: "+1 (555) 914-5502"
  location: Seattle, WA
  linkedin: linkedin.com/in/marcusvance-vp
settings:
  template: executive-compact
  paper: letter
  targetPages: 2
  margins: 0.45
  fontSize: 9.75
  lineHeight: 1.25
  sectionSpacing: 12
  itemSpacing: 6
  bulletSpacing: 2
  primaryFont: Inter
  headerFont: Merriweather
  accentColor: "#0f766e"
---

## Executive Summary

- Executive leader with expertise in organizational scaling, technical strategy, cloud infrastructure governance, and M&A technology integration.
- Led global distributed organizations across North America and Europe, increasing annual engineering velocity by 40% while cutting attrition to under 4%.

## Professional Experience

### Vice President of Engineering | CloudScale Technologies | Seattle, WA | 2020 - Present
- Recruited and structured 120-person engineering organization across Platform, Security, AI Infrastructure, and SRE.
- Directed engineering execution supporting revenue growth from $45M to $210M ARR; spearheaded SOC2 Type II compliance.
- Reduced annual AWS cloud infrastructure expenditures by $3.4M (28%) via automated autoscaling and reserved capacity planning.
- Established Engineering Management Ladders, quarterly performance reviews, and career advancement frameworks.

### Director of Engineering | AppDynamics | San Francisco, CA | 2016 - 2020
- Managed 4 engineering managers and 45 software engineers building application intelligence and monitoring solutions.
- Championed transition from monolith to containerized microservices architecture on Kubernetes, cutting deploy cycle from 3 weeks to daily.
- Partnered with product and sales executives to deliver critical multi-tenant enterprise features driving $18M in new annual contracts.

### Principal Systems Architect | Amazon Web Services | Seattle, WA | 2011 - 2016
- Designed core storage virtualization components for Amazon EBS handling exabytes of mission-critical volume replication.
- Authored 3 US patents in distributed disk failure detection and automated multi-zone replication.

## Education & Credentials

### M.S. in Computer Science | Stanford University | Stanford, CA | 2009 - 2011
### B.S. in Electrical & Computer Engineering | University of Washington | Seattle, WA | 2005 - 2009

## Core Competencies

::skills Executive Leadership: [Organizational Scaling, Engineering Hiring, Tech Strategy, M&A Integration, Board Presentations]
::skills Architecture & Cloud: [Distributed Systems, AWS, Kubernetes, SOC2 Compliance, Multi-Region DR, Microservices]
`
  },

  'academic-cv': {
    id: 'starter_academic_cv',
    title: 'Dr. Eleanor Wright — Academic CV',
    rawMarkdown: `---
name: Dr. Eleanor Wright
title: Assistant Professor of Computer Science
summary: Researcher in natural language processing, neural network interpretability, and trustworthy machine learning. Author of 18 peer-reviewed papers at NeurIPS, ICML, and ACL with over 2,400 citations.
contact:
  email: e.wright@oxford.ac.uk
  phone: "+44 1865 270000"
  location: Oxford, United Kingdom
  website: eleanorwright.org
  github: github.com/ewright-ox
settings:
  template: academic-cv
  paper: a4
  targetPages: 2
  margins: 0.6
  fontSize: 10
  lineHeight: 1.35
  sectionSpacing: 16
  itemSpacing: 8
  bulletSpacing: 4
  primaryFont: Merriweather
  headerFont: Merriweather
  accentColor: "#1e293b"
---

## Academic Appointments

### Assistant Professor | University of Oxford | Oxford, UK | 2022 - Present
- Department of Computer Science & Oxford AI Institute.
- Leading the Trustworthy NLP Laboratory supervising 4 Ph.D. students and 2 postdoctoral fellows.

### Postdoctoral Research Fellow | Stanford University | Stanford, CA | 2020 - 2022
- Advised by Prof. Christopher Manning at the Stanford NLP Group.
- Conducted research on internal representation dynamics and probing methods in large transformer models.

## Education

### Ph.D. in Computer Science | Massachusetts Institute of Technology | Cambridge, MA | 2015 - 2020
- Dissertation: *Geometric Interpretability of High-Dimensional Latent Spaces in Neural Language Models*.
- Advised by Prof. Regina Barzilay. Winner of the MIT George M. Sprowls Award for Outstanding Ph.D. Thesis.

### B.A. in Mathematics & Computer Science | Harvard University | Cambridge, MA | 2011 - 2015
- Summa Cum Laude, Phi Beta Kappa.

## Selected Peer-Reviewed Publications

### Probing Attention Heuristics in Large Multilingual Language Models | NeurIPS 2023 | 2023
- Wright, E., Zhao, K., & Sutherland, M. *Advances in Neural Information Processing Systems*, 36, 14201–14215.

### Towards Certified Robustness in Transformer Attention Layers | ICML 2022 | 2022
- Wright, E. & Manning, C. D. *International Conference on Machine Learning*, PMLR 162: 24018–24032.

### Faithful Explanations for Recurrent and Attention-Based Text Classifiers | ACL 2020 | 2020
- Wright, E., Barzilay, R., & Jaakkola, T. *Association for Computational Linguistics (Oral Presentation)*.

## Grants & Fellowships

### EPSRC Early Career Research Fellowship | £450,000 | 2023 - 2026
- Principal Investigator on scalable mechanistic interpretability for generative language models.

### National Science Foundation Graduate Research Fellowship (NSF GRFP) | $138,000 | 2016 - 2019
`
  },

  'blank-guided': {
    id: 'starter_blank_guided',
    title: 'New Resume Skeleton',
    rawMarkdown: `---
name: Your Name
title: Professional Title / Target Role
summary: Concise 2-3 sentence overview of your professional background, core technical strengths, and measurable achievements.
contact:
  email: your.email@example.com
  phone: "+1 (555) 123-4567"
  location: City, ST
  linkedin: linkedin.com/in/yourprofile
  github: github.com/yourhandle
  website: yourwebsite.com
settings:
  template: modern-minimal
  paper: letter
  targetPages: 1
  margins: 0.5
  fontSize: 10
  lineHeight: 1.30
  sectionSpacing: 14
  itemSpacing: 6
  bulletSpacing: 3
  primaryFont: Inter
  headerFont: Inter
  accentColor: "#1e3a8a"
---

## Experience

### Job Title | Company Name | City, ST | 2022 - Present
- Spearheaded high-impact initiative resulting in measurable business growth or cost savings.
- Led cross-functional team across engineering, product, and design to ship customer-facing features.
- Optimized performance, reducing latency by 40% and improving reliability across services.

### Previous Title | Previous Company | City, ST | 2019 - 2022
- Engineered core features using modern frameworks and scalable architecture.
- Collaborated with stakeholders to define requirements and establish engineering best practices.

## Education

### Degree Name in Field of Study | University Name | City, ST | Graduation Year
- Honors, relevant coursework, or leadership activities.

## Skills

::skills Core Competencies: [Key Skill 1, Key Skill 2, Key Skill 3, Key Skill 4]
::skills Technologies & Tools: [Tool 1, Tool 2, Tool 3, Platform 4]
`
  }
};

export function getStarterResume(key = 'mid-swe') {
  return STARTER_RESUMES[key] || STARTER_RESUMES['mid-swe'];
}
