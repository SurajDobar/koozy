# CompileFuture Development Skill

## Purpose

This skill defines the AI-assisted development methodology used for Koozy.

It is based on the CompileFuture website-building workflow and is intended to guide:
- Astro development
- SEO-first development
- AI-assisted implementation
- UI/design quality
- responsive web development
- deployment preparation
- technical SEO
- verification and iteration

This skill is a DEVELOPMENT METHODOLOGY, not a replacement for Koozy's project-specific rules.

---

# 1. RULE HIERARCHY

Always follow this priority:

1. Existing Koozy project requirements and architecture
2. `AI_Agent_Rules/`
3. `.agents/AGENTS.md`
4. This CompileFuture skill
5. General AI assumptions

Never use this skill to invent product requirements.

If this skill conflicts with an existing Koozy rule, follow the Koozy rule.

If a requirement is unclear, inspect the existing project before making assumptions.

---

# 2. CORE DEVELOPMENT PHILOSOPHY

Build real, useful, production-quality software rather than demonstrations.

The preferred workflow is:

1. Understand the existing project.
2. Understand the user's actual goal.
3. Inspect the current architecture before changing it.
4. Plan the smallest correct implementation.
5. Use AI-assisted development to accelerate implementation.
6. Preserve existing functionality.
7. Test the result.
8. Inspect the actual browser output.
9. Fix problems iteratively.
10. Commit meaningful changes regularly.

Do not make large speculative changes simply because they are technically possible.

Prefer incremental, reversible changes.

---

# 3. EXISTING PROJECT FIRST

Before changing Koozy:

- Inspect the repository structure.
- Read the relevant project rules.
- Inspect existing components and routes.
- Inspect existing backend APIs.
- Inspect authentication.
- Inspect WebSocket architecture.
- Inspect existing tests.
- Understand how the current frontend is built and served.
- Identify what is already working.

Do not recreate functionality that already exists.

Do not replace working architecture merely because another framework could do the same thing differently.

Every migration must preserve existing behavior unless the user explicitly requests a behavior change.

---

# 4. ASTRO METHODOLOGY

When Astro is used:

- Prefer Astro's native capabilities for static/public presentation.
- Prefer semantic HTML and server-rendered content where possible.
- Avoid unnecessary client-side JavaScript.
- Use React islands only where browser interactivity actually requires React.
- Do not turn the entire application into a React island without a reason.
- Keep interactive functionality isolated from static presentation where practical.
- Prefer multi-page architecture for public/SEO-oriented pages.
- Use the latest official Astro documentation when implementing Astro features.
- If an Astro documentation MCP or equivalent official documentation source is available, consult it instead of relying on potentially outdated model knowledge.

Astro should improve the presentation and SEO architecture without breaking Koozy's backend.

---

# 5. REACT ISLANDS

React should remain where it provides real value.

Good candidates include:

- WebSocket-driven interfaces
- live quiz gameplay
- timers and countdowns
- interactive host controls
- quiz authoring
- forms requiring substantial client-side state
- AI generation interfaces
- participant state
- browser storage interactions

Do not hydrate static content unnecessarily.

Use the least client-side JavaScript necessary for the page to function.

Before choosing `client:load`, `client:idle`, `client:visible`, or `client:only`, understand the component's requirements.

Browser-only APIs such as:

- `window`
- `document`
- `localStorage`
- `sessionStorage`
- `WebSocket`

must not be accessed during server rendering.

---

# 6. DESIGN SYSTEM METHODOLOGY

Design quality is part of implementation quality.

Before creating or substantially modifying UI:

- Inspect the existing Koozy visual identity.
- Follow existing design decisions.
- Use the project's design documentation if available.
- Follow established web-design guidelines.
- Keep spacing, typography, hierarchy, interaction states, and responsive behavior consistent.

If `DESIGN.md` exists, treat it as a design authority.

Do not blindly copy competitor websites.

Competitor research may be used to understand:
- features
- information architecture
- usability problems
- missing functionality
- common patterns

Do not copy:
- visual identity
- branding
- proprietary assets
- exact layouts
- exact copy
- distinctive UI implementations

The goal is to learn from the market while producing an independent Koozy interface.

---

# 7. TAILWIND CSS

Koozy currently uses Tailwind CSS.

