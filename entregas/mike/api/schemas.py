"""Models that describe the API data format."""
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class SubjectOut(BaseModel):
    subject_id: int
    name: str
    code: str


class GroupBase(BaseModel):
    group_name: str = Field(min_length=3, max_length=60)
    subject_id: int = Field(gt=0)
    max_participants: int = Field(default=10, ge=2, le=50)
    description: str | None = Field(default=None, max_length=200)


class GroupCreate(GroupBase):
    """Body of POST."""


class GroupPatch(BaseModel):
    """Body of PATCH: omitting a field means not changing it. Only description accepts null."""
    group_name: str | None = Field(default=None, min_length=3, max_length=60)
    subject_id: int | None = Field(default=None, gt=0)
    max_participants: int | None = Field(default=None, ge=2, le=50)
    description: str | None = Field(default=None, max_length=200)

    @field_validator("group_name", "subject_id", "max_participants")
    @classmethod
    def reject_null(cls, value):
        if value is None:
            raise ValueError("this field does not accept null: omit it to leave it unchanged")
        return value


class GroupOut(GroupBase):
    group_id: int
    created_at: datetime
