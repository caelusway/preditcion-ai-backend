# API Updates - December 2025

## 1. Register API - Güncelleme

**Endpoint:** `POST /auth/register`

### Değişiklikler:
- `username` artık **opsiyonel** (verilmezse email'den otomatik oluşturulur)
- `name` ve `surname` alanları **kaldırıldı**

### Request Body:
```json
{
  "email": "user@example.com",
  "password": "MinLength8Chars",
  "username": "optional_username"  // Opsiyonel
}
```

### Örnek İstek (username olmadan):
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@test.com","password":"Test123456"}'
```

### Örnek Yanıt:
```json
{
  "user": {
    "id": "c969b78f-21f4-40b0-9e24-aea0e58b8b91",
    "email": "newuser@test.com",
    "username": "newuser_7105",
    "emailVerified": false,
    "createdAt": "2025-12-20T13:25:14.917Z"
  }
}
```

### Örnek İstek (username ile):
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Test123456","username":"my_username"}'
```

### Örnek Yanıt:
```json
{
  "user": {
    "id": "e46f9fcf-c8f9-4be4-bf41-b28018954304",
    "email": "user@test.com",
    "username": "my_username",
    "emailVerified": false,
    "createdAt": "2025-12-20T13:25:25.714Z"
  }
}
```

---

## 2. Matches Endpoints

### 2.1 Upcoming Matches (Belirli Gün)

**Endpoint:** `GET /matches`

| Parametre | Tip | Varsayılan | Açıklama |
|-----------|-----|------------|----------|
| date | string (YYYY-MM-DD) | Bugün | Hangi günün maçları |

```bash
# Bugünün maçları
curl "http://localhost:3001/matches"

# Belirli gün
curl "http://localhost:3001/matches?date=2025-12-21"
```

**Örnek Yanıt:**
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
          "id": "uuid",
          "apiId": "1379129",
          "homeTeam": { "name": "Aston Villa", "logoUrl": "..." },
          "awayTeam": { "name": "Manchester United", "logoUrl": "..." },
          "kickoffTime": "2025-12-21T16:30:00+00:00",
          "status": "upcoming",
          "venue": "Villa Park",
          "round": "Regular Season - 17"
        }
      ]
    }
  ]
}
```

---

### 2.2 Finished Matches (Tarih Aralığı)

**Endpoint:** `GET /matches/finished`

### Query Parametreleri:
| Parametre | Tip | Varsayılan | Açıklama |
|-----------|-----|------------|----------|
| startDate | string (YYYY-MM-DD) | 7 gün önce | Başlangıç tarihi |
| endDate | string (YYYY-MM-DD) | Bugün | Bitiş tarihi |
| page | integer | 1 | Sayfa numarası |
| limit | integer | 20 (max 100) | Sayfa başına maç sayısı |

### Örnek İstek:
```bash
curl "http://localhost:3001/matches/finished?startDate=2025-12-12&endDate=2025-12-20"
```

### Örnek Yanıt:
```json
{
  "startDate": "2025-12-12",
  "endDate": "2025-12-20",
  "totalMatches": 49,
  "matches": [
    {
      "league": "Premier League",
      "country": "England",
      "leagueImg": "https://media.api-sports.io/football/leagues/39.png",
      "leagueId": 39,
      "matches": [
        {
          "id": "1379124",
          "apiId": "1379124",
          "homeTeam": {
            "name": "Liverpool",
            "logoUrl": "https://media.api-sports.io/football/teams/40.png"
          },
          "awayTeam": {
            "name": "Brighton",
            "logoUrl": "https://media.api-sports.io/football/teams/51.png"
          },
          "kickoffTime": "2025-12-13T15:00:00+00:00",
          "status": "finished",
          "homeScore": 2,
          "awayScore": 0,
          "venue": "Anfield",
          "round": "Regular Season - 16"
        }
      ]
    },
    {
      "league": "La Liga",
      "country": "Spain",
      "leagueImg": "https://media.api-sports.io/football/leagues/140.png",
      "leagueId": 140,
      "matches": [...]
    }
  ]
}
```

---

## 3. Coupon API - Güncellemeler

### Yeni Alanlar:

| Alan | Tip | Açıklama |
|------|-----|----------|
| `result` | string | `pending`, `won`, `lost`, `partial` |
| `currency` | string | `TRY`, `USD`, `EUR`, `GBP` (varsayılan: TRY) |
| `stake` | number | Yatırılan miktar |
| `potentialWin` | number | Potansiyel kazanç (stake × totalOdds) |
| `selectionsCount` | integer | Toplam seçim sayısı |
| `wonCount` | integer | Kazanılan seçim sayısı |
| `lostCount` | integer | Kaybedilen seçim sayısı |
| `pendingCount` | integer | Bekleyen seçim sayısı |

### 3.1 Create Coupon

**Endpoint:** `POST /coupons`

### Örnek İstek:
```bash
curl -X POST http://localhost:3001/coupons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Weekend Bet",
    "currency": "TRY",
    "stake": 100
  }'
