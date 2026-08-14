#!/usr/bin/env python3
"""Wrap the artifact build into a folder that opens by double-click.

The artifact build already carries everything — three.js whole, the scans as
data URIs, zero network requests — because a published page may not make one.
That same property is what makes it work from a plain file on a machine that has
never seen this project, with no server, no install and no internet.

What it does NOT carry is a document around itself: the artifact host supplies
the doctype, the head and the body. Opened as a file there is no host, so this
puts one back, including the two things the page cannot state from inside its
own content — the encoding, without which a Hebrew interface arrives as
mojibake, and the right-to-left direction of the document.

And exports work here in a way they cannot in the shared link: a page in a
sandboxed frame is not allowed to write a file to disk, and a page opened from
a file is.

    python3 build_standalone.py
"""
import io
import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'compose.html')
ART = os.path.join(HERE, 'artifact-compose.html')
OUT = os.path.abspath(os.path.join(HERE, '..', 'INTENT-compose-share'))

HEAD = '''<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
</head>
<body>
'''
TAIL = '\n</body>\n</html>\n'

README = '''INTENT — טיפוגרפיה וצורות
==========================

מה זה
-----
כלי לקומפוזיציה: מעלים PNG של טיפוגרפיה, הוא קובע את גודל הפורמט, ובתוך השטח
הזה מציירים ביד צורות שנולדות כגופים מחומר. הכיתוב סטטי, הצורות מסתובבות.

איך פותחים
----------
לחיצה כפולה על INTENT.html. זהו.

אין מה להתקין, אין שרת, ולא צריך אינטרנט — הכול נמצא בתוך הקובץ הזה, כולל
מנוע התלת־ממד והסריקות. עובד בכרום ובספארי עדכניים. במק, אם ספארי לא מציג
כלום, פתחי בכרום.

איך עובדים
----------
1. בכרטיס הפתיחה: מעלים PNG לשכבה שמאחורי הצורות ו/או לשכבה שלפניהן.
   **שתיהן רשות** — אפשר רק אחת, שתיהן, או בלי כלום.
   אפשר ללחוץ, לגרור לתוך המסגרת, או להדביק מהלוח.
2. בוחרים את הצבע שמאחורי הצורות. מה שנבחר הוא מה שיוצא — הצבע נפתר מול
   התאורה, לא נקבע. (יוצא דופן: צבע רווי ובהיר מאוד, שהפילם מרווה כלפי מטה.)
3. הפורמט נקבע לבד מה־PNG. אפשר לשנות ידנית.
4. "התחל" — ואז מציירים. כל קו שסוגרים נולד כגוף. החומר נבחר אקראית ואף פעם
   לא אותו אחד פעמיים ברצף.

ייצוא
-----
הכפתורים בשורה שלמעלה, על השולחן מסביב לפורמט — הם אף פעם לא על העבודה עצמה
ולא נכנסים לקובץ שיוצא.

  PNG    — תמונה בודדת, פי 2 מהפורמט שעל המסך.
  וידאו  — MP4 של סיבוב אחד שלם, מתלופף בלי תפר.
  GIF    — אותו דבר, מתלופף אינסופית.

אורך הסיבוב נקבע בכרטיס הפתיחה. הקובץ יורד וגם מוצג על המסך — אם משום מה הוא
לא ירד, לחיצה ימנית עליו ואז "שמור בשם".

מקשים (במקום הכפתורים)
----------------------
  Esc   הגדרות
  C     ניקוי
  S     תמונה
  V     וידאו
  G     GIF

שימי לב
-------
רענון של הדף מוחק את הקומפוזיציה. לייצא לפני.
'''


def build():
    if not os.path.exists(ART) or os.path.getmtime(ART) < os.path.getmtime(SRC):
        subprocess.run([sys.executable, os.path.join(HERE, 'build_artifact.py'),
                        SRC, ART], cwd=HERE, check=True)
    body = io.open(ART, encoding='utf-8').read()
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT)
    io.open(os.path.join(OUT, 'INTENT.html'), 'w', encoding='utf-8').write(HEAD + body + TAIL)
    io.open(os.path.join(OUT, 'קרא-אותי.txt'), 'w', encoding='utf-8').write(README)
    size = os.path.getsize(os.path.join(OUT, 'INTENT.html'))
    print('built %s (%d KB, one file, no network)' % (OUT, size / 1024))


if __name__ == '__main__':
    build()
