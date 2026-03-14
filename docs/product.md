## Product Principle

Single outcome: **turn train delays into claimable money with minimal effort.**

Design constraints:

* one primary action per screen
* minimal navigation
* everything visible immediately
* mobile-first
* claims completed in <30 seconds

Core mental model: **“Inbox of reclaimable delays.”**

---

# Product Structure

**1. Landing**
**2. Account / Sign in**
**3. Route Setup**
**4. Claims Inbox (home screen)**
**5. Claim Flow**
**6. Stats / Social layer**

No complex navigation. Only three tabs.

```
Home
Routes
Profile
```

---

# Landing Page (Pre-login)

Goal: immediate comprehension.

### Above the fold

Headline:

**"Få ersättning när tåget är sent."**

Subtext:

“Lägg in din Movingo-pendling. Vi hittar förseningar och visar vilka du kan få pengar tillbaka för.”

Primary button:

**Kom igång**

Secondary:

**Logga in**

---

### Visual concept

Simple illustration:

Train → clock → money

---

### How it works (3 steps)

1. Lägg in din pendling
2. Vi hittar sena tåg
3. Du kräver ersättning

---

### Social proof section

"Pendlarna har redan krävt tillbaka"

* 2 840 kr återkrävt denna vecka
* 312 sena tåg hittade

Live ticker possible.

---

# Sign-In

Options:

* Email magic link
* Apple
* Google

No password.

---

# First-Time Setup

### Step 1 — Movingo ID

Input:

```
Movingo ID
[__________]
```

Explanation:

“Vi använder detta för att hitta dina tåg.”

---

### Step 2 — Pendling

Two stations.

```
Från
[Stockholm C]

Till
[Uppsala C]
```

Optional:

```
Vanlig avgångstid
[07:42]
```

Button:

**Spara pendling**

---

# Home Screen (Core UX)

This is the entire product.

Title:

**Dina ersättningsbara förseningar**

List of detected delays.

Example card:

```
Stockholm C → Uppsala
12 mars
07:42 avgång

Försenad: 26 min

Ersättning möjlig
≈ 85 kr

[ KRÄV ERSÄTTNING ]
```

If already claimed:

```
✓ Ansökan skickad
```

---

### Claim urgency indicator

```
⚠ Måste krävas inom 30 dagar
```

---

### Empty state

If no delays.

```
Inga ersättningar just nu.

Vi fortsätter bevaka dina tåg.
```

---

# Claim Flow

Tap **KRÄV ERSÄTTNING**

---

### Step 1 — Confirm Train

```
Stockholm → Uppsala
12 mars
07:42

Försening: 26 min
Beräknad ersättning: 85 kr
```

Button:

**Fortsätt**

---

### Step 2 — Personal Data (first claim only)

Form.

```
Förnamn
Efternamn

Personnummer

E-post
Telefon
```

Saved to profile.

Checkbox:

```
Spara uppgifter för framtida ansökningar
```

---

### Step 3 — Submit Claim

Button:

**Skicka ersättningsansökan**

After submission:

```
Ansökan skickad ✓
```

---

# Profile

Simple.

```
Namn
Personnummer
E-post
Telefon
Movingo ID
Pendling
```

Buttons:

* Redigera
* Logga ut

---

# Routes Screen

Users can add additional routes.

Example:

```
Stockholm → Uppsala
07:42

Stockholm → Västerås
17:15
```

Button:

**+ Lägg till pendling**

---

# Social / Shareability Layer

This drives growth.

Add **“Recovered money” counter.**

Example on home:

```
Du har krävt tillbaka

420 kr
```

---

### Leaderboard (optional tab)

Friends leaderboard.

```
Veckans pendlarvinnare

1. Anna — 540 kr
2. Erik — 410 kr
3. Du — 320 kr
```

---

### Share button

After claim:

```
Jag krävde 85 kr tillbaka från ett sent tåg.

Testa själv:
tagersattning.se
```

Share to:

* WhatsApp
* Messenger
* iMessage

---

# Viral Feature

**Delay Streak**

```
Du har hittat ersättning
3 dagar i rad
```

---

# Notification Strategy

Push notifications.

Examples:

```
Ditt tåg igår var 24 min sent.

Du kan kräva ersättning.
```

---

# Retention Loop

Daily cron:

Check trains → detect delay → push notification.

User opens app → sees **claimable card** → taps claim.

---

# Visual Identity

Color palette.

Primary:

Deep blue
Trust + infrastructure.

Accent:

Yellow
Rail / warning / delay.

Background:

Light grey.

---

Typography.

Clean Nordic.

Examples:

* Inter
* Circular
* SF Pro

---

# Key UX Rules

1. Home screen always shows **money opportunity**
2. Claim in **three taps**
3. Everything understandable in **five seconds**
4. No dashboards
5. No analytics screens
6. No unnecessary features

---

# Product Hook

Users do not open the app to **check trains**.

They open it to **get money back**.

Everything must reinforce that outcome.