When using Tailwind:

- Use the version actually installed in the project.
- Follow current Tailwind documentation for that version.
- Do not blindly apply Tailwind v3 conventions to Tailwind v4.
- Reuse existing design tokens and utilities where possible.
- Avoid unnecessary custom CSS when Tailwind already provides the required behavior.
- Avoid introducing a second styling methodology without a reason.
- Keep responsive behavior intentional rather than patching individual breakpoints repeatedly.

If a Tailwind documentation skill is available, use it for version-specific implementation details.

---

# 8. SEO-FIRST DEVELOPMENT

SEO should be designed into public pages rather than added as an afterthought.

For every genuinely public/indexable page, consider:

- unique `<title>`
- useful meta description
- canonical URL
- Open Graph metadata
- Twitter/social metadata where appropriate
- semantic HTML
- descriptive headings
- descriptive links
- image `alt` text
- clean URLs
- structured data where appropriate
- sitemap inclusion
- appropriate robots directives
- mobile responsiveness
- performance

Do not add SEO content simply to increase word count.

Content should help the user understand or use the product.

---

# 9. INDEXING RULES

Only pages that genuinely provide useful public content should be indexable.

Private application functionality should generally use appropriate `noindex` protection.

Examples of pages that may require non-indexing:

- authenticated host dashboards
- private quiz authoring
- private results
- live game/session screens
- temporary participant states
- API endpoints
- authentication callback routes where appropriate

Do not assume that every technically accessible page should appear in search engines.

Do not use `robots.txt` as the only mechanism for preventing indexing.

Use appropriate `noindex` directives for pages that should not be indexed.

`robots.txt` controls crawling behavior; it should not be treated as a universal indexing security mechanism.

---

# 10. TITLE AND META DESCRIPTION

Every important public page should have a meaningful, unique title.

Titles should:
- describe the actual page
- be concise
- help users understand what they will find
- avoid keyword stuffing

Meta descriptions should:
- accurately describe the page
- be useful to searchers
- naturally include relevant terminology when appropriate
- never be generated purely for keyword density

Do not create fake or misleading metadata.

---

# 11. STRUCTURED DATA

Use Schema.org structured data only when it genuinely describes the visible page content.

Examples may include:
- WebApplication
- SoftwareApplication
- FAQPage
- BreadcrumbList
- other appropriate schema types

Rules:

- Structured data must represent the actual page.
- Do not fabricate ratings, reviews, prices, authors, or other information.
- Do not add schema simply because it exists.
- Validate structured data after implementation.
- Keep structured data synchronized with visible content.

FAQ structured data may be used when the page genuinely contains the corresponding FAQ content.

---

# 12. FAQ CONTENT

When an FAQ section is appropriate:

1. Identify real user questions.
2. Use questions relevant to the page/topic.
3. Write direct, useful answers.
4. Avoid keyword stuffing.
5. Keep answers factually accurate.
6. Use structured data only when the visible FAQ supports it.

Potential sources for discovering questions include:
- keyword research tools
- search suggestions
- relevant user questions
- existing support questions
- competitor research

Do not manufacture FAQs purely for SEO.

---

# 13. KEYWORD RESEARCH

For SEO-focused work, keyword research can be used to understand what users actually search for.

Useful research sources include:
- Ahrefs Keyword Generator
- Google search suggestions
- Google "People also ask"
- competitor pages
- actual user questions

Consider:

- primary topic/keyword
- related terminology
- supporting queries
- long-tail questions
- search intent

Do not force keywords unnaturally into content.

Search volume is an input, not a guarantee of traffic or rankings.

Never promise a specific ranking position.

---

# 14. SEO CONTENT

Public pages should contain enough useful textual content for users and search engines to understand the page.

However:

- Do not add meaningless paragraphs.
- Do not create AI-generated filler.
- Do not repeat keywords excessively.
- Do not write content solely because a specific word count was suggested.
- Prefer useful explanations, instructions, examples, FAQs, and product context.

AI may assist with content creation, but the final content must be relevant, accurate, and useful.

---

# 15. LEGAL AND TRUST PAGES

For a production-facing website, consider appropriate pages such as:

- Privacy Policy
- Terms & Conditions
- About
- Contact

These pages should be:
- accessible
- linked appropriately
- written specifically for the actual product
- consistent with the product's real behavior

