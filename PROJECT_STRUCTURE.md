# 📋 TestLoom Project Structure

```
TestLoom/
├── .DS_Store
├── .editorconfig
├── .env.example
├── .eslintrc.js
├── .git/                       # Git repository data
├── .github/
│   └── workflows/              # GitHub Actions workflows (ci.yml, deploy.yml)
├── .gitignore
├── .husky/                     # Git hooks
├── .node-version
├── .nvmrc
├── .prettierrc.js
├── .vscode/                    # VS Code settings
├── PROJECT_STRUCTURE.md        # This file
├── README.md
├── commitlint.config.js
├── docker/
│   ├── backend.Dockerfile
│   ├── docker-compose.yml
│   └── frontend.Dockerfile
├── docs/
│   ├── README.md
│   ├── architecture.md
│   ├── database-schema.md
│   ├── logo.jpg
│   ├── api/
│   │   ├── authentication.md
│   │   ├── ocr.md
│   │   └── quizzes.md
│   ├── diagrams/
│   │   ├── core-architecture.png
│   │   └── user-flow.md
│   └── integrations/
│       ├── auth.md
│       ├── ocr.md
│       └── websockets.md
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── scripts/
│   └── build.sh
├── tests/
│   └── e2e/
│       └── playwright.config.ts
├── tsconfig.base.json
└── packages/
    ├── backend/
    │   ├── .env
    │   ├── README.md
    │   ├── node_modules/
    │   ├── package.json
    │   ├── pnpm-lock.yaml
    │   └── src/
    │       ├── config/
    │       │   ├── database.js
    │       │   └── env.validation.js
    │       ├── controllers/
    │       │   └── authController.js
    │       ├── db/
    │       │   ├── migrations/   
    │       │   └── seeds/        
    │       ├── index.js
    │       ├── middleware/
    │       │   ├── auth.js
    │       │   └── validation.js
    │       ├── models/
    │       │   └── userModel.js
    │       └── routes/
    │           ├── adminRoutes.js
    │           └── authRoutes.js
    ├── common/
    │   ├── index.js
    │   ├── node_modules/
    │   ├── package.json
    │   └── src/
    │       ├── types/
    │       │   └── index.ts
    │       ├── utils/           
    │       └── validation/      
    └── frontend/
        ├── .data/
        ├── app.vue
        ├── assets/
        │   └── css/
        │       └── main.css
        ├── content/
        │   └── index.md
        ├── content.config.ts
        ├── eslint.config.mjs
        ├── node_modules/
        ├── nuxt.config.ts
        ├── package.json
        ├── pages/
        │   ├── dashboard.vue
        │   ├── index.vue
        │   ├── login.vue
        │   └── signup.vue
        ├── pnpm-lock.yaml
        ├── public/
        │   ├── apple-touch-icon-precomposed.png
        │   ├── apple-touch-icon.png
        │   ├── favicon.ico
        │   └── robots.txt
        └── tailwind.config.js
```

---