```

### Örnek Yanıt:
```json
{
  "coupon": {
    "id": "1e21c9e0-0c9d-4dbe-93be-b3daa829358d",
    "userId": "c969b78f-21f4-40b0-9e24-aea0e58b8b91",
    "name": "Weekend Bet",
    "status": "active",
    "result": "pending",
    "totalOdds": 1,
    "currency": "TRY",
    "stake": 100,
    "potentialWin": 100,
    "createdAt": "2025-12-20T13:27:24.289Z",
    "updatedAt": "2025-12-20T13:27:24.289Z",
    "selections": []
  }
}
```

### 3.2 Add Selection to Coupon

**Endpoint:** `POST /coupons/:id/selections`

### Örnek İstek:
```bash
curl -X POST "http://localhost:3001/coupons/COUPON_ID/selections" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "matchApiId": "1379124",
    "homeTeamName": "Liverpool",
    "awayTeamName": "Brighton",
    "homeTeamLogoUrl": "https://media.api-sports.io/football/teams/40.png",
    "awayTeamLogoUrl": "https://media.api-sports.io/football/teams/51.png",
    "kickoffTime": "2025-12-13T15:00:00Z",
    "league": "Premier League",
    "predictionType": "1x2",
    "prediction": "1",
    "odds": 1.85
  }'
```

### Örnek Yanıt:
```json
{
  "coupon": {
    "id": "1e21c9e0-0c9d-4dbe-93be-b3daa829358d",
    "name": "Weekend Bet",
    "status": "active",
    "result": "pending",
    "totalOdds": 1.85,
    "currency": "TRY",
    "stake": 100,
    "potentialWin": 185,
    "selections": [
      {
        "id": "fa7e80ec-a259-4cef-b41d-c6a67ec89983",
        "matchApiId": "1379124",
        "homeTeamName": "Liverpool",
        "awayTeamName": "Brighton",
        "homeTeamLogoUrl": "https://media.api-sports.io/football/teams/40.png",
        "awayTeamLogoUrl": "https://media.api-sports.io/football/teams/51.png",
        "kickoffTime": "2025-12-13T15:00:00.000Z",
        "league": "Premier League",
        "predictionType": "1x2",
        "prediction": "1",
        "odds": 1.85,
        "result": null
      }
    ]
  }
}
```

### 3.3 Get All Coupons (with Status)

**Endpoint:** `GET /coupons`

### Örnek İstek:
```bash
curl "http://localhost:3001/coupons" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Örnek Yanıt (Tamamlanmış Kupon - Kazandı):
```json
{
  "coupons": [
    {
      "id": "1e21c9e0-0c9d-4dbe-93be-b3daa829358d",
      "userId": "c969b78f-21f4-40b0-9e24-aea0e58b8b91",
      "name": "Weekend Bet",
      "status": "completed",
      "result": "won",
      "totalOdds": 1.85,
      "currency": "TRY",
      "stake": 100,
      "potentialWin": 185,
      "createdAt": "2025-12-20T13:27:24.289Z",
      "updatedAt": "2025-12-20T13:53:50.728Z",
      "selections": [
        {
          "id": "fa7e80ec-a259-4cef-b41d-c6a67ec89983",
          "couponId": "1e21c9e0-0c9d-4dbe-93be-b3daa829358d",
          "matchId": "2a6ecc87-0480-4950-9adf-2328bf8fd546",
          "matchApiId": "1379124",
          "homeTeamName": "Liverpool",
          "awayTeamName": "Brighton",
          "homeTeamLogoUrl": "https://media.api-sports.io/football/teams/40.png",
          "awayTeamLogoUrl": "https://media.api-sports.io/football/teams/51.png",
          "kickoffTime": "2025-12-13T15:00:00.000Z",
          "league": "Premier League",
          "predictionType": "1x2",
          "prediction": "1",
          "odds": 1.85,
          "result": "won",
          "match": {
            "id": "2a6ecc87-0480-4950-9adf-2328bf8fd546",
            "apiId": "1379124",
            "status": "finished",
            "homeScore": 2,
            "awayScore": 0,
            "venue": "Anfield"
          }
        }
      ],
      "selectionsCount": 1,
      "wonCount": 1,
      "lostCount": 0,
      "pendingCount": 0
    }
  ]
}
```

