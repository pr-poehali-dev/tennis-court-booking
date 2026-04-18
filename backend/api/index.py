"""
Основной API для теннисного корта.
Маршрутизация через query-параметры: ?r=bookings, ?r=reviews, etc.
"""
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = "t_p43674581_tennis_court_booking"

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token",
    "Content-Type": "application/json",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"], cursor_factory=RealDictCursor)


def resp(status, body):
    return {"statusCode": status, "headers": CORS_HEADERS, "body": json.dumps(body, ensure_ascii=False, default=str)}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            body = {}

    qs = event.get("queryStringParameters") or {}
    r = qs.get("r", "")          # resource: bookings, reviews, photos, blocked-slots
    rid = qs.get("id", "")       # record id для PUT/DELETE

    # ─── BOOKINGS ────────────────────────────────────────────────
    if r == "bookings" and method == "GET":
        with get_conn() as conn:
            with conn.cursor() as cur:
                phone = qs.get("phone")
                if phone:
                    cur.execute(
                        f"SELECT * FROM {SCHEMA}.bookings WHERE regexp_replace(user_phone,'[^0-9]','','g') = regexp_replace(%s,'[^0-9]','','g') ORDER BY date, start_time",
                        (phone,)
                    )
                else:
                    cur.execute(f"SELECT * FROM {SCHEMA}.bookings ORDER BY date, start_time")
                rows = cur.fetchall()
        return resp(200, [dict(r) for r in rows])

    if r == "bookings" and method == "POST":
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.bookings
                    (user_phone, user_name, date, start_time, duration, extras_balls, extras_rackets, extras_trainer, total_price, status)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,'pending') RETURNING *""",
                    (
                        body.get("phone"), body.get("userName"), body.get("date"), body.get("startTime"),
                        body.get("duration"), body.get("extras", {}).get("balls", False),
                        body.get("extras", {}).get("rackets", 0), body.get("extras", {}).get("trainer", False),
                        body.get("totalPrice"),
                    ),
                )
                row = dict(cur.fetchone())
            conn.commit()
        return resp(201, row)

    if r == "bookings" and method == "PUT" and rid:
        action = body.get("action")
        with get_conn() as conn:
            with conn.cursor() as cur:
                if action == "confirm":
                    cur.execute(f"UPDATE {SCHEMA}.bookings SET status='confirmed' WHERE id=%s RETURNING *", (rid,))
                elif action == "cancel":
                    cur.execute(f"UPDATE {SCHEMA}.bookings SET status='cancelled' WHERE id=%s RETURNING *", (rid,))
                elif action == "edit":
                    cur.execute(
                        f"""UPDATE {SCHEMA}.bookings SET
                        date=%s, start_time=%s, duration=%s,
                        extras_balls=%s, extras_rackets=%s, extras_trainer=%s,
                        total_price=%s, status='pending'
                        WHERE id=%s RETURNING *""",
                        (
                            body.get("date"), body.get("startTime"), body.get("duration"),
                            body.get("extras", {}).get("balls", False),
                            body.get("extras", {}).get("rackets", 0),
                            body.get("extras", {}).get("trainer", False),
                            body.get("totalPrice"), rid,
                        ),
                    )
                else:
                    return resp(400, {"error": "Unknown action"})
                row = cur.fetchone()
            conn.commit()
        return resp(200, dict(row) if row else {})

    if r == "bookings" and method == "DELETE" and rid:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(f"DELETE FROM {SCHEMA}.bookings WHERE id=%s", (rid,))
            conn.commit()
        return resp(200, {"ok": True})

    # ─── REVIEWS ─────────────────────────────────────────────────
    if r == "reviews" and method == "GET":
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(f"SELECT * FROM {SCHEMA}.reviews ORDER BY created_at DESC")
                rows = cur.fetchall()
        return resp(200, [dict(row) for row in rows])

    if r == "reviews" and method == "POST":
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.reviews (author_phone, author_name, text) VALUES (%s,%s,%s) RETURNING *",
                    (body.get("authorPhone"), body.get("authorName"), body.get("text")),
                )
                row = dict(cur.fetchone())
            conn.commit()
        return resp(201, row)

    if r == "reviews" and method == "DELETE" and rid:
        phone = qs.get("phone", "")
        admin = qs.get("admin", "")
        with get_conn() as conn:
            with conn.cursor() as cur:
                if admin == "true":
                    cur.execute(f"DELETE FROM {SCHEMA}.reviews WHERE id=%s", (rid,))
                else:
                    cur.execute(
                        f"DELETE FROM {SCHEMA}.reviews WHERE id=%s AND regexp_replace(author_phone,'[^0-9]','','g') = regexp_replace(%s,'[^0-9]','','g')",
                        (rid, phone),
                    )
            conn.commit()
        return resp(200, {"ok": True})

    # ─── BLOCKED SLOTS ────────────────────────────────────────────
    if r == "blocked-slots" and method == "GET":
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(f"SELECT * FROM {SCHEMA}.blocked_slots ORDER BY date")
                rows = cur.fetchall()
        return resp(200, [dict(row) for row in rows])

    if r == "blocked-slots" and method == "POST":
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.blocked_slots (type, date, hours, all_day) VALUES (%s,%s,%s,%s) RETURNING *",
                    (body.get("type"), body.get("date"), json.dumps(body.get("hours", [])), body.get("allDay", True)),
                )
                row = dict(cur.fetchone())
            conn.commit()
        return resp(201, row)

    if r == "blocked-slots" and method == "DELETE" and rid:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(f"DELETE FROM {SCHEMA}.blocked_slots WHERE id=%s", (rid,))
            conn.commit()
        return resp(200, {"ok": True})

    # ─── PHOTOS ───────────────────────────────────────────────────
    if r == "photos" and method == "GET":
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(f"SELECT * FROM {SCHEMA}.photos ORDER BY created_at")
                rows = cur.fetchall()
        return resp(200, [dict(row) for row in rows])

    if r == "photos" and method == "POST":
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(f"INSERT INTO {SCHEMA}.photos (url) VALUES (%s) RETURNING *", (body.get("url"),))
                row = dict(cur.fetchone())
            conn.commit()
        return resp(201, row)

    if r == "photos" and method == "DELETE" and rid:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(f"DELETE FROM {SCHEMA}.photos WHERE id=%s", (rid,))
            conn.commit()
        return resp(200, {"ok": True})

    return resp(404, {"error": "Not found"})
