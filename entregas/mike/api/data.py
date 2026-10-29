"""Sample API data, kept in memory.
There is no database: everything resets to the initial state when the server restarts.
"""
import itertools
from datetime import datetime, timezone


def _date(day: int) -> datetime:
    return datetime(2026, 9, day, 12, 0, tzinfo=timezone.utc)

SUBJECTS = {
    1: {"subject_id": 1, "name": "Mathematics", "code": "MAT101"},
    2: {"subject_id": 2, "name": "Physics", "code": "PHY101"},
    3: {"subject_id": 3, "name": "Programming", "code": "PRO101"},
    4: {"subject_id": 4, "name": "History", "code": "HIS101"},
    5: {"subject_id": 5, "name": "Literature", "code": "LIT101"},
    6: {"subject_id": 6, "name": "Chemistry", "code": "CHE101"},
}

GROUPS = {
    11: {"group_id": 11, "group_name": "Advanced Algebra", "subject_id": 1,
         "max_participants": 10, "description": "Focus on proofs and logic", "created_at": _date(10)},
    12: {"group_id": 12, "group_name": "Quantum Mechanics Basics", "subject_id": 2,
         "max_participants": 7, "description": "Lab work required on Fridays", "created_at": _date(11)},
    13: {"group_id": 13, "group_name": "Python for Beginners", "subject_id": 3,
         "max_participants": 8, "description": "Weekly coding assignments", "created_at": _date(12)},
    14: {"group_id": 14, "group_name": "Ancient Civilizations", "subject_id": 4,
         "max_participants": 5, "description": "Essay submissions bi-weekly", "created_at": _date(13)},
    15: {"group_id": 15, "group_name": "Shakespearean Tragedies", "subject_id": 5,
         "max_participants": 9, "description": "Reading and analysis seminars", "created_at": _date(14)},
    16: {"group_id": 16, "group_name": "Organic Synthesis", "subject_id": 6,
         "max_participants": 3, "description": "Safety briefing mandatory", "created_at": _date(15)},
}

GROUP_COUNTER = itertools.count(7)
