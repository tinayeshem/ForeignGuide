# 🧪 Przypadki testowe – Przewodnik Rodzica ZUS

**Demo:** https://teamtina.vercel.app · dane logowania: zobacz [README.pl.md](README.pl.md)

Każdy test zawiera dane do wpisania i oczekiwany wynik. Kwoty są brutto, miesięcznie.

---

## 1. Język

| Test | Kroki | ✅ Oczekiwany wynik |
|---|---|---|
| 1.1 | Otwórz aplikację | Ekran logowania **po polsku** |
| 1.2 | Kliknij 🇬🇧 **EN**, potem 🇵🇱 **PL** | Logowanie, nawigacja, strona główna i kalkulator zmieniają język; wybór zostaje zapamiętany po odświeżeniu |

## 2. Kalkulator

Każdy test zaczynaj od domyślnego formularza (urodzenie, 1 dziecko).

| Test | Dane | ✅ Oczekiwany wynik |
|---|---|---|
| 2.1 Podstawowy | Matka: wynagrodzenie brutto **8000** | Podstawa wymiaru **6 903,20 zł** (8000 − 13,71%) · macierzyński **6 903,20 zł** (100%) · rodzicielski **4 832,24 zł** (70%) |
| 2.2 Ojciec | Ojciec: wynagrodzenie brutto **6000** | Podstawa **5 177,40 zł** · ojcowski **5 177,40 zł** · rodzicielski **3 624,18 zł** |
| 2.3 Opcja 81,5% | 2.1 + zaznacz **opcję 81,5%** | Stawki matki **81,5%**, macierzyński **5 626,11 zł**, ostrzeżenie, że ojciec bierze część urlopu rodzicielskiego |
| 2.4 Limit przekazania | Ojciec przejmuje **10** tygodni urlopu macierzyńskiego | Ostrzeżenie: maksymalnie **6** tygodni (20 − 14 tygodni dla matki) |
| 2.5 Praca na część etatu | Matka pracuje w wymiarze **50%** na urlopie rodzicielskim | Urlop rodzicielski **32 → 64 tyg.**, kwota miesięczna o połowę niższa, suma bez zmian |
| 2.6 Bliźnięta | Liczba dzieci: **2** | Urlop macierzyński **31 tyg.**, urlop rodzicielski łącznie **43 tyg.** |
| 2.7 Wiek przy adopcji | Adopcja, dziecko w wieku **15** lat | Ostrzeżenie: urlop tylko na dziecko do **14.** roku życia |

Widoczne również: oś czasu „Kto i kiedy jest w domu” oraz animowana suma świadczeń.

## 3. Przykładowe sprawy (Sprawy)

| Test | Kroki | ✅ Oczekiwany wynik |
|---|---|---|
| 3.1 | Otwórz **„Demo: employee, 1 child”** w kalkulatorze | Zielony baner: zgodne z ZUS, **6 903,20 zł / mies.** |
| 3.2 | Otwórz **„Demo: contract ended before birth”** | Zielony baner: ZUS odmówił i kalkulator również nie pokazuje świadczenia |

## 4. Świadczenia w ciąży (Ciąża)

| Test | Dane | ✅ Oczekiwany wynik |
|---|---|---|
| 4.1 Okres wyczekiwania | Umowa o pracę · ubezpieczona od **2026-11-01** · zwolnienie od **2026-11-22** · **8000** | **„Not yet – 9 more days”** (30-dniowy okres wyczekiwania) |
| 4.2 Prawo do zasiłku | To samo, ubezpieczona od **2026-01-01** | Zasiłek przysługuje, **6 903,20 zł / mies.** (100%, kod „B”) |
| 4.3 Zaległe składki | Własna firma + „unpaid contributions” | Ostrzeżenie: brak wypłaty do czasu spłaty zadłużenia |

*Ten ekran jest obecnie w języku angielskim.*

## 5. Mój ZUS (symulacja, fikcyjne dane)

| Test | Kroki | ✅ Oczekiwany wynik |
|---|---|---|
| 5.1 | Wybierz **Anna** → Log in with mObywatel → potwierdź | Ubezpieczona, 2 e-ZLA z kodem „B” |
| 5.2 | Anna → Certificates → Request | Zaświadczenie wydane |
| 5.3 | Anna → Applications → ZAM, wypełnij, wyślij | Potwierdzenie z **numerem UPO** |
| 5.4 | Wyloguj → **Marta** | Brak ubezpieczenia; zaświadczenie **odmowa** (zaległości); ostrzeżenie we wniosku ZAM |

*Ten ekran jest obecnie w języku angielskim.*

## 6. Panel administratora

| Test | Kroki | ✅ Oczekiwany wynik |
|---|---|---|
| 6.1 | Admin → Parameters → **Rate – parental leave 70 → 75** → Save | „Saved”; kalkulator od razu pokazuje **75%** |
| 6.2 | Ustaw z powrotem **70** | Kalkulator wraca do 70% |
| 6.3 | Zaloguj się kontem bez uprawnień i otwórz `/admin` | **Admin only** – brak dostępu |

**Prosimy o przywrócenie pierwotnych wartości zmienionych parametrów.**

## 7. Responsywność

| Test | Kroki | ✅ Oczekiwany wynik |
|---|---|---|
| 7.1 | Otwórz na telefonie albo F12 → Ctrl + Shift + M | Nawigacja zmienia się w **menu ☰**; kafelki w jednej kolumnie |
