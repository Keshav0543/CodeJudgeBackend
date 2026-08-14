# CodeJudge

A full-stack competitive programming platform where users can write, execute, and practice coding problems. The platform uses Judge0 for code execution and is being extended with AI-powered hints, suggestions, and mentoring to help users improve their problem-solving skills.

## 🚀 Features

* **JWT Authentication & Authorization** — Secure user authentication and role-based access control.
* **Redis-based Token Management** — Maintains blocked/invalidated JWT tokens to improve account security.
* **Redis Rate Limiting** — Limits excessive API requests to protect the system from abuse and improve scalability.
* **Judge0 Integration** — Executes user-submitted code in a controlled environment.
* **Email-based Password Reset** — Allows users to securely reset forgotten passwords through email.
* **Contest System** — Allows users to participate in contests and track their competitive programming progress.
* **Scalable REST APIs** — Backend APIs designed with maintainability and scalability in mind.
* **Docker Support** — Provides containerized development and local deployment support.

## 🛠️ Tech Stack

### Frontend

* React
* Redux Toolkit
* React Hook Form
* Tailwind CSS
* DaisyUI

### Backend

* Node.js
* Express.js
* MongoDB
* Redis
* Judge0
* Nodemailer
* Rate Limiting

### DevOps & Version Control

* Docker
* Git
* GitHub

## 🏗️ System Overview

```text
                ┌──────────────────┐
                │   React Client   │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │  Express / Node  │
                │    REST APIs     │
                └───────┬──────────┘
                        │
          ┌─────────────┼──────────────┐
          ▼             ▼              ▼
     ┌─────────┐   ┌─────────┐   ┌──────────┐
     │ MongoDB │   │  Redis  │   │  Judge0  │
     │Database │   │Security │   │Execution │
     └─────────┘   └─────────┘   └──────────┘
```

## 🔐 Security & Scalability

The platform includes several mechanisms designed to improve security and system reliability:

* JWT-based authentication
* Token invalidation using Redis
* API rate limiting
* Password reset through verified email
* Controlled code execution through Judge0
* Docker-based development environment

## 🏆 Contest System

The platform includes a contest module where users can:

* Participate in coding contests
* Submit solutions during contests
* Track contest performance
* View competitive progress
* Compete through leaderboards

> 🚧 Contest functionality is currently under active development.

## 🤖 AI-Powered Assistance

Planned AI capabilities include:

* AI-generated hints and suggestions
* Interactive problem-solving mentoring
* AI-powered code analysis
* Personalized guidance based on user mistakes

## 🔮 Future Improvements

* More coding problems
* Advanced contest functionality
* Improved leaderboard system
* WebRTC-based features
* Production deployment
* Performance optimization
* AI mentoring
* AI code analyzer

## 📸 Screenshots

Coming soon.

## 👨‍💻 Author

**Keshav Thakur**

Full-Stack Developer | MCA Student