### Örnek Yanıt (Aktif Kupon - Bekliyor):
```json
{
  "coupons": [
    {
      "id": "abc123",
      "name": "My Bet",
      "status": "active",
      "result": "pending",
      "totalOdds": 3.45,
      "currency": "TRY",
      "stake": 50,
      "potentialWin": 172.5,
      "selections": [...],
      "selectionsCount": 2,
      "wonCount": 1,
      "lostCount": 0,
      "pendingCount": 1
    }
  ]
}
```

### 3.4 Update Coupon (with Currency/Stake)

**Endpoint:** `PUT /coupons/:id`

### Örnek İstek:
```bash
curl -X PUT "http://localhost:3001/coupons/COUPON_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Updated Name",
    "currency": "USD",
    "stake": 50
  }'
```

---

## Kupon Status Açıklamaları

### `status` değerleri:
| Değer | Açıklama |
|-------|----------|
| `active` | Kupon aktif, maçlar devam ediyor |
| `completed` | Tüm maçlar bitti |
| `cancelled` | Kupon iptal edildi |

### `result` değerleri:
| Değer | Açıklama |
|-------|----------|
| `pending` | Henüz sonuçlanmadı |
| `won` | Tüm tahminler tuttu |
| `lost` | En az bir tahmin tutmadı |
| `partial` | Bazı maçlar void oldu |

---

## Currency (Para Birimi) Seçenekleri

- `TRY` - Türk Lirası (varsayılan)
- `USD` - Amerikan Doları
- `EUR` - Euro
- `GBP` - İngiliz Sterlini

---

## 4. Match Sync API - Otomatik Maç ve Oran Senkronizasyonu

### Genel Bilgi

Backend, Top 5 Avrupa ligi (Premier League, La Liga, Serie A, Bundesliga, Ligue 1) için maçları ve oranları otomatik olarak API-Football'dan çekip veritabanına kaydeder.

- **Otomatik Sync:** Her 6 saatte bir çalışır
- **Maç Verileri:** Gelecek 7 gün ve geçmiş 3 gün
- **Oranlar:** 1X2, Over/Under, BTTS, Double Chance

### 4.1 Sync Status

**Endpoint:** `GET /sync/status`

```bash
curl "http://localhost:3001/sync/status"
```

**Örnek Yanıt:**
```json
{
  "isSchedulerRunning": true,
  "isSyncRunning": false,
  "lastSync": {
    "fixtures": {
      "id": "abc123",
      "syncType": "fixtures",
      "status": "completed",
      "itemsProcessed": 85,
      "itemsFailed": 0,
      "startedAt": "2025-12-20T12:00:00.000Z",
      "completedAt": "2025-12-20T12:05:30.000Z"
    },
    "odds": {
      "id": "def456",
      "syncType": "odds",
      "status": "completed",
      "itemsProcessed": 42,
      "itemsFailed": 2,
      "startedAt": "2025-12-20T12:05:35.000Z",
      "completedAt": "2025-12-20T12:10:15.000Z"
    },
    "teams": {...}
  },
  "nextSyncIn": "6 hours"
}
```

### 4.2 Manuel Sync Tetikleme

**Endpoint:** `POST /sync/trigger`

```bash
curl -X POST "http://localhost:3001/sync/trigger"
```

**Örnek Yanıt:**
```json
{
  "message": "Sync completed successfully",
  "result": {
    "fixtures": { "processed": 46, "failed": 0 },
    "finished": { "processed": 2, "failed": 0 },
    "odds": { "processed": 34, "failed": 0 },
    "coupons": { "selectionsUpdated": 1, "couponsUpdated": 1 }
  }
}
```

> **Not:** Sync tetiklendiğinde, biten maçlar için kupon selection sonuçları otomatik olarak hesaplanır ve kupon status'ları güncellenir.

### 4.3 Sadece Fixture Sync

**Endpoint:** `POST /sync/fixtures?days=7`

```bash
curl -X POST "http://localhost:3001/sync/fixtures?days=7"
```

### 4.4 Sadece Odds Sync

**Endpoint:** `POST /sync/odds`

```bash
curl -X POST "http://localhost:3001/sync/odds"
```

### 4.5 Sadece Finished Matches Sync

**Endpoint:** `POST /sync/finished?days=7`

```bash
curl -X POST "http://localhost:3001/sync/finished?days=7"
```

### 4.6 Teams Sync

**Endpoint:** `POST /sync/teams`

```bash
curl -X POST "http://localhost:3001/sync/teams"
```

---

## 5. Maç Oranları (Match Odds)

Veritabanındaki maçlara ait oranlar `MatchOdds` tablosunda saklanır.

### Oran Türleri:

