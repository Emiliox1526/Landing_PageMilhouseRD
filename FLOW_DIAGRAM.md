# Flow Diagram - Admin Authentication & Hero Configuration

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER AUTHENTICATION FLOW                      │
└─────────────────────────────────────────────────────────────────┘

START
  │
  ├──► User visits any page (index.html, admin.html, etc.)
  │    │
  │    ├──► includeHeader.js loads
  │    │    │
  │    │    ├──► Check localStorage.isAdmin
  │    │    │    │
  │    │    │    ├─── FALSE ──► Hide Admin button (add d-none class)
  │    │    │    │              Show login link in footer
  │    │    │    │
  │    │    │    └─── TRUE ──► Show Admin button (remove d-none class)
  │    │    │                   Setup logout event listener
  │    │    │
  │    │    └──► Log status: [Header] isAdmin status: true/false
  │    │
  │    └──► Page renders with appropriate visibility
  │
  ├──► User clicks "Acceso administrador" in footer
  │    │
  │    └──► Navigate to /login.html
  │         │
  │         ├──► User enters credentials
  │         │    (1834jml@gmail.com / Desiree2009)
  │         │
  │         ├──► If VALID:
  │         │    │
  │         │    ├──► localStorage.setItem('isAdmin', 'true')
  │         │    ├──► Show success message
  │         │    └──► Redirect to /index.html
  │         │
  │         └──► If INVALID:
  │              │
  │              └──► Show error message
  │                   Clear password field
  │
  ├──► User navigates with active session
  │    │
  │    └──► All pages show Admin button in header
  │
  ├──► User clicks Admin → Cerrar sesión
  │    │
  │    ├──► console.log('[Header] Cerrando sesión...')
  │    ├──► localStorage.removeItem('isAdmin')
  │    └──► window.location.href = '/index.html'
  │         │
  │         └──► Page reloads
  │              │
  │              └──► isAdmin = false → Admin button hidden
  │
END
```

---

## Hero Configuration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   HERO CONFIGURATION FLOW                        │
└─────────────────────────────────────────────────────────────────┘

START (User must be logged in as admin)
  │
  ├──► Navigate to /admin.html
  │    │
  │    ├──► Click "Crear propiedad" or edit existing property
  │    │    │
  │    │    └──► Property modal opens
  │    │         │
  │    │         ├──► Fill basic property info (title, type, price, etc.)
  │    │         │
  │    │         ├──► Scroll to "Configuración de Hero" section
  │    │         │    │
  │    │         │    ├──► Check "Mostrar esta propiedad como imagen principal"
  │    │         │    │    (sets isHeroDefault = true)
  │    │         │    │
  │    │         │    ├──► (Optional) Enter custom heroTitle
  │    │         │    │    - If empty: uses property.title
  │    │         │    │
  │    │         │    └──► (Optional) Enter custom heroDescription
  │    │         │         - If empty: uses location string
  │    │         │
  │    │         ├──► Upload property images
  │    │         │    (first image becomes hero background)
  │    │         │
  │    │         └──► Click "Guardar Propiedad"
  │    │              │
  │    │              ├──► POST/PUT to /api/properties
  │    │              │    {
  │    │              │      title: "...",
  │    │              │      isHeroDefault: true,
  │    │              │      heroTitle: "Custom Title",
  │    │              │      heroDescription: "Custom Desc",
  │    │              │      images: [...],
  │    │              │      ...
  │    │              │    }
  │    │              │
  │    │              └──► Backend saves to MongoDB
  │    │                   │
  │    │                   └──► Success → Modal closes
  │    │
  │    └──► Navigate to /index.html
  │         │
  │         ├──► index.js loads
  │         │    │
  │         │    ├──► Fetch properties from /api/properties
  │         │    │
  │         │    ├──► Filter: heroDefault = find(p => p.isHeroDefault === true)
  │         │    │
  │         │    ├──► Build slides array:
  │         │    │    if (heroDefault):
  │         │    │      slides = [heroDefault, ...other5Recent]
  │         │    │    else:
  │         │    │      slides = [6MostRecent]
  │         │    │
  │         │    └──► For each slide:
  │         │         const title = p.heroTitle || p.title
  │         │         const desc = p.heroDescription || getLocation(p)
  │         │         const img = p.images[0]
  │         │         
  │         │         Render hero slide with:
  │         │         - Background image
  │         │         - Title overlay
  │         │         - Description overlay
  │         │         - "Ver Propiedad" button
  │         │
  │         └──► Hero slider shows with custom configuration
  │
END
```

