"""Central API for the Study Group Finder, with CORS configured (result of Module 09).
Run:  fastapi dev main.py
Docs: http://127.0.0.1:8000/docs
"""
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, Query, Response, status
from fastapi.middleware.cors import CORSMiddleware
from typing import Annotated
import data
from schemas import GroupCreate, GroupOut, GroupPatch, SubjectOut


app = FastAPI(
    title="Central API: Study Group Finder",
    description="Study groups and subjects. Data is kept in memory and resets on every restart.",
    version="1.0.0",
)

# CORS: which pages (origins) can READ this API's responses from the browser.
# Each origin is scheme + host + port, written exactly as the browser sends it.
ALLOWED_ORIGINS = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type"],
    expose_headers=["X-Total-Count"],
)


def get_group_or_404(group_id: int) -> dict:
    group = data.GROUPS.get(group_id)
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    return group


def check_subject(subject_id: int) -> None:
    if subject_id not in data.SUBJECTS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"Subject {subject_id} does not exist",
        )


def check_unique_name(group_name: str, subject_id: int, ignore_id: int | None = None) -> None:
    for g in data.GROUPS.values():
        if (
            g["group_name"].lower() == group_name.lower()
            and g["subject_id"] == subject_id
            and g["group_id"] != ignore_id
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A group with this name already exists in this subject",
            )


@app.get("/", include_in_schema=False)
def root():
    return {"api": "Study Group Finder", "documentation": "/docs"}


@app.get("/subjects", response_model=list[SubjectOut], tags=["subjects"], summary="Lists the subjects")
def list_subjects():
    return list(data.SUBJECTS.values())


@app.get("/groups", response_model=list[GroupOut], tags=["groups"], summary="Lists groups, with search and pagination")
def list_groups(
    response: Response,
    search: str | None = None,
    subject_id: int | None = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 10,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    groups = sorted(data.GROUPS.values(), key=lambda g: g["group_name"].lower())
    if search is not None:
        groups = [g for g in groups if search.lower() in g["group_name"].lower()]
    if subject_id is not None:
        groups = [g for g in groups if g["subject_id"] == subject_id]
    response.headers["X-Total-Count"] = str(len(groups))
    return groups[offset : offset + limit]


@app.get("/groups/{group_id}", response_model=GroupOut, tags=["groups"], summary="Fetches a group")
def get_group(group_id: int):
    return get_group_or_404(group_id)


@app.post("/groups", response_model=GroupOut, status_code=status.HTTP_201_CREATED, tags=["groups"], summary="Creates a group")
def create_group(new: GroupCreate, response: Response):
    check_subject(new.subject_id)
    check_unique_name(new.group_name, new.subject_id)
    group_id = next(data.GROUP_COUNTER)
    group = {**new.model_dump(), "group_id": group_id, "created_at": datetime.now(timezone.utc)}
    data.GROUPS[group_id] = group
    response.headers["Location"] = f"/groups/{group_id}"
    return group


@app.patch("/groups/{group_id}", response_model=GroupOut, tags=["groups"], summary="Changes only some fields of a group")
def update_group(group_id: int, changes: GroupPatch):
    group = get_group_or_404(group_id)
    fields = changes.model_dump(exclude_unset=True)
    if "subject_id" in fields:
        check_subject(fields["subject_id"])
    check_unique_name(
        fields.get("group_name", group["group_name"]),
        fields.get("subject_id", group["subject_id"]),
        ignore_id=group_id,
    )
    group.update(fields)
    return group


@app.delete("/groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["groups"], summary="Deletes a group")
def delete_group(group_id: int):
    get_group_or_404(group_id)
    del data.GROUPS[group_id]
