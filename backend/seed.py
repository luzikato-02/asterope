"""
Seed dashboard datasets into the data_store table.
Runs at startup if the table is empty; run directly to force-reseed:
    python seed.py [--force]
"""
from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
except ImportError:
    pass

import data as D
from database import get_db, init_db
from models import DataStore

_DATASETS: dict[str, object] = {
    "machines":           D.MACHINES,
    "plant_series":       D.PLANT_SERIES,
    "history":            D.HISTORY,
    "shift_history":      D.SHIFT_HISTORY,
    "recommendations":    D.RECOMMENDATIONS,
    "anomalies":          D.ANOMALIES,
    "model_runs":         D.MODEL_RUNS,
    "features":           D.FEATURES,
    "clusters":           D.CLUSTERS,
    "upload_log":         D.UPLOAD_LOG,
    "upload_schema":      D.UPLOAD_SCHEMA,
    "sample_parsed_rows": D.SAMPLE_PARSED_ROWS,
    "backfill":           D.BACKFILL,
    "backfill_meta":      D.BACKFILL_META,
}


def is_seeded() -> bool:
    with get_db() as db:
        return db.get(DataStore, "machines") is not None


def seed(force: bool = False) -> None:
    with get_db() as db:
        for key, data in _DATASETS.items():
            row = db.get(DataStore, key)
            if row is None:
                db.add(DataStore(key=key, data=data))
            elif force:
                row.data = data
        db.commit()


def ensure_seeded() -> None:
    if not is_seeded():
        seed()


if __name__ == "__main__":
    init_db()
    seed(force="--force" in sys.argv)