Never invent legal claims.

Never claim compliance with a law, regulation, or policy unless verified.

---

# 16. ERROR PAGES

Production websites should have appropriate error handling.

Where supported, provide custom:

- 404 page
- 500/error page

Error pages should:
- match the product's design
- clearly explain the problem
- provide useful navigation back into the site
- avoid exposing sensitive implementation details

---

# 17. ROBOTS.TXT AND SITEMAP

Provide a `robots.txt` appropriate to the final production architecture.

Where appropriate:

- reference the sitemap
- avoid unnecessary crawl paths
- do not expose private implementation details
- do not treat robots.txt as access control

Generate `sitemap.xml` for legitimate public/indexable pages.

Do not include:
- private dashboards
- authenticated application pages
- temporary live sessions
- API routes
- pages intentionally marked `noindex`

The sitemap should reflect the actual production site.

---

# 18. DOMAIN CONFIGURATION

Never hardcode an unconfirmed production domain.

Use configuration/environment variables for:

- site URL
- canonical URL
- sitemap URL
- API URL where required
- WebSocket URL where required
- deployment-specific values

A placeholder or currently discussed domain must not automatically become the production domain.

The final production domain is a deployment decision.

---

# 19. OPEN GRAPH / SOCIAL SHARING

Public pages should have appropriate social metadata where useful.

Consider:

- `og:title`
- `og:description`
- `og:url`
- `og:type`
- `og:image`

Also provide appropriate Twitter/X metadata where relevant.

Images should:
- represent the actual page
- have appropriate dimensions
- not mislead users
- not expose private information

Dynamic OG image generation is optional and should not be introduced unless it provides a real benefit.

---

# 20. ANALYTICS

Analytics may be added when the product requires usage measurement.

Before adding analytics:

- ensure the implementation matches the actual deployment
- keep tracking code centralized
- avoid duplicate tracking
- do not expose secrets
- respect applicable privacy requirements
- avoid tracking private application data unnecessarily

Analytics is a measurement tool, not a reason to collect unnecessary user data.

---

# 21. ADSENSE / MONETIZATION PREPARATION

If the product is eventually monetized with advertising:

Prepare the site for a trustworthy user experience.

Consider:

- privacy policy
- terms
- about/contact information
- clear navigation
- original useful content
- responsive design
- mobile usability
- non-deceptive ad placement
- appropriate consent/privacy handling where applicable
- compliance with the current publisher policies

Do not build the product around ads unless explicitly required.

Do not:
- encourage users to click ads
- place ads where they can be mistaken for controls
- create fake content for advertising traffic
- generate large amounts of low-value content purely for SEO/ads

AdSense approval and revenue are never guaranteed.

Always verify current Google policies before implementation.

---

# 22. DEPLOYMENT METHODOLOGY

Deployment should be selected based on the application's actual architecture.

For simple static Astro sites, Cloudflare Pages may be appropriate.

For applications requiring:
- server-side rendering
- APIs
- authentication
- database access
- WebSockets
- backend processes

the deployment architecture must account for those requirements.

Do not force a static hosting model onto a full-stack application.

Do not assume Cloudflare Pages alone can replace Koozy's Django backend.

Koozy's deployment architecture must preserve:
- Django
- ASGI/Daphne
- WebSockets
- authentication
- database access
- frontend routing

---

# 23. CLOUDFARE PAGES / WORKERS CONSIDERATIONS

Cloudflare may be used for the Astro/public layer if appropriate.

Before deployment:

- determine whether Astro is static or SSR
- determine whether a Node/Cloudflare adapter is required
- determine how Django is hosted
- determine how `/api/*` routes are handled
- determine how `/ws/*` routes are handled
- determine how authentication cookies behave
- determine how the production domain is routed

Do not configure deployment infrastructure blindly.

The final deployment architecture must be explicitly verified before production migration.

---

# 24. PAGES.DEV / PREVIEW DOMAINS

If a Cloudflare Pages deployment creates an additional public deployment hostname, consider whether that hostname should be indexed.

If the canonical production domain and preview/deployment domain serve the same content, configure appropriate indexing controls.

Do not assume a `_headers` configuration is universally correct without verifying the actual hosting platform and response headers.