---

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                   COMPONENT INTERACTIONS                         │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│              │         │              │         │              │
│  header.html │◄────────│includeHeader │────────►│localStorage  │
│              │  loads  │     .js      │ checks  │  .isAdmin    │
│              │         │              │         │              │
└──────┬───────┘         └──────────────┘         └──────────────┘
       │                                                   ▲
       │ contains                                          │
       ▼                                                   │ sets
┌──────────────┐                                   ┌──────┴───────┐
│              │                                   │              │
│ adminDropdown│                                   │  login.js    │
│  (d-none)    │                                   │              │
│              │                                   └──────────────┘
└──────┬───────┘
       │
       │ when visible, contains
       ▼
┌──────────────┐         ┌──────────────┐
│              │  click  │              │
│  logoutBtn   │────────►│ Logout Logic │
│              │         │              │
└──────────────┘         └──────┬───────┘
                                │
                                │ removes
                                ▼
                         ┌──────────────┐
                         │ localStorage │
                         │   .isAdmin   │
                         └──────────────┘


┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│              │         │              │         │              │
│  admin.html  │────────►│  admin.js    │────────►│ /api/        │
│  (form)      │ submit  │  (handler)   │  POST   │ properties   │
│              │         │              │   PUT   │              │
└──────────────┘         └──────────────┘         └──────┬───────┘
                                                          │
                                                          │ saves to
                                                          ▼
                                                   ┌──────────────┐
                                                   │   MongoDB    │
                                                   │  Property    │
                                                   │ Collection   │
                                                   └──────┬───────┘
                                                          │
                                                          │ fetched by
                                                          ▼
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│              │         │              │  GET    │              │
│  index.html  │────────►│  index.js    │────────►│ /api/        │
│  (hero)      │ loads   │ (displays)   │         │ properties   │
│              │         │              │         │              │
└──────────────┘         └──────────────┘         └──────────────┘
```

---

## File Structure

```
Landing_PageMilhouseRD/
│
├── src/main/
│   ├── java/edu/pucmm/
│   │   ├── model/
│   │   │   └── Property.java ────────────► Contains hero fields:
│   │   │                                    - isHeroDefault
│   │   │                                    - heroTitle
│   │   │                                    - heroDescription
│   │   │
│   │   └── controller/
│   │       └── PropertyController.java ───► Handles CRUD operations
│   │
│   └── resources/public/
│       ├── includes/
│       │   ├── header.html ──────────────► Contains adminDropdown
│       │   └── footer.html ──────────────► Contains login link
│       │
│       ├── js/
│       │   ├── includeHeader.js ─────────► Manages visibility & logout
│       │   ├── login.js ─────────────────► Handles authentication
│       │   ├── admin.js ─────────────────► Property management
│       │   └── index.js ─────────────────► Hero display logic
│       │
│       ├── index.html ───────────────────► Home page with hero
│       ├── login.html ───────────────────► Login form
│       └── admin.html ───────────────────► Admin panel
│
├── ADMIN_FIXES_DOCUMENTATION.md ─────────► Complete guide
├── TEST_SUMMARY.md ──────────────────────► Test scenarios
├── IMPLEMENTATION_SUMMARY.md ────────────► Executive summary
├── SECURITY_REVIEW.md ───────────────────► Security analysis
└── FLOW_DIAGRAM.md (this file) ──────────► Visual flows
```

---

## State Transitions

```
┌─────────────────────────────────────────────────────────────────┐
│                      STATE MACHINE                               │
└─────────────────────────────────────────────────────────────────┘

State: NOT_AUTHENTICATED
┌──────────────────────┐
│ isAdmin = false      │
│ Admin button: HIDDEN │
│ Login link: VISIBLE  │
└──────────────────────┘
         │
         │ [Login Success]
         │ localStorage.setItem('isAdmin', 'true')
         ▼
┌──────────────────────┐
│ State: AUTHENTICATED │
├──────────────────────┤
│ isAdmin = true       │
│ Admin button: SHOWN  │
│ Login link: VISIBLE  │
└──────────────────────┘
         │
         │ [Logout Clicked]
         │ localStorage.removeItem('isAdmin')
         │ Redirect to /index.html
         ▼
