# 👶 Przewodnik Rodzica ZUS – Parent Guide

**HackNation 2026 · Wyzwanie ZUS: „Zasiłkowy Przewodnik Przyszłego Rodzica”**

🔗 **Demo:** https://teamtina.vercel.app
💻 **Repozytorium:** https://github.com/tinayeshem/ForeignGuide
🇬🇧 **English version:** [README.md](README.md)

---

## 📌 O projekcie

Responsywna aplikacja webowa, która pomaga przyszłym rodzicom zrozumieć świadczenia z ZUS: **ile i jak długo** otrzymają zasiłek macierzyński, czy przysługuje im **zasiłek chorobowy w ciąży**, **jakie dokumenty** złożyć i **gdzie**, oraz **jakich terminów** nie przegapić.

Aplikacja działa po **polsku i angielsku** – dla polskich rodzin oraz dla rodziców z zagranicy, którzy pracują i płacą składki w Polsce.

---

## 🧪 Jak testować (dla jury)

| | |
|---|---|
| **Adres** | https://teamtina.vercel.app |
| **Konto jury (administrator)** | `tinayeshe13@gmail.com` / `Simultaneous@2000` |

**Proponowana ścieżka (ok. 5 minut):**

1. **Zaloguj się** – aplikacja otwiera się **po polsku** (przełącznik 🇵🇱 PL / 🇬🇧 EN na górnym pasku).
2. **Kalkulator** – wpisz wynagrodzenie brutto `8000` → podstawa wymiaru `6 903,20 zł`, zasiłek macierzyński `6 903,20 zł / mies.`, rodzicielski `4 832,24 zł / mies.` Sprawdź też: bliźnięta, zaświadczenie „Za życiem”, opcję 81,5%, podział urlopu z ojcem oraz pracę na część etatu w trakcie urlopu rodzicielskiego.
3. **Sprawy (przykładowe przypadki)** – otwórz sprawę w kalkulatorze. Baner porównuje wynik z **decyzją ZUS** (✅ zgodne / ⚠️ różnica).
4. **Ciąża** – sprawdź prawo do zasiłku chorobowego w ciąży (okres wyczekiwania 30 / 90 dni, kto wypłaca, jakie dokumenty).
5. **Mój ZUS (symulacja)** – zaloguj się przez symulowany **mObywatel**, sprawdź ubezpieczenie i e-ZLA, pobierz zaświadczenie o niezaleganiu, wyślij wniosek ZAM.
6. **Admin** – zmień stawkę (np. zasiłek rodzicielski 70 → 75%) i zobacz, że kalkulator od razu ją uwzględnia. Prosimy o przywrócenie wartości.

---

## ✅ Wymagania wyzwania → funkcje aplikacji

| Wymaganie ZUS | Gdzie w aplikacji |
|---|---|
| **a)** Świadczenia w ciąży, warunki, kto wypłaca | **Ciąża** – sprawdzenie prawa do zasiłku (okres wyczekiwania 30 / 90 dni), 100% z kodem „B”, do 270 dni, pracodawca czy ZUS, świadczenie po utracie pracy |
| **b)** Zasiłek macierzyński po porodzie – długość i wysokość | **Kalkulator** – długość urlopu zależnie od liczby dzieci, podstawa wymiaru, kwoty miesięczne i łączne |
| **c)** Adopcja / rodzina zastępcza | **Kalkulator** – tryby adopcji i rodziny zastępczej z limitem wieku dziecka |
| **d)** Urlop ojcowski | **Kalkulator** – 2 tygodnie, 100%, do ukończenia przez dziecko 12 miesięcy |
| **e)** Urlop rodzicielski, podział między rodziców, łączenie z pracą | **Kalkulator** – po 9 tygodni zarezerwowanych dla każdego rodzica, podział urlopu, praca do 50% etatu wydłuża urlop |
| **f)** Opcja 81,5% vs 100% / 70% | **Kalkulator** – jeden wniosek o cały urlop, ostrzeżenie o terminie 21 dni |
| **g)** Dokumenty, terminy, gdzie składać | **Lista zadań** (osobiste terminy z przypomnieniami) + **szczegóły kroków** + formularze w **Mój ZUS** |
| **h)** Ryzyka (umowy pozorne, podwyższanie podstawy, utrata ubezpieczenia) i prawa | **Ryzyka i prawa** |
| **i)** Wsparcie w trudnych sytuacjach | **Wsparcie** – organizacje pomagające przy wcześniactwie, hospicjum perinatalne, strata dziecka; telefon wsparcia w kryzysie |
| **j)** Zintegrowany kalkulator | **Kalkulator** + porównanie z decyzjami ZUS w **Sprawach** |
| Wgranie / wybór przykładowych wniosków | **Sprawy** – wybór sprawy, status ubezpieczenia, porównanie z decyzją ZUS |
| Symulacja: logowanie mObywatel, dane ZUS, e-ZLA, zaświadczenia, wnioski | **Mój ZUS (symulacja)** – wyraźnie oznaczona, fikcyjne dane |
| Panel administratora do zmiany parametrów | **Admin** – stawki, długości urlopów, karty informacyjne; zmiany działają od razu, bez nowej wersji aplikacji |
| Aplikacja responsywna (RWD) | Działa na komputerze, tablecie i telefonie; pasek nawigacji zmienia się w menu ☰ |