Always test the resulting HTTP headers in the deployed environment.

---

# 25. AUTHENTICATION

Never break existing authentication while migrating the frontend.

Verify:

- login
- logout
- OAuth redirects
- callback handling
- session cookies
- cookie scope
- SameSite behavior
- secure cookie behavior in production
- authenticated API requests

Do not expose credentials or secrets in frontend code.

Environment variables containing secrets must remain server-side.

---

# 26. WEBSOCKETS

Koozy's live functionality depends on WebSockets.

Any Astro migration must preserve the existing WebSocket architecture.

Verify:

- connection establishment
- reconnect behavior where applicable
- lobby updates
- player admission
- player removal
- game state broadcasts
- timers
- quiz termination
- result delivery
- multi-device synchronization

Never replace WebSockets with polling simply to simplify the Astro migration unless explicitly requested.

---

# 27. BACKEND PRESERVATION

Django remains authoritative for:

- business rules
- database operations
- authentication
- API behavior
- AI generation
- quiz state
- live-session state
- permissions
- validation

Astro must not duplicate backend business logic unnecessarily.

Frontend validation may improve UX, but backend validation remains authoritative.

---

# 28. AI DEVELOPMENT WORKFLOW

AI coding should be treated as an accelerated development process, not autonomous authority.

Before asking an AI agent to implement something:

1. Give it the relevant project context.
2. Give it the relevant rules.
3. Define the scope.
4. Identify constraints.
5. Tell it what must not change.
6. Ask it to inspect before modifying.

For large migrations:

- plan first
- review the plan
- implement in phases
- verify each phase
- do not allow the agent to jump ahead

Never let an AI agent silently invent requirements.

---

# 29. PROMPTING METHODOLOGY

Good implementation prompts should contain:

- current state
- desired result
- constraints
- relevant files/rules
- explicit exclusions
- verification requirements

Prefer:

"Inspect the current implementation, then make this specific change while preserving X, Y and Z."

Avoid vague prompts such as:

"Improve the whole website."

For major work, request a plan before implementation.

---

# 30. ITERATIVE DEVELOPMENT

After implementation:

1. Start the development server.
2. Open the actual website.
3. Test the changed functionality.
4. Inspect the browser console.
5. Inspect network requests when relevant.
6. Test responsive layouts.
7. Test the affected backend/API behavior.
8. Run automated tests.
9. Fix discovered issues.
10. Re-test.

Do not assume that successful compilation means successful implementation.

---

# 31. MOBILE RESPONSIVENESS

Every public-facing UI should be tested on mobile dimensions.

Check:

- navigation
- buttons
- forms
- typography
- cards
- spacing
- modals
- tables
- live quiz interfaces
- touch targets
- horizontal overflow

Do not treat mobile responsiveness as an optional polish step.

---

# 32. PERFORMANCE

Prefer:

- minimal client JavaScript
- optimized assets
- semantic HTML
- appropriate image sizes
- lazy loading where appropriate
- limited hydration
- efficient network requests
- caching where appropriate

Do not optimize prematurely.

Measure before making complex performance changes.

---

# 33. ACCESSIBILITY

UI should follow modern accessibility practices.

Consider:

- semantic HTML
- keyboard navigation
- visible focus states
- sufficient contrast
- descriptive labels
- accessible buttons
- form error messages
- appropriate ARIA only when necessary
- meaningful alt text

Do not use ARIA to compensate for incorrect HTML when semantic HTML can solve the problem.

---

# 34. VERSION-AWARE DEVELOPMENT

AI models may know outdated versions of frameworks.

Before implementing framework-specific behavior:

- inspect installed package versions
- consult official documentation when necessary
- avoid assuming APIs from older versions
- verify configuration syntax

This is especially important for:

- Astro
- Tailwind CSS
- React
- Django
- Django Channels
- deployment adapters

---

# 35. GIT AND CHECKPOINTS

Commit meaningful working changes regularly.

Good commit boundaries include:

- Astro foundation
- styling integration
- SEO infrastructure
- individual migration stages
- authentication integration
- WebSocket integration
- deployment configuration

Avoid one enormous commit containing the entire migration.

Before major risky changes, ensure the current working state is recoverable.

---

# 36. TESTING REQUIREMENTS

Every migration must preserve existing tests.

For Koozy:

