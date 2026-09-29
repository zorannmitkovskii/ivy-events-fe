# Сајтови на `*.ivyevents.mk` — поставување на сервер

Покани, микросајтови на добавувачи и сајтови на агенции на свој поддомен.
Блогот останува на главниот домен (`ivyevents.mk/mk/blog/…`).

| Средина | Сајтови | Податоци од | Сервер |
|---|---|---|---|
| Продукција | `<име>.ivyevents.mk` | `api.ivyevents.mk` | продукција |
| Тест | `<име>.test.ivyevents.mk` | `api.test.ivyevents.mk` | `138.68.65.94` |

Кодот (FE и BE) е готов. Ова се чекорите на серверите. Правете ги по ред:
прво **тест**, па **продукција**.

---

## 1. DNS — DigitalOcean

Networking → Domains → **`ivyevents.mk`** → Create new record.
Во MKhost не се менува ништо (nameservers веќе покажуваат кон DigitalOcean).

| Type | Hostname | Will direct to | TTL |
|---|---|---|---|
| A | `*` | IP на **продукцијата** (исто како записот за `ivyevents.mk`) | 3600 |
| A | `*.test` | `138.68.65.94` | 3600 |

Постоечките записи (`www`, `api`, `auth`, `test`, `api.test`, …) не се менуваат —
имаат предност пред `*`.

Проверка (по неколку минути):

```bash
dig A proba-123.ivyevents.mk +short        # IP на продукција
dig A proba-123.test.ivyevents.mk +short   # 138.68.65.94
dig CAA ivyevents.mk +short                # празно, или мора да има issuewild "letsencrypt.org"
```

---

## 2. API токен за certbot — DigitalOcean

API → Tokens → **Generate New Token** (`certbot-dns`), Custom scopes:
**domain: read + update**. Токенот не се праќа никому — оди директно на секој сервер:

```bash
mkdir -p /opt/ivy-events/infra/certbot/secrets
echo 'dns_digitalocean_token = ОВДЕ_ТОКЕНОТ' > /opt/ivy-events/infra/certbot/secrets/digitalocean.ini
chmod 600 /opt/ivy-events/infra/certbot/secrets/digitalocean.ini
```

---

## 3. Wildcard сертификат

**Тест** (на тест-серверот):

```bash
docker run --rm \
  -v /opt/ivy-events/infra/certbot/conf:/etc/letsencrypt \
  -v /opt/ivy-events/infra/certbot/secrets:/secrets:ro \
  certbot/dns-digitalocean certonly \
    --dns-digitalocean --dns-digitalocean-credentials /secrets/digitalocean.ini \
    --dns-digitalocean-propagation-seconds 60 \
    --cert-name test.ivyevents.mk-wildcard \
    -d test.ivyevents.mk -d '*.test.ivyevents.mk'
```

**Продукција** (на продукцискиот сервер): истата команда со
`--cert-name ivyevents.mk-wildcard -d ivyevents.mk -d '*.ivyevents.mk'`.

Проверка: `docker exec ivy-certbot certbot certificates` — новиот сертификат со двата домена.

### Автоматско обновување

`ivy-certbot` користи `certbot/certbot`, која го нема DigitalOcean plugin-от.
Во compose датотеката во `/opt/ivy-events/infra`, кај сервисот за `ivy-certbot`:

```yaml
    image: certbot/dns-digitalocean:latest
    volumes:
      # … постоечките …
      - ./certbot/secrets:/secrets:ro
```

```bash
docker compose up -d <сервис-за-certbot>
docker exec ivy-certbot certbot renew --dry-run   # сите сертификати мора да поминат
```

---

## 4. Nginx

| Сервер | Датотека од ова репо | Оди во |
|---|---|---|
| Тест | `ivy-sites.test.conf` | `/opt/ivy-events/infra/nginx/conf.d/ivy-sites.conf` |
| Продукција | `ivy-sites.prod.conf` | `/opt/ivy-events/infra/nginx/conf.d/ivy-sites.conf` |

```bash
cp -a /opt/ivy-events/infra/nginx/conf.d /opt/ivy-events/infra/nginx/conf.d.bak-$(date +%F)
# ископирај ја соодветната датотека како ivy-sites.conf во conf.d, па:
docker exec ivy-nginx nginx -t && docker exec ivy-nginx nginx -s reload
```

Ако `nginx -t` пријави грешка, reload не се прави и старата конфигурација работи — врати ја копијата.

---

## 5. Backend — само тест

Во `/opt/ivy-events/env/be.env`:

```
IVY_MICROSITE_PLATFORMDOMAIN=test.ivyevents.mk
```

па BE одново (Re-run на deploy-dev во GitHub Actions). На продукција не треба ништо —
стандардно е `ivyevents.mk`. FE не бара поставување ни на едната средина.

---

## 6. Крајна проверка

```bash
H=proba-123.test.ivyevents.mk   # на продукција: proba-123.ivyevents.mk

# сертификатот ги покрива поддомените
echo | openssl s_client -connect $H:443 -servername $H 2>/dev/null | openssl x509 -noout -enddate -ext subjectAltName

# nginx го служи SPA-то (200)
curl -sI https://$H | head -1

# BE знае на кого е адресата (404 = слободна; 200 = зафатена и вклучена)
curl -s "https://api.test.ivyevents.mk/v1/api/public/site?host=$H"
```

Во прелистувач `https://proba-123.test.ivyevents.mk` треба да се отвори **без**
безбедносно предупредување.

Потоа: во настан → Поставки → Детали → **Адреса на поканата**, изберете име,
вклучете ја и отворете `https://<име>.test.ivyevents.mk/`.

---

## Кога нешто не работи

| Симптом | Причина | Решение |
|---|---|---|
| „Сајтот не може да се најде“ | Нема `*` / `*.test` запис или уште не се проширил | Чекор 1; `dig @1.1.1.1 …` |
| `NET::ERR_CERT_COMMON_NAME_INVALID` | Поддоменот добива друг сертификат | Чекор 4: патеката до `…-wildcard`; reload |
| certbot: `Incorrect TXT record` | DNS уште не се проширил | `--dns-digitalocean-propagation-seconds 120` |
| certbot: `CAA … prevents issuance` | CAA без `issuewild` | Додади `0 issuewild "letsencrypt.org"` |
| Страницата се отвора, но е празна | Стар FE/BE без поправките | Deploy на FE и BE |
| По 90 дена поддомените паднаа | Обновувањето без DigitalOcean plugin | Чекор 3, „Автоматско обновување“ |