┌──────────────────────┐
│ State: LOGGED_OUT    │
├──────────────────────┤
│ isAdmin = false      │
│ Admin button: HIDDEN │
│ Login link: VISIBLE  │
└──────────────────────┘
         │
         │ (loops back to NOT_AUTHENTICATED)
         └───────────────────────────────────────┐
                                                 │
         ┌───────────────────────────────────────┘
         ▼
State: NOT_AUTHENTICATED
```

---

## Hero Display Logic

```
┌─────────────────────────────────────────────────────────────────┐
│                    HERO SLIDER LOGIC                             │
└─────────────────────────────────────────────────────────────────┘

1. Fetch all properties from /api/properties
   │
   ▼
2. Filter properties:
   heroDefault = properties.find(p => p.isHeroDefault === true)
   others = properties.filter(p => p.isHeroDefault !== true)
   │
   ▼
3. Sort others by createdAt (most recent first)
   │
   ▼
4. Build slides array:
   │
   ├─── IF heroDefault exists:
   │    slides = [
   │      heroDefault,          // 1st slide (hero)
   │      ...others.slice(0, 5) // Next 5 most recent
   │    ]
   │    Total: 6 slides
   │
   └─── ELSE:
        slides = [
          ...others.slice(0, 6) // 6 most recent
        ]
        Total: 6 slides
   │
   ▼
5. For each slide in slides:
   │
   ├─── Get display data:
   │    title = slide.heroTitle || slide.title
   │    description = slide.heroDescription || getLocation(slide)
   │    image = slide.images[0] || placeholder
   │
   ├─── Create slide HTML:
   │    <div class="hero-slide">
   │      <img src="${image}" />
   │      <div class="hero-overlay">
   │        <h1>${title}</h1>
   │        <p>${description}</p>
   │        <a href="/property.html?id=${id}">Ver Propiedad</a>
   │      </div>
   │    </div>
   │
   └─── Append to hero carousel
   │
   ▼
6. Initialize carousel with navigation dots
   │
   ▼
7. DONE - Hero slider ready with auto-rotation
```

---

## Debugging Checklist

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEBUGGING GUIDE                               │
└─────────────────────────────────────────────────────────────────┘

□ Open Browser Developer Tools (F12)

□ Check Console Tab for:
  ├─ [Header] isAdmin status: true/false
  ├─ [Header] Cerrando sesión...
  └─ Any JavaScript errors

□ Check Application Tab → Local Storage:
  ├─ Key: isAdmin
  └─ Value: "true" (when logged in) or null (when logged out)

□ Check Network Tab:
  ├─ GET /includes/header.html (should return 200)
  ├─ GET /api/properties (should return 200 with JSON)
  ├─ POST /api/properties (when saving) (should return 200/201)
  └─ PUT /api/properties/:id (when updating) (should return 200)

□ Check Elements Tab:
  ├─ Find <li id="adminDropdown">
  ├─ When NOT logged in: should have class "d-none"
  └─ When logged in: should NOT have class "d-none"

□ Test Login Flow:
  ├─ Visit /login.html
  ├─ Enter: 1834jml@gmail.com / Desiree2009
  ├─ Click "Entrar"
  ├─ Check console for success message
  ├─ Check localStorage.isAdmin = "true"
  └─ Check redirect to /index.html

□ Test Logout Flow:
  ├─ With active session, click "Admin" button
  ├─ Click "Cerrar sesión"
  ├─ Check console: [Header] Cerrando sesión...
  ├─ Check localStorage.isAdmin = null
  └─ Verify Admin button is hidden

□ Test Hero Configuration:
  ├─ Login as admin
  ├─ Go to /admin.html
  ├─ Create/edit property
  ├─ Check "Mostrar esta propiedad como imagen principal"
  ├─ Fill heroTitle and heroDescription
  ├─ Save property
  ├─ Visit /index.html
  └─ Verify property appears first in hero slider

□ Test Responsive Design:
  ├─ Test on desktop (>= 992px)
  ├─ Test on tablet (768-991px)
  └─ Test on mobile (< 768px)
```

---

## Quick Reference Commands

```bash
# Build the project
./gradlew build

# Run tests
./gradlew test --no-daemon

# Check JavaScript syntax
node -c src/main/resources/public/js/includeHeader.js
node -c src/main/resources/public/js/login.js
node -c src/main/resources/public/js/admin.js

# Run the application
./gradlew run

# Access in browser
http://localhost:7070/

# View logs
tail -f logs/application.log
```

---

**Document:** FLOW_DIAGRAM.md  
**Version:** 1.0  
**Date:** December 22, 2025  
**Status:** Complete