- run the complete Django test suite
- verify frontend build
- verify relevant lint/type checks if configured
- verify API behavior
- verify authentication
- verify WebSockets
- verify live multiplayer flow
- verify AI quiz generation
- verify SEO output for public pages

A successful build alone is insufficient.

---

# 37. SEO VERIFICATION

After implementing SEO:

Check actual rendered HTML rather than only source code assumptions.

Verify:

- title
- description
- canonical
- robots directives
- Open Graph
- structured data
- sitemap
- robots.txt
- correct production URL
- correct index/noindex behavior

Where appropriate, use search-engine validation tools.

---

# 38. BROWSER VERIFICATION

When changing UI or routing, manually verify the actual browser experience.

Do not rely exclusively on:
- source inspection
- unit tests
- build success
- static analysis

Check real navigation and interaction.

For Koozy specifically, verify complete flows such as:

Host:
- login
- create quiz
- add questions
- AI generation
- launch session
- lobby
- live game
- end game
- results

Participant:
- join by PIN
- enter lobby
- receive live updates
- answer questions
- submit answers
- receive results

---

# 39. MIGRATION SAFETY

During framework migration:

- preserve backend contracts
- preserve API URLs unless intentionally changed
- preserve WebSocket routes
- preserve authentication behavior
- preserve database schema
- preserve existing user flows
- preserve visual identity

Do not combine migration with unrelated feature development.

If a new feature is desired, finish the migration first unless explicitly instructed otherwise.

---

# 40. NO SPECULATIVE FEATURES

Do not add features because they might help SEO or monetization.

Examples of features that require explicit approval:

- public quiz directories
- public quiz indexing
- public quiz APIs
- new database visibility fields
- user profiles for SEO
- dynamic public quiz pages
- multilingual routing
- new monetization systems
- new analytics systems
- new authentication providers

SEO architecture must support the actual product, not invent a different product.

---

# 41. COMPETITOR RESEARCH

Competitor analysis can be useful for understanding:

- feature gaps
- UX problems
- information architecture
- search intent
- content opportunities

When analyzing competitors:

- inspect what users need
- identify weaknesses
- identify opportunities
- build an independent solution

Never copy a competitor's branding, exact UI, assets, content, or implementation.

---

# 42. PRODUCTION READINESS

Before calling a migration complete, verify:

- production build succeeds
- backend tests pass
- frontend build succeeds
- authentication works
- API works
- WebSockets work
- live gameplay works
- mobile layout works
- SEO metadata is correct
- sitemap works
- robots.txt works
- error pages work
- production domain configuration is correct
- secrets are not exposed
- deployment headers behave as intended

---

# 43. KOOZY-SPECIFIC APPLICATION

For the current Koozy Astro migration:

## Current scope

The immediate objective is:

Existing Koozy
→ Astro presentation layer
→ React islands where necessary
→ SEO infrastructure
→ preserve Django backend
→ preserve existing functionality
→ verify everything

Do NOT add a public quiz catalog during this migration.

Do NOT add:
- `Quiz.is_public`
- public quiz APIs
- public quiz detail pages
- public user-generated quiz SEO pages
- unrelated new product features

These may be considered later as separate product decisions.

---

# 44. KOOZY ARCHITECTURE BOUNDARY

Astro:

- presentation
- public HTML
- SEO
- static/public layout
- appropriate routing
- React island mounting

React:

- browser interactivity
- live UI
- authoring UI
- participant UI
- host UI
- stateful components

Django:

- database
- business logic
- REST APIs
- authentication
- OAuth
- AI service
- permissions
- validation

Django Channels / Daphne:

- WebSockets
- real-time state
- multiplayer synchronization

Never blur these responsibilities without a concrete reason.

---

# 45. FINAL PRINCIPLE

The goal is not to use the maximum amount of technology.

The goal is to build the simplest architecture that:

- preserves Koozy's functionality
- improves public-page performance and SEO
- keeps interactive functionality reliable
- produces a polished UI
- remains maintainable
- can be deployed reliably
- can be iterated quickly with AI assistance

Use AI aggressively for implementation speed.

Use human/project rules for direction.

Inspect before changing.

Plan before large migrations.

Implement incrementally.

Verify everything.

Never let AI-generated assumptions become product requirements.