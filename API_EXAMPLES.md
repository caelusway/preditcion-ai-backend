# API Örnekleri - Production (decentralabs.tech)

Bu doküman gerçek production API çağrıları ve yanıtlarını içerir.

**Base URL:** `https://decentralabs.tech`

---

## 1. Geçmiş Tarih Maçları (Finished)

### Curl Komutu:
```bash
curl "https://decentralabs.tech/matches?date=2025-12-14"
```

### Yanıt:
```json
{
  "date": "2025-12-14",
  "matches": [
    {
      "league": "Premier League",
      "country": "England",
      "leagueImg": "https://media.api-sports.io/football/leagues/39.png",
      "leagueId": 39,
      "matches": [
        {
          "id": "e690f925-b5ed-4fb1-84db-592fcf419393",
          "apiId": "1379128",
          "homeTeam": {
            "id": "2f5cbb81-8005-4b2d-8f8f-a98c16d63e35",
            "name": "West Ham",
            "apiId": "48",
            "logoUrl": "https://media.api-sports.io/football/teams/48.png",
            "country": "England",
            "league": "Premier League"
          },
          "awayTeam": {
            "id": "4b848098-0abb-4c13-8a85-29274d79f090",
            "name": "Aston Villa",
            "apiId": "66",
            "logoUrl": "https://media.api-sports.io/football/teams/66.png",
            "country": "England",
            "league": "Premier League"
          },
          "kickoffTime": "2025-12-14T14:00:00+00:00",
          "status": "finished",
          "homeScore": 2,
          "awayScore": 3,
          "venue": "London Stadium",
          "referee": "Anthony Taylor, England",
          "round": "Regular Season - 16"
        },
        {
          "id": "aa58e3dd-8768-4fb2-89be-a3ad4f7bd15e",
          "homeTeam": { "name": "Crystal Palace" },
          "awayTeam": { "name": "Manchester City" },
          "status": "finished",
          "homeScore": 0,
          "awayScore": 3
        },
        {
          "id": "b8728374-6b50-4d15-a60b-1010b159bcbc",
          "homeTeam": { "name": "Nottingham Forest" },
          "awayTeam": { "name": "Tottenham" },
          "status": "finished",
          "homeScore": 3,
          "awayScore": 0
        },
        {
          "id": "a2ef4281-ee45-4bef-8112-40bfc5666546",
          "homeTeam": { "name": "Sunderland" },
          "awayTeam": { "name": "Newcastle" },
          "status": "finished",
          "homeScore": 1,
          "awayScore": 0
        },
        {
          "id": "d75af417-c09a-48c4-afe3-38008992d449",
          "homeTeam": { "name": "Brentford" },
          "awayTeam": { "name": "Leeds" },
          "status": "finished",
          "homeScore": 1,
          "awayScore": 1
        }
      ]
    },
    {
      "league": "La Liga",
      "country": "Spain",
      "leagueImg": "https://media.api-sports.io/football/leagues/140.png",
      "leagueId": 140,
      "matches": [
        {
          "homeTeam": { "name": "Sevilla" },
          "awayTeam": { "name": "Oviedo" },
          "status": "finished",
          "homeScore": 4,
          "awayScore": 0
        },
        {
          "homeTeam": { "name": "Celta Vigo" },
          "awayTeam": { "name": "Athletic Club" },
          "status": "finished",
          "homeScore": 2,
          "awayScore": 0
        },
        {
          "homeTeam": { "name": "Alaves" },
          "awayTeam": { "name": "Real Madrid" },
          "status": "finished",
          "homeScore": 1,
          "awayScore": 2
        },
        {
          "homeTeam": { "name": "Levante" },
          "awayTeam": { "name": "Villarreal" },
          "status": "upcoming",
          "homeScore": null,
          "awayScore": null
        }
      ]
    },
    {
      "league": "Serie A",
      "country": "Italy",
      "leagueId": 135,
      "matches": [
        {
          "homeTeam": { "name": "AC Milan" },
          "awayTeam": { "name": "Sassuolo" },
          "status": "finished",
          "homeScore": 2,
          "awayScore": 2
        },
        {
          "homeTeam": { "name": "Udinese" },
          "awayTeam": { "name": "Napoli" },
          "status": "finished",
          "homeScore": 1,
          "awayScore": 0
        },
        {
          "homeTeam": { "name": "Fiorentina" },
          "awayTeam": { "name": "Verona" },
          "status": "finished",
          "homeScore": 1,
          "awayScore": 2
        },
        {
          "homeTeam": { "name": "Genoa" },
          "awayTeam": { "name": "Inter" },
          "status": "finished",
          "homeScore": 1,
          "awayScore": 2
        },
        {
          "homeTeam": { "name": "Bologna" },
          "awayTeam": { "name": "Juventus" },
          "status": "finished",
          "homeScore": 0,
          "awayScore": 1
        }
      ]
    },
    {
      "league": "Bundesliga",
      "country": "Germany",
      "leagueId": 78,
      "matches": [
        {
          "homeTeam": { "name": "SC Freiburg" },
          "awayTeam": { "name": "Borussia Dortmund" },
          "status": "finished",
          "homeScore": 1,
          "awayScore": 1
        },
        {
          "homeTeam": { "name": "Bayern München" },
          "awayTeam": { "name": "FSV Mainz 05" },
          "status": "finished",
          "homeScore": 2,
          "awayScore": 2
        },
        {
          "homeTeam": { "name": "Werder Bremen" },
          "awayTeam": { "name": "VfB Stuttgart" },
          "status": "finished",
          "homeScore": 0,
          "awayScore": 4
        }
      ]
    },
    {
      "league": "Ligue 1",
      "country": "France",
      "leagueId": 61,
      "matches": [
        {
          "homeTeam": { "name": "Lyon" },
          "awayTeam": { "name": "Le Havre" },
          "status": "finished",
          "homeScore": 1,
          "awayScore": 0
        },
        {
          "homeTeam": { "name": "Strasbourg" },
          "awayTeam": { "name": "Lorient" },
          "status": "finished",
          "homeScore": 0,
          "awayScore": 0
        },
        {
          "homeTeam": { "name": "Auxerre" },
          "awayTeam": { "name": "Lille" },
          "status": "finished",
          "homeScore": 3,
          "awayScore": 4
        },
        {
          "homeTeam": { "name": "Lens" },
          "awayTeam": { "name": "Nice" },
          "status": "finished",
          "homeScore": 2,
          "awayScore": 0
        },
        {
          "homeTeam": { "name": "Marseille" },
          "awayTeam": { "name": "Monaco" },
          "status": "finished",
          "homeScore": 1,
          "awayScore": 0
        }
      ]
    }
  ]
}
```