| Alan | Açıklama |
|------|----------|
| `homeWinOdds` | Ev sahibi kazanır (1) |
| `drawOdds` | Beraberlik (X) |
| `awayWinOdds` | Deplasman kazanır (2) |
| `homeOrDrawOdds` | 1X |
| `awayOrDrawOdds` | X2 |
| `homeOrAwayOdds` | 12 |
| `over25Odds` | 2.5 Üst |
| `under25Odds` | 2.5 Alt |
| `over15Odds` | 1.5 Üst |
| `under15Odds` | 1.5 Alt |
| `over35Odds` | 3.5 Üst |
| `under35Odds` | 3.5 Alt |
| `bttsYesOdds` | KG Var |
| `bttsNoOdds` | KG Yok |

---

## Desteklenen Ligler (Top 5)

| Lig | Ülke | League ID |
|-----|------|-----------|
| Premier League | England | 39 |
| La Liga | Spain | 140 |
| Serie A | Italy | 135 |
| Bundesliga | Germany | 78 |
| Ligue 1 | France | 61 |

---

## 6. Otomatik Kupon Sonuç Hesaplama

Kuponlar sanal kuponlardır ve maç sonuçlarına göre otomatik olarak güncellenir.

### Nasıl Çalışır:

1. **Maç Sync:** Her 6 saatte bir (veya manuel `/sync/trigger` ile) biten maçlar veritabanına çekilir
2. **Selection Bağlama:** Kuponda henüz bağlanmamış selection'lar maçlarla eşleştirilir (`matchApiId` → `match.apiId`)
3. **Sonuç Hesaplama:** Biten maçlar için selection sonuçları tahmine göre hesaplanır
4. **Kupon Güncelleme:** Tüm selection'ları biten kuponlar `completed` olarak işaretlenir

### Selection Result Hesaplama Mantığı:

| predictionType | prediction | Kazanma Koşulu |
|----------------|------------|----------------|
| `1x2` | `1` | Ev sahibi kazanırsa (`homeScore > awayScore`) |
| `1x2` | `X` | Beraberlik (`homeScore == awayScore`) |
| `1x2` | `2` | Deplasman kazanırsa (`awayScore > homeScore`) |
| `btts` | `Yes` | Her iki takım da gol atarsa |
| `btts` | `No` | En az bir takım gol atmazsa |
| `over_under` | `Over 2.5` | Toplam gol > 2.5 |
| `over_under` | `Under 2.5` | Toplam gol < 2.5 |
| `double_chance` | `1X` | Ev sahibi kazanır veya beraberlik |
| `double_chance` | `X2` | Beraberlik veya deplasman kazanır |
| `double_chance` | `12` | Ev sahibi veya deplasman kazanır (beraberlik değil) |

### Kupon Result Mantığı:

| Durum | Kupon Result |
|-------|--------------|
| Herhangi bir selection `lost` | `lost` |
| Tüm selection'lar `won` | `won` |
| Bazı selection'lar `void` | `partial` |
| En az bir selection sonuç bekliyor | `pending` |

### Çoklu Maç Senaryosu:

Bir kuponda birden fazla maç olabilir. `status` ve `result` ayrı kavramlardır:

- **status:** Maçların bitip bitmediğini gösterir (`active` / `completed`)
- **result:** Tahminlerin tutup tutmadığını gösterir (`pending` / `won` / `lost` / `partial`)

| Kupon | Selection 1 | Selection 2 | Selection 3 | Status | Result |
|-------|-------------|-------------|-------------|--------|--------|
| A | ✅ won | ⏳ pending | ⏳ pending | `active` | `pending` |
| B | ✅ won | ✅ won | ⏳ pending | `active` | `pending` |
| C | ✅ won | ✅ won | ✅ won | `completed` | `won` |
| D | ✅ won | ❌ lost | ⏳ pending | `active` | `lost` |
| E | ✅ won | ❌ lost | ✅ won | `completed` | `lost` |

> **Önemli:** Bir maç kaybedildiğinde `result` hemen `lost` olur, ama `status` tüm maçlar bitene kadar `active` kalır.

---

## Önemli Notlar

1. **potentialWin otomatik hesaplanır:** `stake × totalOdds`
2. **totalOdds otomatik güncellenir:** Selection eklendiğinde/çıkarıldığında
3. **selectionsCount, wonCount, lostCount, pendingCount:** GET /coupons yanıtında otomatik hesaplanır
4. **result otomatik güncellenir:** Maç sonuçlandığında selection'ların result'ına göre kupon result'ı hesaplanır
5. **Maç verileri otomatik sync edilir:** Her 6 saatte bir API-Football'dan çekilir
6. **API isteklerini azaltmak için:** Maçlar ve oranlar veritabanında saklanır, frontend doğrudan DB'den çeker
7. **Kuponlar sanal:** Gerçek bahis değil, takip amaçlı sanal kuponlardır
