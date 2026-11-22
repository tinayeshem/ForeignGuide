# 🧪 Test cases – Parent Guide / Przewodnik Rodzica ZUS

**Demo:** https://teamtina.vercel.app · login details: see [README.md](README.md)

Each test lists what to enter and the expected result. Amounts are gross, per month.

---

## 1. Language

| Test | Steps | ✅ Expected |
|---|---|---|
| 1.1 | Open the app | Login screen in **Polish** |
| 1.2 | Click 🇬🇧 **EN**, then 🇵🇱 **PL** | Login, navigation, home page and calculator switch language; the choice is remembered after reload |

## 2. Calculator (Kalkulator)

Start from the default form (birth, 1 child) for each test.

| Test | Input | ✅ Expected |
|---|---|---|
| 2.1 Basic | Mother: gross salary **8000** | Benefit base **6 903,20 zł** (8000 − 13.71%) · maternity **6 903,20 zł** (100%) · parental **4 832,24 zł** (70%) |
| 2.2 Father | Father: gross salary **6000** | Base **5 177,40 zł** · paternity **5 177,40 zł** · parental **3 624,18 zł** |
| 2.3 81.5% option | 2.1 + tick **81.5% option** | Mother's rates **81,5%**, maternity **5 626,11 zł**, warning that the father still takes parental weeks |
| 2.4 Transfer limit | Father takes over **10** maternity weeks | Warning: at most **6** weeks (20 − 14 personal weeks) |
| 2.5 Part-time work | Mother works **50%** on parental leave | Parental leave **32 → 64 weeks**, monthly amount halved, total unchanged |
| 2.6 Twins | Children: **2** | Maternity leave **31 weeks**, parental leave **43 weeks** in total |
| 2.7 Adoption age | Adoption, child aged **15** | Warning: leave only for a child up to **14** |

Also visible: the timeline "who is at home, and when" and the total amount counting up.

## 3. Sample cases (Sprawy)

| Test | Steps | ✅ Expected |
|---|---|---|
| 3.1 | Open **"Demo: employee, 1 child"** in the calculator | Green banner: matches ZUS, **6 903,20 zł / month** |
| 3.2 | Open **"Demo: contract ended before birth"** | Green banner: ZUS refused and the calculator shows no benefit |

## 4. Benefits in pregnancy (Ciąża)

| Test | Input | ✅ Expected |
|---|---|---|
| 4.1 Waiting period | Employment contract · insured since **2026-11-01** · sick leave **2026-11-22** · **8000** | **"Not yet – 9 more days"** (30-day waiting period) |
| 4.2 Eligible | Same, insured since **2026-01-01** | Eligible, **6 903,20 zł / month** (100%, code "B") |
| 4.3 Unpaid contributions | Own business + "unpaid contributions" | Warning: no benefit until the debt is paid |

## 5. My ZUS (simulation, fictional data)

| Test | Steps | ✅ Expected |
|---|---|---|
| 5.1 | Choose **Anna** → Log in with mObywatel → confirm | Insured today, 2 e-ZLA with code "B" |
| 5.2 | Anna → Certificates → Request | Certificate issued |
| 5.3 | Anna → Applications → ZAM, fill in, send | Confirmation with a **UPO number** |
| 5.4 | Log out → **Marta** | Not insured; certificate **refused** (debt); warning on the ZAM form |

## 6. Admin panel

| Test | Steps | ✅ Expected |
|---|---|---|
| 6.1 | Admin → Parameters → **Rate – parental leave 70 → 75** → Save | "Saved"; the calculator shows **75%** immediately |
| 6.2 | Set it back to **70** | Calculator back to 70% |
| 6.3 | Log in with a non-admin account, open `/admin` | **Admin only** – no access |

**Please set any changed parameter back to its original value.**

## 7. Responsive design

| Test | Steps | ✅ Expected |
|---|---|---|
| 7.1 | Open on a phone, or F12 → Ctrl + Shift + M | Navigation becomes a **☰ menu**; tiles in one column |