**Özet:** 14 Aralık - 22 maç (21 finished, 1 upcoming/postponed)

---

## 2. Gelecek Tarih Maçları (Upcoming)

### Curl Komutu:
```bash
curl "https://decentralabs.tech/matches?date=2025-12-21"
```

### Yanıt:
```json
{
  "date": "2025-12-21",
  "matches": [
    {
      "league": "Premier League",
      "country": "England",
      "leagueImg": "https://media.api-sports.io/football/leagues/39.png",
      "leagueId": 39,
      "matches": [
        {
          "id": "fa34236f-9fe3-4c36-b34a-f9249edee6e1",
          "apiId": "1379129",
          "homeTeam": {
            "id": "4b848098-0abb-4c13-8a85-29274d79f090",
            "name": "Aston Villa",
            "apiId": "66",
            "logoUrl": "https://media.api-sports.io/football/teams/66.png",
            "country": "England",
            "league": "Premier League"
          },
          "awayTeam": {
            "id": "d1f0cea0-1568-4c1d-a48a-3a35b955ac52",
            "name": "Manchester United",
            "apiId": "33",
            "logoUrl": "https://media.api-sports.io/football/teams/33.png",
            "country": "England",
            "league": "Premier League"
          },
          "kickoffTime": "2025-12-21T16:30:00+00:00",
          "status": "upcoming",
          "homeScore": null,
          "awayScore": null,
          "venue": "Villa Park",
          "referee": null,
          "round": "Regular Season - 17"
        }
      ]
    },
    {
      "league": "La Liga",
      "country": "Spain",
      "leagueImg": "https://media.api-sports.io/football/leagues/140.png",
      "leagueId": 140,
      "matches": [
        {
          "homeTeam": { "name": "Girona" },
          "awayTeam": { "name": "Atletico Madrid" },
          "kickoffTime": "2025-12-21T13:00:00+00:00",
          "status": "upcoming"
        },
        {
          "homeTeam": { "name": "Villarreal" },
          "awayTeam": { "name": "Barcelona" },
          "kickoffTime": "2025-12-21T15:15:00+00:00",
          "status": "upcoming"
        },
        {
          "homeTeam": { "name": "Elche" },
          "awayTeam": { "name": "Rayo Vallecano" },
          "kickoffTime": "2025-12-21T17:30:00+00:00",
          "status": "upcoming"
        },
        {
          "homeTeam": { "name": "Real Betis" },
          "awayTeam": { "name": "Getafe" },
          "kickoffTime": "2025-12-21T20:00:00+00:00",
          "status": "upcoming"
        }
      ]
    },
    {
      "league": "Serie A",
      "country": "Italy",
      "leagueId": 135,
      "matches": [
        {
          "homeTeam": { "name": "Cagliari" },
          "awayTeam": { "name": "Pisa" },
          "kickoffTime": "2025-12-21T11:30:00+00:00",
          "status": "upcoming"
        },
        {
          "homeTeam": { "name": "Sassuolo" },
          "awayTeam": { "name": "Torino" },
          "kickoffTime": "2025-12-21T14:00:00+00:00",
          "status": "upcoming"
        },
        {
          "homeTeam": { "name": "Fiorentina" },
          "awayTeam": { "name": "Udinese" },
          "kickoffTime": "2025-12-21T17:00:00+00:00",
          "status": "upcoming"
        },
        {
          "homeTeam": { "name": "Genoa" },
          "awayTeam": { "name": "Atalanta" },
          "kickoffTime": "2025-12-21T19:45:00+00:00",
          "status": "upcoming"
        }
      ]
    },
    {
      "league": "Bundesliga",
      "country": "Germany",
      "leagueId": 78,
      "matches": [
        {
          "homeTeam": { "name": "FSV Mainz 05" },
          "awayTeam": { "name": "FC St. Pauli" },
          "kickoffTime": "2025-12-21T14:30:00+00:00",
          "status": "upcoming"
        },
        {
          "homeTeam": { "name": "1. FC Heidenheim" },
          "awayTeam": { "name": "Bayern München" },
          "kickoffTime": "2025-12-21T16:30:00+00:00",
          "status": "upcoming"
        }
      ]
    }
  ]
}
```

**Özet:** 21 Aralık - 11 upcoming maç

---