---

## ✨ Co nas wyróżnia

- **Osobista lista zadań z terminami i przypomnieniami** – kalkulator mówi, *ile* dostaniesz, a lista zadań pilnuje, żebyś *rzeczywiście to otrzymał(a)* (np. „zostało 21 dni na wybór opcji 81,5%”).
- **Weryfikacja z decyzjami ZUS** – przykładowe sprawy pokazują, czy wynik kalkulatora zgadza się z prawdziwą decyzją.
- **Polski i angielski** – dla polskich rodzin i dla rodziców z zagranicy, którzy płacą składki w Polsce; dodatkowo rozmówki polskie z nagraniem wymowy.
- **Przepisy jako dane, nie kod** – każda stawka i długość urlopu jest zapisana w bazie danych i może zostać zmieniona przez administratora, gdy zmienią się przepisy.

---

## 🏗️ Technologie i architektura

| Warstwa | Technologia |
|---|---|
| Frontend | **React Native + Expo Router**, eksportowane jako **responsywna aplikacja webowa** (react-native-web); ten sam kod działa też na Androidzie i iOS |
| Backend | **Supabase** – PostgreSQL + automatycznie generowane **REST API** (PostgREST) + uwierzytelnianie |
| Bezpieczeństwo | **Row Level Security** na każdej tabeli; uprawnienia administratora sprawdzane w bazie danych (`is_admin()`) |
| Hosting | **Vercel** (wersja webowa) |
| Język | TypeScript |

```
src/
├── app/                 → ekrany (Expo Router)
├── components/          → wspólne elementy UI (nagłówek, karty, animacje)
├── features/            → logika poszczególnych funkcji
│   ├── calculator/      → czysta logika obliczeń (bez UI, łatwa do testowania)
│   ├── pregnancy/
│   ├── cases/
│   ├── admin/
│   └── ...
├── i18n/                → tłumaczenia PL / EN
└── lib/supabase.ts      → klient bazy danych
```

**Tabele w bazie:** `benefit_parameters`, `sample_cases`, `info_cards`, `steps`, `phrases`, `profiles`, `user_progress`, `admins`.

---

## 🚀 Uruchomienie lokalne

```bash
git clone https://github.com/tinayeshem/ForeignGuide.git
cd ForeignGuide/expat-parent
npm install
```

Utwórz plik `.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://lfkcslaqcobzcgxmsgre.supabase.co/rest/v1/
EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_90DrCR5ZnnM7irn5SbbAXw_1Oy0zwmp
```

```bash
npx expo start --web
```

Budowanie i publikacja wersji webowej:

```bash
npx expo export --platform web
npx vercel deploy dist --prod
```

---

## 🤖 Wykorzystanie AI (oświadczenie)

- **Aplikacja nie zawiera funkcji opartych na AI.** Wszystkie obliczenia to deterministyczne reguły oparte na parametrach zapisanych w bazie danych.
- **AI zostało użyte podczas tworzenia projektu:** asystent AI (Claude, Anthropic) pomagał w planowaniu, pisaniu i debugowaniu kodu oraz w przygotowaniu tekstów. Cały kod został przejrzany, uruchomiony i przetestowany przez autorkę.
- Zasady prawne i parametry zostały sprawdzone na podstawie materiałów wyzwania ZUS oraz oficjalnych źródeł (zus.pl, gov.pl, PIP).

---

## 🔒 Dane i prywatność

- **Przykładowe dokumenty ZUS nie są przechowywane w repozytorium ani w aplikacji.** Sprawy zawierają wyłącznie zanonimizowane dane liczbowe potrzebne do obliczeń (bez imion, nazwisk, numerów PESEL, adresów i skanów).
- **Funkcje symulowane** (logowanie mObywatel, konto ZUS, e-ZLA, zaświadczenia, wnioski) korzystają z **fikcyjnych osób i danych** i są wyraźnie oznaczone jako symulacja.
- Klucz publiczny Supabase jest jawny z założenia; dostęp do danych chroni Row Level Security.

---

## ⚠️ Ograniczenia i dalsze kroki

- **Język:** logowanie, strona główna, nawigacja i kalkulator są w pełni dwujęzyczne (PL / EN). Pozostałe ekrany i treści w bazie są obecnie po angielsku – tłumaczenie to kolejny krok.
- **Symulacje:** wdrożenie produkcyjne wymagałoby połączenia z PUE/eZUS i mObywatelem przez oficjalne interfejsy.
- **Zgodność z przepisami:** wyniki mają charakter symulacji; ostateczną decyzję podejmuje ZUS lub pracodawca. Parametry powinny zostać zweryfikowane przez ekspertów ZUS.
- **Dalej:** pełne tłumaczenie na polski i ukraiński, wgrywanie wniosków w PDF z automatycznym odczytem danych, audyt dostępności (WCAG 2.1).

---

## 👤 Autorka

**Tinayeshe Mugwagwa** – uczestniczka indywidualna, HackNation 2026